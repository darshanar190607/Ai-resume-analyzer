import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import { User, Resume, Job } from "./models.js";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// AI Analysis Function with Fallback
const analyzeResumeWithAI = async (resumeText: string, jobDescription: string) => {
  const prompt = `
    You are an expert HR and Technical Recruiter. Analyze the following resume against the provided job description.
    
    Job Description:
    ${jobDescription}
    
    Resume:
    ${resumeText}
    
    Provide a detailed analysis in JSON format with the following structure:
    {
      "score": number (0-100),
      "summary": "A brief overall summary of the candidate's fit",
      "matchedKeywords": ["list", "of", "matched", "skills/keywords"],
      "missingKeywords": ["list", "of", "missing", "critical", "skills/keywords"],
      "strengths": ["list", "of", "candidate", "strengths"],
      "weaknesses": ["list", "of", "areas", "for", "improvement"],
      "recommendations": "Specific advice for the candidate to improve their resume for this role"
    }
  `;

  // Try Gemini first
  try {
    console.log("🔮 Trying Gemini AI for analysis...");
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    const gemini = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING }
          },
          required: ["score", "summary", "matchedKeywords", "missingKeywords", "strengths", "weaknesses", "recommendations"]
        }
      }
    });

    const analysis = JSON.parse(response.text || "{}");
    console.log("✅ Gemini AI analysis successful");
    return { ...analysis, model: "gemini" };
  } catch (geminiError: any) {
    console.log("❌ Gemini AI failed, falling back to Groq:", geminiError.message);
    
    // Fallback to Groq
    try {
      console.log("🤖 Using Groq AI as fallback...");
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error("Groq API key not configured");
      }

      const groq = new Groq({ apiKey: groqApiKey });
      const response = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are an expert HR and Technical Recruiter. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || "{}");
      console.log("✅ Groq AI analysis successful");
      return { ...analysis, model: "groq" };
    } catch (groqError: any) {
      console.error("❌ Both AI models failed:", groqError.message);
      throw new Error("Both Gemini and Groq AI models failed. Please check API keys and try again.");
    }
  }
};
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found. Database features will be disabled.");
    return false;
  }
  try {
    // Set a timeout for the connection attempt
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB Connected Successfully");
    return true;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    return false;
  }
};

