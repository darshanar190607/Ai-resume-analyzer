import React, { useState, useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import { JobDescription } from "./components/JobDescription";
import { AnalysisResult } from "./components/AnalysisResult";
import { Auth } from "./components/Auth";
import { AdminDashboard } from "./components/AdminDashboard";
import { AnalysisResult as AnalysisResultType, AnalysisHistoryItem, AuthState, User, Job as JobType } from "./types";
import { Brain, Loader2, History, Trash2, ChevronRight, LayoutDashboard, FileSearch, Sparkles, LogOut, User as UserIcon, Settings, FileText, Menu, X, Briefcase, BarChart3, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

export default function App() {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem("resume_token"),
    user: JSON.parse(localStorage.getItem("resume_user") || "null"),
  });

  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "resumes" | "analytics" | "admin">(auth.user?.role === "admin" ? "admin" : "jobs");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", description: "" });
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);

  useEffect(() => {
    if (auth.user?.role === "admin") {
      setActiveTab("admin");
    }
  }, [auth.user]);

  useEffect(() => {
    if (auth.token) {
      if (auth.user?.role === "admin") {
        fetchJobs();
      } else {
        fetchPublicJobs();
      }
    }
  }, [auth.token]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };

  const fetchPublicJobs = async () => {
    try {
      const response = await fetch("/api/public/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch public jobs", err);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(newJob),
      });
      if (response.ok) {
        const data = await response.json();
        setJobs([data, ...jobs]);
        setIsCreateJobModalOpen(false);
        setNewJob({ title: "", description: "" });
      }
    } catch (err) {
      console.error("Failed to create job", err);
    }
  };

  const handleLogin = (token: string, user: User) => {
    setAuth({ token, user });
    localStorage.setItem("resume_token", token);
    localStorage.setItem("resume_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("resume_token");
    localStorage.removeItem("resume_user");
    setResults([]);
    setActiveTab("jobs");
  };

  const saveToHistory = (newResults: AnalysisHistoryItem[]) => {
    const updatedHistory = [...newResults, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem("resume_analysis_history", JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("resume_analysis_history");
  };

  const handleAnalyze = async (selectedJobId?: string) => {
    if (files.length === 0 || !jobDescription || !auth.token) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    files.forEach(file => {
      formData.append("resumes", file);
    });
    formData.append("jobDescription", jobDescription);
    if (selectedJobId) {
      formData.append("jobId", selectedJobId);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resumes");
      }

      const data = await response.json();
      // The server returns an array of results with fileName and id already
      const resultsWithTimestamp = data.map((res: any) => ({
        ...res,
        timestamp: Date.now()
      }));
      
      setResults(resultsWithTimestamp);
      saveToHistory(resultsWithTimestamp);
      setFiles([]); // Clear files after successful analysis
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!auth.token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#1a2b4b] flex items-center justify-center text-white rounded-lg">
            <Brain className="w-5 h-5" />
          </div>
          <span className="font-black text-sm tracking-tighter uppercase">AI Analyzer</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col border-r border-gray-100 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center space-x-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-[#1a2b4b] flex items-center justify-center text-white rounded-xl shadow-lg">
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter uppercase leading-none">AI Analyzer</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">RECRUITER PORTAL</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {(
            auth.user?.role === "admin" ? [
              { id: "admin", icon: Settings, label: "Admin Dashboard" },
              { id: "jobs", icon: Briefcase, label: "Manage Jobs" },
              { id: "analytics", icon: BarChart3, label: "Analytics" }
            ] : [
              { id: "jobs", icon: Briefcase, label: "Available Jobs" },
              { id: "resumes", icon: FileText, label: "My Applications" },
              { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" }
            ]
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-widest",
                activeTab === item.id 
                  ? "bg-[#1a1a2e] text-white shadow-xl shadow-blue-900/10" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-[#1a2b4b]"
              )}
            >
              <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-blue-400" : "")} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-gray-50">
          <div className="bg-[#f8fafc] p-4 rounded-xl mb-4 border border-gray-100">
            <p className="text-xs font-black text-[#1a2b4b] truncate">{auth.user?.name || "User"}</p>
            <p className="text-[10px] text-gray-400 font-bold lowercase truncate">{auth.user?.email || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-[11px] font-black text-gray-400 hover:text-red-600 transition-all uppercase tracking-widest rounded-xl hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen relative">
        <header className="p-8 lg:p-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-[#1a2b4b] uppercase">
              {activeTab === "jobs" ? (auth.user?.role === "admin" ? "Manage Jobs" : "Available Jobs") : activeTab}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">
              {activeTab === "jobs" ? (auth.user?.role === "admin" ? "Create and manage job postings" : "Browse and apply to open positions") : "System Overview"}
            </p>
          </div>
          {activeTab === "jobs" && auth.user?.role === "admin" && (
            <button 
              onClick={() => setIsCreateJobModalOpen(true)}
              className="px-6 py-3 bg-[#6366f1] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/20 flex items-center space-x-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </button>
          )}
        </header>

        <div className="px-8 lg:px-12 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === "jobs" && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {jobs.length === 0 ? (
                  <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                      <Briefcase className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-[#1a2b4b] uppercase tracking-tight">
                        {auth.user?.role === "admin" ? "No jobs yet" : "No available positions"}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                        {auth.user?.role === "admin" 
                          ? "Create your first job posting to start analyzing resumes."
                          : "Check back later for new job opportunities."
                        }
                      </p>
                    </div>
                    {auth.user?.role === "admin" && (
                      <button 
                        onClick={() => setIsCreateJobModalOpen(true)}
                        className="px-8 py-3 bg-[#6366f1] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4f46e5] transition-all rounded-xl"
                      >
                        Create First Job
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                      <div key={job._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Briefcase className="w-6 h-6" />
                          </div>
                          {auth.user?.role === "admin" && (
                            <button 
                              onClick={async () => {
                                await fetch(`/api/jobs/${job._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
                                setJobs(jobs.filter(j => j._id !== job._id));
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <h3 className="font-black text-[#1a2b4b] uppercase tracking-tight text-lg mb-2">{job.title}</h3>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest line-clamp-3 mb-6 leading-relaxed">
                          {job.description}
                        </p>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => {
                              setJobDescription(job.description);
                              setSelectedJob(job);
                              setActiveTab("resumes");
                            }}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                          >
                            {auth.user?.role === "admin" ? "Analyze Resumes" : "Apply Now"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "resumes" && (
              <motion.div
                key="resumes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {results.length === 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                      {selectedJob && (
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-4">
                          <h4 className="text-sm font-black text-indigo-800 mb-1">Applying to: {selectedJob.title}</h4>
                          <p className="text-xs text-indigo-600 line-clamp-2">{selectedJob.description}</p>
                        </div>
                      )}
                      <FileUpload files={files} setFiles={setFiles} />
                      <JobDescription value={jobDescription} onChange={setJobDescription} />
                      
                      <button
                        onClick={() => handleAnalyze(selectedJob?._id)}
                        disabled={files.length === 0 || !jobDescription || loading}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black text-white transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg uppercase tracking-widest",
                          files.length === 0 || !jobDescription || loading
                            ? "bg-gray-300 cursor-not-allowed shadow-none"
                            : "bg-[#1a2b4b] hover:bg-[#0033ad] active:scale-[0.98]"
                        )}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{auth.user?.role === "admin" ? `Analyzing ${files.length} Resumes...` : `Analyzing your resume...`}</span>
                          </>
                        ) : (
                          <>
                            <Brain className="w-5 h-5" />
                            <span>{auth.user?.role === "admin" ? 
                              (files.length > 1 ? `Run Batch Analysis (${files.length})` : "Run AI Analysis") : 
                              (files.length > 1 ? "Submit Applications" : "Submit Application")
                            }</span>
                          </>
                        )}
                      </button>

                      {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600">
                          <Trash2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                        </div>
                      )}
                    </div>

                    <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-[#1a2b4b] uppercase tracking-tight">
                          {auth.user?.role === "admin" ? "How it works" : "Your AI Resume Coach"}
                        </h3>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                          {auth.user?.role === "admin" 
                            ? "Our AI engine uses advanced NLP to compare resume content with job requirements and rank candidates automatically."
                            : "Our AI analyzes your resume against the job requirements and provides personalized feedback to help you stand out."
                          }
                        </p>
                      </div>

                      <div className="space-y-6">
                        {(auth.user?.role === "admin" ? [
                          { title: "Keyword Matching", desc: "Identifies critical hard and soft skills mentioned in the JD." },
                          { title: "Sentiment Analysis", desc: "Evaluates the tone and impact of experience descriptions." },
                          { title: "Gap Identification", desc: "Pinpoints missing qualifications that might trigger ATS filters." }
                        ] : [
                          { title: "Smart Analysis", desc: "AI compares your resume with job requirements in real-time." },
                          { title: "Personalized Feedback", desc: "Get specific recommendations to improve your resume." },
                          { title: "Match Score", desc: "See how well your resume matches the job description." }
                        ] as { title: string; desc: string }[]).map((item, i) => (
                          <div key={i} className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg flex-shrink-0 font-black text-xs">
                              {i + 1}
                            </div>
                            <div>
                              <h4 className="font-black text-[#1a2b4b] text-[10px] uppercase tracking-widest">{item.title}</h4>
                              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider mt-1">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setResults([])}
                        className="text-[10px] font-black text-indigo-600 hover:underline flex items-center space-x-2 transition-all uppercase tracking-widest"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        <span>Back to Analyzer</span>
                      </button>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {results.length} Resumes Analyzed
                      </span>
                    </div>
                    
                    <div className="space-y-12">
                      {results.map((res) => (
                        <div key={res.id} className="space-y-4">
                          <div className="bg-[#1a2b4b] p-6 rounded-3xl flex items-center justify-between shadow-xl">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-indigo-400" />
                              <span className="text-[11px] font-black text-white uppercase tracking-widest">
                                {res.fileName}
                              </span>
                            </div>
                            <div className="px-4 py-2 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl">
                              Score: {res.score}%
                            </div>
                          </div>
                          <AnalysisResult result={res} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[
                  { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
                  { label: "Resumes Analyzed", value: history.length, icon: FileText, color: "bg-indigo-50 text-indigo-600" },
                  { label: "Avg. Match Score", value: history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length) + "%" : "0%", icon: Sparkles, color: "bg-purple-50 text-purple-600" },
                  { label: "Active Candidates", value: "12", icon: UserIcon, color: "bg-green-50 text-green-600" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.color)}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-[#1a2b4b] tracking-tighter">{stat.value}</h3>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center"
              >
                <BarChart3 className="w-16 h-16 text-indigo-100 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-[#1a2b4b] uppercase tracking-tight">Analytics Dashboard</h3>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                  Detailed performance metrics and trends will appear here.
                </p>
              </motion.div>
            )}

            {activeTab === "admin" && auth.user?.role === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AdminDashboard
                  token={auth.token}
                  jobs={jobs}
                  onAnalyze={async (files, jobDescription, jobId) => {
                    const formData = new FormData();
                    files.forEach(f => formData.append("resumes", f));
                    formData.append("jobDescription", jobDescription);
                    if (jobId) formData.append("jobId", jobId);
                    const response = await fetch("/api/analyze", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${auth.token}` },
                      body: formData,
                    });
                    if (!response.ok) {
                      const err = await response.json();
                      throw new Error(err.error || "Failed to analyze resumes");
                    }
                    const data = await response.json();
                    return data.map((res: any) => ({ ...res, timestamp: Date.now() }));
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Job Modal */}
        <AnimatePresence>
          {isCreateJobModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a2b4b]/20 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-xl font-black text-[#1a2b4b] uppercase tracking-tight">Create New Job</h3>
                  <button onClick={() => setIsCreateJobModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleCreateJob} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Title</label>
                    <input 
                      required
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all font-medium"
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Description</label>
                    <textarea 
                      required
                      rows={6}
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                      placeholder="Paste the full job description here..."
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-[#6366f1] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Post Job
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
