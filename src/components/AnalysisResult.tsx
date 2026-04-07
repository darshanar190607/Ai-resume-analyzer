import React from "react";
import { AnalysisResult as AnalysisResultType } from "../types";
import { CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Lightbulb, FileText, Share2, Download } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "../lib/utils";

interface AnalysisResultProps {
  result: AnalysisResultType;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const data = [
    { name: "Score", value: result.score },
    { name: "Remaining", value: 100 - result.score },
  ];

  const COLORS = [
    result.score > 80 ? "#10b981" : result.score > 60 ? "#0033ad" : result.score > 40 ? "#f59e0b" : "#ef4444",
    "#f3f4f6",
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-10 rounded-none border-t-4 border-blue-800 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center text-center">
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  startAngle={90}
                  endAngle={450}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-[#1a2b4b] tracking-tighter">{result.score}%</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">MATCH SCORE</span>
            </div>
          </div>
          <div className="mt-6">
             <p className={cn(
               "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-none border-2",
               result.score > 80 ? "border-green-500 text-green-600" : result.score > 60 ? "border-blue-800 text-blue-800" : result.score > 40 ? "border-amber-500 text-amber-600" : "border-red-500 text-red-600"
             )}>
               {result.score > 80 ? "EXCELLENT FIT" : result.score > 60 ? "STRONG FIT" : result.score > 40 ? "MODERATE FIT" : "WEAK FIT"}
             </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-10 rounded-none shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] space-y-6 border border-gray-100">
          <div className="flex items-center space-x-2 text-gray-400">
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">EXECUTIVE SUMMARY</span>
          </div>
          <p className="text-xl text-[#1a2b4b] leading-relaxed font-medium italic border-l-4 border-blue-800 pl-6 py-2">
            "{result.summary}"
          </p>
          <div className="pt-6 flex space-x-4">
            <button className="flex items-center space-x-2 px-6 py-3 bg-[#1a2b4b] text-white rounded-none text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[#0033ad] shadow-lg">
              <Download className="w-4 h-4" />
              <span>EXPORT REPORT</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-100 text-[#1a2b4b] rounded-none text-[10px] font-black uppercase tracking-widest transition-all hover:border-blue-800">
              <Share2 className="w-4 h-4" />
              <span>SHARE ANALYSIS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keywords Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center space-x-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">MATCHED SKILLS</span>
            </div>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-none border border-green-100">
              {result.matchedKeywords.length} IDENTIFIED
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.matchedKeywords.map((kw, i) => (
              <span key={i} className="px-3 py-2 bg-gray-50 text-[#1a2b4b] text-[10px] font-black uppercase tracking-widest border border-gray-100 hover:border-green-500 transition-colors">
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <TrendingDown className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">SKILL GAPS</span>
            </div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-none border border-amber-100">
              {result.missingKeywords.length} MISSING
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.missingKeywords.map((kw, i) => (
              <span key={i} className="px-3 py-2 bg-gray-50 text-[#1a2b4b] text-[10px] font-black uppercase tracking-widest border border-gray-100 hover:border-amber-500 transition-colors">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-blue-800 border-b border-gray-50 pb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">KEY STRENGTHS</span>
          </div>
          <ul className="space-y-4">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start space-x-4 text-sm text-gray-600 font-medium">
                <div className="mt-1.5 w-1.5 h-1.5 bg-blue-800 flex-shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-8 rounded-none border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-red-600 border-b border-gray-50 pb-4">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">AREAS FOR IMPROVEMENT</span>
          </div>
          <ul className="space-y-4">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start space-x-4 text-sm text-gray-600 font-medium">
                <div className="mt-1.5 w-1.5 h-1.5 bg-red-600 flex-shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-[#1a2b4b] p-12 rounded-none shadow-2xl space-y-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -rotate-45 translate-x-32 -translate-y-32" />
        <div className="flex items-center space-x-3 text-blue-400 relative z-10">
          <Lightbulb className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">STRATEGIC ADVISORY</span>
        </div>
        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed font-medium relative z-10">
          <ReactMarkdown>{result.recommendations}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
