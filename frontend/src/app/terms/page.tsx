"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, MessageCircle, FileText, CheckCircle2, Lock, HelpCircle } from "lucide-react";

export default function TermsOfServicePage() {
  const waNumber = "6289654728249";
  const waUrl = `https://wa.me/${waNumber}?text=Halo%20Tim%20Shiera,%20saya%20ingin%20bertanya%20mengenai%20Syarat%20%26%20Ketentuan%20Layanan`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-purple-600 p-1.5 flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Shiera Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 font-['Outfit']">
            Shiera<span className="text-purple-600">.</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 px-3.5 py-2 rounded-full transition-all border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        
        {/* Banner Title */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
            <FileText className="w-3.5 h-3.5" />
            Dokumen Legalitas
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
            Syarat &amp; Ketentuan Layanan (Terms of Service)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Terakhir Diperbarui: 13 Agustus 2026 • Harap baca dengan saksama sebelum menggunakan platform Shiera.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</span>
              Ketentuan Umum &amp; Penerimaan Layanan
            </h2>
            <p>
              Dengan mendaftar, mengakses, atau menggunakan platform Shiera (PT. Digital Inter Nusa), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan untuk menggunakan layanan kami.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</span>
              Akun Pengguna &amp; Keamanan Pendaftaran
            </h2>
            <p>
              Untuk menggunakan fitur Shiera, pengguna wajib mendaftar dengan informasi yang akurat dan memverifikasi nomor WhatsApp aktif melalui verifikasi OTP. Anda bertanggung jawab penuh atas kerahasiaan kredensial akun Anda dan seluruh aktivitas yang terjadi di bawah akun Anda.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
              Penggunaan Official Graph API &amp; Kebijakan Platform Sosial Media
            </h2>
            <p>
              Shiera beroperasi sepenuhnya menggunakan API Resmi (Meta Graph API, TikTok Content Posting API, LinkedIn API, YouTube API, X API, Bluesky API). Pengguna wajib mematuhi seluruh panduan komunitas dan kebijakan konten dari masing-masing platform sosial media tersebut. Shiera tidak bertanggung jawab atas tindakan penangguhan akun oleh platform penyedia akibat pelanggaran hak cipta atau kebijakan konten pengguna.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
              Pembayaran, Paket Langganan, &amp; Free Trial
            </h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>Setiap pengguna baru berhak mendapatkan akselerasi Free Trial 3 Hari.</li>
              <li>Pembayaran paket langganan (Creator, Agency, Studio) diproses secara otomatis melalui payment gateway terverifikasi (Midtrans).</li>
              <li>Tagihan langganan bersifat pra-bayar (prepaid) sesuai siklus bulanan yang dipilih.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">5</span>
              Pembatalan &amp; Kebijakan Pengembalian Dana
            </h2>
            <p>
              Anda dapat membatalkan langganan kapan saja melalui menu Billing di Dashboard. Pembatalan akan menghentikan perpanjangan otomatis pada siklus berikutnya. Biaya yang telah dibayarkan untuk periode berjalan bersifat non-refundable (tidak dapat dikembalikan), kecuali terjadi kesalahan teknis penagihan ganda dari pihak sistem.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">6</span>
              Batasan Tanggung Jawab
            </h2>
            <p>
              Shiera berusaha menjaga ketersediaan sistem (uptime) hingga 99.9%. Namun, Shiera tidak bertanggung jawab atas keterlambatan atau kegagalan posting yang disebabkan oleh gangguan server Pihak Ketiga (platform sosmed), pemadaman jaringan internet global, atau pembatasan kuota API dari penyedia platform.
            </p>
          </section>

          {/* Support WA Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-base font-['Outfit'] flex items-center justify-center sm:justify-start gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-200" />
                <span>Membutuhkan Bantuan &amp; Pertanyaan Terms?</span>
              </h3>
              <p className="text-xs text-emerald-100">
                Tim Customer Support Shiera siap melayani Anda melalui WhatsApp resmi fast-response.
              </p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-all flex items-center gap-2 shrink-0 shadow-md"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WA +62 896-5472-8249</span>
            </a>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          <p>© 2026 Shiera Inc. PT. Digital Inter Nusa. All rights reserved.</p>
        </div>

      </main>

    </div>
  );
}
