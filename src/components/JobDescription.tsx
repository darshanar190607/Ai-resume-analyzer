import React from "react";
import { cn } from "../lib/utils";

interface JobDescriptionProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescription({ value, onChange }: JobDescriptionProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-black text-[#1a2b4b] uppercase tracking-widest">
        Job Specification
      </label>
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the detailed job description or requirements here..."
          className={cn(
            "w-full h-48 p-6 rounded-none border border-gray-200 bg-white",
            "focus:border-blue-800 focus:ring-0 transition-all outline-none",
            "text-sm leading-relaxed placeholder:text-gray-300 font-medium resize-none"
          )}
        />
        <div className="absolute bottom-4 right-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
          {value.length} Characters
        </div>
      </div>
    </div>
  );
}
