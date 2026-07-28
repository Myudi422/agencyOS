"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { Sparkles, Chrome, Shield, Zap, BarChart3, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleLogin = async () => {
    setSigning(true);
    setError(null);
    try {
      await signInWithGoogle();
      // AuthProvider will handle the redirect after syncing
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Login gagal. Coba lagi.");
      setSigning(false);
    }
  };

  const features = [
    { icon: Globe, label: "10+ Platform Sosmed", desc: "Instagram, TikTok, Facebook, X, YouTube & more" },
    { icon: Zap, label: "AI-Powered Queue", desc: "Auto-schedule & retry engine tanpa batas" },
    { icon: BarChart3, label: "Analytics Real-time", desc: "Track performance semua akun dalam satu dashboard" },
    { icon: Shield, label: "Enterprise Secure", desc: "Firebase Auth + enkripsi token end-to-end" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

        {/* Left — Branding */}
        <div className="text-center lg:text-left space-y-8">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-500/40">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Outfit']">Shiera</h1>
              <p className="text-xs text-purple-300 font-medium">Kelola Sosmed Dalam Satu Tempat</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight font-['Outfit']">
              Kelola semua<br />
              <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                platform sosmed
              </span><br />
              dari satu tempat
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">
              Publish, schedule, dan track konten ke 10+ platform secara bersamaan. Dengan AI queue engine yang cerdas dan analytics real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{f.label}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — Login Card */}
        <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-black/40">
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-xl font-bold text-white font-['Outfit']">Selamat Datang!</h3>
              <p className="text-sm text-slate-300">
                Masuk untuk mulai mengelola<br />social media Anda
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs text-center">
                {error}
              </div>
            )}

            <button
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={signing || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-gray-50 text-slate-800 font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {signing ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                  <span>Masuk...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Masuk dengan Google</span>
                </>
              )}
            </button>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Shield className="w-4 h-4 text-purple-300 shrink-0" />
                <p className="text-[11px] text-slate-300">
                  Login aman dengan Google OAuth. Data kamu tidak pernah kami simpan sebagai password.
                </p>
              </div>
              <p className="text-center text-[10px] text-slate-500">
                Dengan masuk, kamu menyetujui{" "}
                <span className="text-purple-400 hover:underline cursor-pointer">Terms of Service</span>{" "}
                dan{" "}
                <span className="text-purple-400 hover:underline cursor-pointer">Privacy Policy</span>.
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              ✨ Coba <span className="text-purple-300 font-semibold">Trial 3 hari gratis ($0)</span>,
              wajib tautkan kartu kredit/debit setelah login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