async function startServer() {
  await connectDB();
  
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());
  app.use((req, res, next) => {
    res.setTimeout(120000);
    next();
  });

  // Database Readiness Middleware
  app.use((req, res, next) => {
    const publicPaths = ["/api/health", "/api/auth/login", "/api/auth/signup"];
    if (mongoose.connection.readyState !== 1 && !publicPaths.includes(req.path)) {
      return res.status(503).json({ 
        error: "Database connection not established", 
        details: "The server is having trouble connecting to MongoDB. Please verify your MONGODB_URI in settings." 
      });
    }
    next();
  });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, role });
      await user.save();
      res.status(201).json({ message: "User created" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "7d" }
      );
      res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Analyze Resume
  app.post("/api/analyze", authenticate, upload.array("resumes"), async (req: any, res: any) => {
    try {
      const { jobDescription, jobId } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No resume files uploaded" });
      }

      if (!jobDescription) {
        return res.status(400).json({ error: "No job description provided" });
      }

      console.log(`📄 Starting analysis for ${files.length} resume(s) with dual AI models...`);
      const results = [];

      for (const file of files) {
        try {
          // Extract text from PDF
          let resumeText = "";
          try {
            const data = await new PDFParse({ data: file.buffer }).getText();
            resumeText = data.text;
            console.log(`✅ Successfully extracted text from ${file.originalname}: ${resumeText.substring(0, 100)}...`);
          } catch (parseError: any) {
            console.error(`❌ PDF parsing failed for ${file.originalname}:`, parseError.message);
            throw new Error(`Failed to parse PDF: ${parseError.message}`);
          }

          console.log(`📋 Analyzing resume: ${file.originalname}`);

          // Use dual AI analysis function
          const analysis = await analyzeResumeWithAI(resumeText, jobDescription);

          const resultWithMeta = {
            ...analysis,
            fileName: file.originalname,
            id: crypto.randomUUID()
          };

          // Save to MongoDB if connected
          if (mongoose.connection.readyState === 1) {
            const resumeData: any = {
              userName: req.user.name,
              fileName: file.originalname,
              jobDescription,
              jobId: jobId || null,
              score: analysis.score,
              summary: analysis.summary,
              matchedKeywords: analysis.matchedKeywords,
              missingKeywords: analysis.missingKeywords,
              strengths: analysis.strengths,
              weaknesses: analysis.weaknesses,
              recommendations: analysis.recommendations
            };

            // Only add userId if it's not the default admin
            if (req.user.id !== "admin_default") {
              resumeData.userId = req.user.id;
            }

            const resume = new Resume(resumeData);
            await resume.save();
          }

          results.push(resultWithMeta);
          console.log(`✅ Successfully analyzed ${file.originalname} using ${analysis.model} AI`);
        } catch (fileError: any) {
          console.error(`❌ Error analyzing file ${file.originalname}:`, fileError);
          results.push({
            fileName: file.originalname,
            error: "Failed to analyze this resume",
            id: crypto.randomUUID(),
            score: 0,
            summary: "Analysis failed",
            matchedKeywords: [],
            missingKeywords: [],
            strengths: [],
            weaknesses: [],
            recommendations: "Please try again later",
            model: "error"
          });
        }
      }

      console.log(`🎉 Analysis complete. Processed ${results.length} resume(s).`);
      res.json(results);

    } catch (error: any) {
      console.error("🚨 Analysis Error:", error);
      res.status(500).json({ error: "Failed to process resumes", details: error.message });
    }
  });

  // Admin Routes
  app.get("/api/admin/leaderboard", authenticate, async (req: any, res) => {
    console.log("Admin request: /api/admin/leaderboard");
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    try {
      const resumes = await Resume.find().sort({ score: -1 }).limit(50);
      res.json(resumes);
    } catch (error: any) {
      console.error("Leaderboard fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", authenticate, async (req: any, res) => {
    console.log("Admin request: /api/admin/stats");
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    try {
      const totalResumes = await Resume.countDocuments();
      const avgScore = await Resume.aggregate([{ $group: { _id: null, avg: { $avg: "$score" } } }]);
      const topCandidates = await Resume.countDocuments({ score: { $gte: 80 } });
      
      res.json({
        totalResumes,
        avgScore: avgScore[0]?.avg || 0,
        topCandidates
      });
    } catch (error: any) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Job Routes
  app.get("/api/jobs", authenticate, async (req: any, res) => {
    try {
      // For default admin, return all jobs or create a mock user filter
      const query = req.user.id === "admin_default" ? {} : { userId: req.user.id };
      const jobs = await Job.find(query).sort({ createdAt: -1 });
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/jobs", authenticate, async (req: any, res) => {
    try {
      const { title, description } = req.body;
      
      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      const jobData: any = {
        title,
        description
      };

      // Only add userId if it's not the default admin
      if (req.user.id !== "admin_default") {
        jobData.userId = req.user.id;
      }

      const job = new Job(jobData);
      await job.save();
      res.status(201).json(job);
    } catch (error: any) {
      console.error("Job creation error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/jobs/:id", authenticate, async (req: any, res) => {
    try {
      const query = req.user.id === "admin_default" 
        ? { _id: req.params.id } 
        : { _id: req.params.id, userId: req.user.id };
      
      const job = await Job.findOneAndDelete(query);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json({ message: "Job deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get resumes for a specific job (admin only)
  app.get("/api/jobs/:jobId/resumes", authenticate, async (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const resumes = await Resume.find({ jobId: req.params.jobId }).sort({ score: -1 });
      res.json(resumes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get job-specific leaderboard (admin only)
  app.get("/api/jobs/:jobId/leaderboard", authenticate, async (req: any, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const resumes = await Resume.find({ jobId: req.params.jobId }).sort({ score: -1 }).limit(50);
      res.json(resumes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public jobs endpoint for candidates to view
  app.get("/api/public/jobs", async (req, res) => {
    try {
      const jobs = await Job.find().sort({ createdAt: -1 }).select('title description createdAt');
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
