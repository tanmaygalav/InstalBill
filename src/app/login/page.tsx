"use client";

import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // This is your live Vercel domain where users go after logging in
        redirectTo: "https://instabill.vercel.app/dashboard",
      },
    });

    if (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF9F2] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-stone-200 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="InstaBill Logo"
            width={48}
            height={48}
            className="rounded-xl"
          />
        </div>

        <h1 className="text-2xl font-bold text-[#111827] mb-2">
          Sign in to InstaBill
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Access your invoicing dashboard instantly.
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-stone-50 border border-stone-200 text-[#111827] p-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-slate-400" size={20} />
          ) : (
            <>
              {/* Google's official G logo SVG */}
              <svg
                width="18"
                height="18"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
