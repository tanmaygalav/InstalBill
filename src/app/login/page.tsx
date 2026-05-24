"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // --- EMAIL & PASSWORD AUTH ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Create new account
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        // Log into existing account
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- GOOGLE OAUTH ---
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to log in with Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF9F2] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-black/5 border border-stone-200 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Image 
            src="/logo.png" 
            alt="InstaBill Logo" 
            width={48} 
            height={48} 
            className="w-12 h-12 rounded-xl mb-4 object-contain shadow-sm"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {isSignUp ? "Start automating your freelance billing." : "Log in to manage your invoices."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" 
                className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-[#111827]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-[#111827]"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md transition-all active:scale-[0.98] mt-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? "Sign Up" : "Log In")}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-stone-200 flex-grow"></div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Or continue with</span>
          <div className="h-px bg-stone-200 flex-grow"></div>
        </div>

        {/* Google Button */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading || isGoogleLoading}
          type="button"
          className="w-full bg-white border border-stone-200 hover:bg-stone-50 text-[#111827] p-3.5 rounded-xl flex items-center justify-center gap-3 font-semibold shadow-sm transition-all active:scale-[0.98] mb-6"
        >
          {isGoogleLoading ? (
             <Loader2 className="animate-spin text-slate-400" size={20} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </>
          )}
        </button>

        {/* Toggle Mode */}
        <p className="text-center text-sm font-medium text-slate-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            type="button"
            className="text-indigo-600 font-bold hover:underline"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>

      </div>
    </div>
  );
}