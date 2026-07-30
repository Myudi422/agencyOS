"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { useSplashStore } from "@/store/useSplashStore";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { showSplash } = useSplashStore();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleLogin = async () => {
    setSigning(true);
    setError(null);
    showSplash("Memverifikasi Autentikasi Google...", 8000);
    try {
      await signInWithGoogle();
      // AuthProvider will handle the redirect after syncing
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Login gagal. Coba lagi.");
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left Panel: Branding ── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 60%, #3b0764 100%)" }}
      >
        {/* Subtle mesh overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full"
            style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full"
            style={{ background: "radial-gradient(circle, #c4b5fd, transparent)" }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <a href="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center p-1 bg-white/20 backdrop-blur-md border border-white/30 shadow-sm"
            >
              <img src="/logo.png" alt="Shiera Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Shiera
            </span>
          </a>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <h2
            className="text-4xl xl:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Satu dasbor.<br />
            Semua platform.
          </h2>
          <p className="text-purple-200 text-base leading-relaxed max-w-xs">
            Jadwalkan, posting, dan pantau konten ke Instagram, TikTok, X, YouTube, dan 10+ platform lainnya — tanpa ribet.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { label: "10+ Platform" },
              { label: "AI Queue Engine" },
              { label: "Real-time Analytics" },
            ].map((b) => (
              <span
                key={b.label}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-purple-100"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <blockquote className="text-purple-200 text-sm italic leading-relaxed">
            "Shiera memangkas waktu kelola sosmed kami 80%."
          </blockquote>
          <p className="text-purple-400 text-xs mt-2 font-medium">— Tim Konten, Studio Kreatif Jakarta</p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-600 p-1.5 flex items-center justify-center shadow-md shadow-purple-500/20">
            <img src="/logo.png" alt="Shiera Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Shiera
          </span>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Selamat datang!
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Masuk untuk mulai mengelola semua sosial media kamu dari satu tempat.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 p-4 rounded-2xl flex items-start gap-3 text-sm"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={signing || isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "white",
              border: "1.5px solid #e2e8f0",
              color: "#1e293b",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            onMouseEnter={e => {
              if (!signing && !isLoading) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#7c3aed";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            }}
          >
            {signing ? (
              <>
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
                />
                <span>Masuk...</span>
              </>
            ) : (
              <>
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400 text-xs font-medium">atau</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Trial CTA */}
          <div
            className="p-4 rounded-2xl text-center space-y-1"
            style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#7c3aed" }}>
              ✨ Trial gratis 3 hari — $0
            </p>
            <p className="text-xs text-slate-500">
              Tidak perlu kartu kredit untuk mulai. Upgrade kapan saja.
            </p>
          </div>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-400 shrink-0 mt-0.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-xs text-slate-400 leading-relaxed">
              Masuk aman via Google OAuth 2.0. Data kamu tidak pernah kami simpan sebagai password.
            </p>
          </div>

          {/* Terms */}
          <p className="mt-8 text-center text-xs text-slate-400">
            Dengan masuk, kamu menyetujui{" "}
            <span className="cursor-pointer hover:underline" style={{ color: "#7c3aed" }}>Terms of Service</span>
            {" "}dan{" "}
            <span className="cursor-pointer hover:underline" style={{ color: "#7c3aed" }}>Privacy Policy</span>
            {" "}Shiera.
          </p>
        </div>
      </div>
    </div>
  );
}
