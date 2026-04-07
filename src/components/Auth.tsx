import React, { useState } from "react";
import { Brain, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"company" | "individual">("individual");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    role: "candidate" as "candidate" | "admin",
  });

  // Update defaults when user type changes
  const handleUserTypeChange = (type: "company" | "individual") => {
    setUserType(type);
    if (type === "company") {
      const companyData = {
        ...formData,
        email: "darshanneurolabs@gmail.com",
        password: "HackDragons@123",
        role: "admin" as const
      };
      setFormData(companyData);
      
      // Auto-login for company in login mode
      if (isLogin) {
        autoLogin(companyData);
      }
    } else {
      setFormData({
        ...formData,
        email: "",
        password: "",
        role: "candidate"
      });
    }
  };

  const autoLogin = async (data: typeof formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Authentication failed");
      onLogin(result.token, result.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: userType === "company" ? formData.companyName : formData.name
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Authentication failed");

      if (isLogin) {
        onLogin(data.token, data.user);
      } else {
        setIsLogin(true);
        setError("Account created! Please log in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-800" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[520px] bg-white p-12 rounded-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border border-gray-100 relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-[#1a2b4b] flex items-center justify-center text-white mb-6 shadow-xl">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-[32px] font-black tracking-tighter text-[#1a2b4b] mb-2 uppercase">
            {isLogin ? "Portal Access" : "Create Account"}
          </h1>
          <p className="text-[#6b7280] text-[10px] font-black uppercase tracking-[0.3em]">
            AI RESUME ANALYZER • {userType === "company" ? "IT COMPANY" : "INDIVIDUAL"}
          </p>
        </div>

        {/* User Type Selector */}
        <div className="flex mb-10 border-2 border-gray-100 p-1">
          <button
            type="button"
            onClick={() => handleUserTypeChange("individual")}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
              userType === "individual" ? "bg-[#1a2b4b] text-white shadow-lg" : "text-gray-400 hover:text-[#1a2b4b]"
            )}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => handleUserTypeChange("company")}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
              userType === "company" ? "bg-[#1a2b4b] text-white shadow-lg" : "text-gray-400 hover:text-[#1a2b4b]"
            )}
          >
            IT Company
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-black text-[#1a2b4b] uppercase tracking-widest">
                  {userType === "company" ? "Company Name" : "Full Name"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    {userType === "company" ? <Brain className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>
                  <input
                    type="text"
                    required
                    value={userType === "company" ? formData.companyName : formData.name}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [userType === "company" ? "companyName" : "name"]: e.target.value 
                    })}
                    className="w-full pl-12 pr-4 py-4 rounded-none border-2 border-gray-100 focus:border-blue-800 transition-all outline-none text-sm font-medium"
                    placeholder={userType === "company" ? "e.g. Neurolabs" : "e.g. Darshan AR"}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1a2b4b] uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-none border-2 border-gray-100 focus:border-blue-800 transition-all outline-none text-sm font-medium"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#1a2b4b] uppercase tracking-widest">Security Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-4 rounded-none border-2 border-gray-100 focus:border-blue-800 transition-all outline-none text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 text-[10px] font-black text-center uppercase tracking-widest border-l-4",
                error.includes("created") ? "bg-green-50 text-green-700 border-green-500" : "bg-red-50 text-red-700 border-red-500"
              )}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#1a2b4b] hover:bg-[#0033ad] text-white rounded-none font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center shadow-xl active:translate-y-1 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center space-x-3">
                <span>{isLogin ? "Authorize Access" : "Initialize Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            {isLogin ? "New to the platform? " : "Already registered? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-800 hover:underline transition-all ml-1"
            >
              {isLogin ? "Create Account" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
