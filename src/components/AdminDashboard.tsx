import React, { useState, useEffect } from "react";
import { Users, Briefcase, Trophy, TrendingUp, FileText, Brain, Loader2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { FileUpload } from "./FileUpload";
import { JobDescription } from "./JobDescription";
import { AnalysisResult } from "./AnalysisResult";
import { AnalysisHistoryItem, Job as JobType } from "../types";

interface AdminDashboardProps {
  token: string;
  jobs: JobType[];
  onAnalyze: (files: File[], jobDescription: string, jobId?: string) => Promise<AnalysisHistoryItem[]>;
}

interface ResumeEntry {
  _id: string;
  fileName: string;
  userName: string;
  score: number;
  jobId: string | null;
  timestamp: string;
  summary: string;
}

type AdminTab = "overview" | "analyze";

export function AdminDashboard({ token, jobs, onAnalyze }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState({ totalResumes: 0, avgScore: 0, topCandidates: 0 });
  const [leaderboard, setLeaderboard] = useState<ResumeEntry[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobCandidates, setJobCandidates] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Analyze tab state
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedAnalyzeJob, setSelectedAnalyzeJob] = useState<JobType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leaderboardRes] = await Promise.all([
          fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/admin/leaderboard", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [statsData, leaderboardData] = await Promise.all([statsRes.json(), leaderboardRes.json()]);
        setStats(statsData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (selectedJob) {
      setCandidatesLoading(true);
      fetch(`/api/jobs/${selectedJob}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setJobCandidates(data))
        .catch(err => console.error(err))
        .finally(() => setCandidatesLoading(false));
    }
  }, [selectedJob, token]);

  const handleAnalyze = async () => {
    if (!files.length || !jobDescription) return;
    setAnalyzing(true);
    setError(null);
    try {
      const data = await onAnalyze(files, jobDescription, selectedAnalyzeJob?._id);
      setResults(data);
      setFiles([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Trophy },
    { id: "analyze", label: "Analyze Resumes", icon: Brain },
  ];

  return (
    <div className="space-y-8">
      {/* Internal Tab Bar */}
      <div className="flex space-x-2 border-b border-gray-100 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
              activeTab === tab.id
                ? "border-[#1a2b4b] text-[#1a2b4b]"
                : "border-transparent text-gray-400 hover:text-[#1a2b4b]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Jobs", value: jobs.length, subtext: "Active postings", icon: Briefcase, color: "blue" },
                { label: "Total Candidates", value: stats.totalResumes, subtext: "All applications", icon: Users, color: "green" },
                { label: "Avg Score", value: `${Math.round(stats.avgScore)}%`, subtext: "Overall match", icon: Trophy, color: "amber" },
                { label: "Shortlisted", value: stats.topCandidates, subtext: "Top candidates", icon: TrendingUp, color: "blue" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 border border-gray-100 shadow-sm flex flex-col space-y-4"
                >
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center",
                    stat.color === "blue" ? "bg-blue-50 text-blue-800" :
                    stat.color === "green" ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
                  )}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-[#1a2b4b]">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1a2b4b] mt-1">{stat.label}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{stat.subtext}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-[#1a2b4b] tracking-tight">Job Candidates Ranking</h3>
                <select
                  value={selectedJob || ""}
                  onChange={(e) => setSelectedJob(e.target.value || null)}
                  className="px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-medium"
                >
                  <option value="">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div className="p-8">
                {candidatesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (selectedJob ? jobCandidates : leaderboard).length === 0 ? (
                  <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-12">
                    {selectedJob
                      ? `No candidates yet for ${jobs.find(j => j._id === selectedJob)?.title}`
                      : "No candidates yet. Analyze resumes to get started."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Rank", "Candidate", "Resume", "Score", "Date"].map(h => (
                            <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(selectedJob ? jobCandidates : leaderboard).slice(0, 10).map((item, index) => (
                          <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-lg font-black text-sm">{index + 1}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-[#1a2b4b] text-white flex items-center justify-center text-xs font-black">
                                  {item.userName.charAt(0)}
                                </div>
                                <span className="text-sm font-black text-[#1a2b4b]">{item.userName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4"><span className="text-sm text-gray-600">{item.fileName}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
                                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: `${item.score}%` }} />
                                </div>
                                <span className="text-sm font-black text-blue-800">{item.score}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "analyze" && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {results.length === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  {/* Job selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Job (Optional)</label>
                    <select
                      value={selectedAnalyzeJob?._id || ""}
                      onChange={(e) => {
                        const job = jobs.find(j => j._id === e.target.value) || null;
                        setSelectedAnalyzeJob(job);
                        if (job) setJobDescription(job.description);
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none text-sm font-medium"
                    >
                      <option value="">— No specific job —</option>
                      {jobs.map(job => (
                        <option key={job._id} value={job._id}>{job.title}</option>
                      ))}
                    </select>
                  </div>

                  <FileUpload files={files} setFiles={setFiles} />
                  <JobDescription value={jobDescription} onChange={setJobDescription} />

                  <button
                    onClick={handleAnalyze}
                    disabled={!files.length || !jobDescription || analyzing}
                    className={cn(
                      "w-full py-4 rounded-2xl font-black text-white transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg uppercase tracking-widest",
                      !files.length || !jobDescription || analyzing
                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                        : "bg-[#1a2b4b] hover:bg-[#0033ad] active:scale-[0.98]"
                    )}
                  >
                    {analyzing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Analyzing {files.length} Resume{files.length > 1 ? "s" : ""}...</span></>
                    ) : (
                      <><Brain className="w-5 h-5" /><span>{files.length > 1 ? `Run Batch Analysis (${files.length})` : "Run AI Analysis"}</span></>
                    )}
                  </button>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-wider">
                      {error}
                    </div>
                  )}
                </div>

                <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-[#1a2b4b] uppercase tracking-tight">How it works</h3>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                      Our AI engine uses advanced NLP to compare resume content with job requirements and rank candidates automatically.
                    </p>
                  </div>
                  <div className="space-y-6">
                    {[
                      { title: "Keyword Matching", desc: "Identifies critical hard and soft skills mentioned in the JD." },
                      { title: "Sentiment Analysis", desc: "Evaluates the tone and impact of experience descriptions." },
                      { title: "Gap Identification", desc: "Pinpoints missing qualifications that might trigger ATS filters." },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg flex-shrink-0 font-black text-xs">{i + 1}</div>
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
                    className="text-[10px] font-black text-indigo-600 hover:underline flex items-center space-x-2 uppercase tracking-widest"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>Back to Analyzer</span>
                  </button>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{results.length} Resumes Analyzed</span>
                </div>
                <div className="space-y-12">
                  {results.map((res) => (
                    <div key={res.id} className="space-y-4">
                      <div className="bg-[#1a2b4b] p-6 rounded-3xl flex items-center justify-between shadow-xl">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-indigo-400" />
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">{res.fileName}</span>
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
      </AnimatePresence>
    </div>
  );
}
