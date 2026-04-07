import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["candidate", "admin"], default: "candidate" },
  createdAt: { type: Date, default: Date.now },
});

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String, required: true },
  fileName: { type: String, required: true },
  jobDescription: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
  score: { type: Number, required: true },
  summary: { type: String, required: true },
  matchedKeywords: [String],
  missingKeywords: [String],
  strengths: [String],
  weaknesses: [String],
  recommendations: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const JobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Resume = mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);
export const Job = mongoose.models.Job || mongoose.model("Job", JobSchema);
