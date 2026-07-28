"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Phone, MessageSquare, Loader2, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface WaVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void; // callback setelah OTP sukses
}

type Step = "phone" | "otp" | "success";

const RATE_LIMIT_SECONDS = 60;

export default function WaVerifyModal({ isOpen, onClose, onVerified }: WaVerifyModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhone("");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setCountdown(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const startCountdown = () => {
    setCountdown(RATE_LIMIT_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setError("");
    if (!phone.trim()) {
      setError("Masukkan nomor WhatsApp kamu.");
      return;
    }
    setLoading(true);
    try {
      await fetchApi("/billing/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setStep("otp");
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      setError(e.message || "Gagal kirim OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);
    try {
      await fetchApi("/billing/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      setError(e.message || "Gagal kirim ulang OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // hanya angka
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // ambil 1 karakter saja
    setOtp(newOtp);
    setError("");

    // Auto-advance ke kotak berikutnya
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit jika semua terisi
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setOtp(digits);
      otpRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length < 6) {
      setError("Masukkan 6 digit kode OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await fetchApi("/billing/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp_code: otpCode }),
      });
      setStep("success");
      // Tunggu sebentar tampilkan animasi sukses, lalu callback
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Kode OTP salah atau kedaluwarsa.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 15, 25, 0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: "modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* Gradient header strip */}
        <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-['Outfit']">Verifikasi WhatsApp</h2>
              <p className="text-xs text-slate-400">Diperlukan sebelum claim free trial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* ── Step: Phone Input ─────────────────────────────────────── */}
        {step === "phone" && (
          <div className="px-6 pb-6 space-y-5">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-700">🔒 Kenapa perlu verifikasi WA?</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Untuk memastikan setiap nomor WhatsApp hanya bisa digunakan untuk <strong>satu akun trial</strong>. 
                Data nomor kamu aman dan tidak disebarkan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Nomor WhatsApp Aktif
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 font-medium border-r border-slate-200 pr-2">+62</span>
                </div>
                <input
                  id="wa-phone-input"
                  type="tel"
                  placeholder="8123456789"
                  value={phone.startsWith("0") ? phone.slice(1) : phone.startsWith("+62") ? phone.slice(3) : phone.startsWith("62") ? phone.slice(2) : phone}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setPhone("0" + raw); // simpan dengan prefix 0
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="w-full pl-24 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-400 focus:ring-0 outline-none text-sm text-slate-800 transition-colors"
                  maxLength={13}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400">Contoh: 081234567890 → ketik 81234567890</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              id="wa-send-otp-btn"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim OTP...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim OTP via WhatsApp</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step: OTP Input ───────────────────────────────────────── */}
        {step === "otp" && (
          <div className="px-6 pb-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-700 font-medium">
                OTP dikirim ke WhatsApp
              </p>
              <p className="text-sm font-bold text-slate-900">{phone}</p>
              <p className="text-xs text-slate-400">Masukkan 6 digit kode yang diterima</p>
            </div>

            {/* OTP Boxes */}
            <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-digit-${i}`}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                  className={`w-11 h-13 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all
                    ${digit ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-900"}
                    focus:border-emerald-500 focus:bg-emerald-50/50
                    disabled:opacity-50`}
                  style={{ height: "3.25rem" }}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              id="wa-verify-otp-btn"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.join("").length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Verifikasi OTP</span>
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Tidak menerima kode?</p>
              <button
                id="wa-resend-otp-btn"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim Ulang OTP"}
              </button>
            </div>

            <button
              onClick={() => { setStep("phone"); setError(""); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Ganti nomor WhatsApp
            </button>
          </div>
        )}

        {/* ── Step: Success ─────────────────────────────────────────── */}
        {step === "success" && (
          <div className="px-6 pb-8 flex flex-col items-center gap-4 text-center">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-200"
              style={{ animation: "successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">WhatsApp Terverifikasi! 🎉</h3>
              <p className="text-sm text-slate-500">Memproses aktivasi free trial kamu...</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Mohon tunggu...</span>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes successPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
