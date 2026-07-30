"""
Gemini Service — AI Statistics Analysis & WebAPI / API Key Adapter
Loads admin-configured Gemini WebAPI cookies (__Secure-1PSID, __Secure-1PSIDTS) or Gemini API key
from global Setting table and generates AI analytics reports.
"""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from backend.models.models import Setting

logger = logging.getLogger("GeminiService")

GLOBAL_WS_ID = "global"


class GeminiService:
    def _get_gemini_credentials(self, db: Session) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Fetch Gemini settings from DB (workspace_id='global').
        Returns (secure_1psid, secure_1psidts, api_key).
        """
        settings_rows = db.query(Setting).filter(Setting.workspace_id == GLOBAL_WS_ID).all()
        settings_map = {s.key: s.value for s in settings_rows}

        psid = settings_map.get("GEMINI_1PSID") or settings_map.get("__Secure-1PSID")
        psidts = settings_map.get("GEMINI_1PSIDTS") or settings_map.get("__Secure-1PSIDTS")
        api_key = settings_map.get("GEMINI_API_KEY")

        # Support JSON string in GEMINI_COOKIES if stored as a single blob
        raw_cookies = settings_map.get("GEMINI_COOKIES")
        if raw_cookies and not (psid and psidts):
            try:
                if isinstance(raw_cookies, str):
                    cookie_data = json.loads(raw_cookies)
                else:
                    cookie_data = raw_cookies
                psid = psid or cookie_data.get("__Secure-1PSID") or cookie_data.get("1PSID")
                psidts = psidts or cookie_data.get("__Secure-1PSIDTS") or cookie_data.get("1PSIDTS")
            except Exception as e:
                logger.warning(f"Failed to parse GEMINI_COOKIES JSON: {e}")

        return (
            str(psid).strip() if psid else None,
            str(psidts).strip() if psidts else None,
            str(api_key).strip() if api_key else None
        )

    async def test_connection(self, db: Session) -> Dict[str, Any]:
        """Test Gemini connection with current DB settings."""
        psid, psidts, api_key = self._get_gemini_credentials(db)

        if not psid and not api_key:
            return {
                "success": False,
                "message": "Cookie Gemini (__Secure-1PSID) atau Gemini API Key belum dikonfigurasi di Admin Settings."
            }

        # Try gemini-webapi cookie first
        if psid:
            try:
                from gemini_webapi import GeminiClient
                client = GeminiClient(secure_1psid=psid, secure_1psidts=psidts)
                await client.init()
                response = await client.generate_content("Ping test. Respond with 'OK'.")
                return {
                    "success": True,
                    "provider": "gemini-webapi (Cookie)",
                    "message": "Koneksi Gemini WebAPI Cookie berhasil!",
                    "sample": getattr(response, "text", str(response))[:100]
                }
            except Exception as exc:
                logger.warning(f"gemini-webapi connection failed: {exc}")
                self._notify_owner_cookie_invalid(str(exc))
                if not api_key:
                    return {
                        "success": False,
                        "provider": "gemini-webapi (Cookie)",
                        "message": f"Gagal menghubungkan Shiera AI: {str(exc)}. Notifikasi WA telah dikirim ke owner.",
                    }


        # Fallback to google-generativeai API key if available
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                res = model.generate_content("Ping test. Respond with 'OK'.")
                return {
                    "success": True,
                    "provider": "Google Generative AI (API Key)",
                    "message": "Koneksi Gemini API Key berhasil!",
                    "sample": res.text[:100]
                }
            except Exception as exc:
                return {
                    "success": False,
                    "provider": "Google Generative AI (API Key)",
                    "message": f"Gagal menghubungkan Gemini API Key: {str(exc)}"
                }

        return {"success": False, "message": "Konfigurasi Gemini tidak valid."}

    async def generate_statistics_summary(
        self,
        stats_data: Dict[str, Any],
        custom_instructions: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_message: Optional[str] = None,
        db: Session = None
    ) -> str:
        """
        Generate AI summary & analysis report or answer follow-up chat messages
        based on workspace statistics feed.
        """
        if not db:
            raise ValueError("Database session required to fetch Gemini settings.")

        psid, psidts, api_key = self._get_gemini_credentials(db)

        if not psid and not api_key:
            raise ValueError("Admin belum mengatur Session Cookie Shiera AI atau API Key di Control Panel.")

        # Prepare summary payload text for prompt
        aggregated = stats_data.get("aggregated", {})
        accounts = stats_data.get("accounts", [])
        top_posts = stats_data.get("top_posts", [])[:5]
        period_label = stats_data.get("period_label", "Semua Waktu")

        accounts_summary_str = "\n".join([
            f"- @{a.get('username', 'N/A')} ({a.get('platform', 'N/A')}): {a.get('post_count', 0)} postingan, "
            f"Likes: {a.get('metrics', {}).get('likes', 0)}, Reach/Views: {a.get('metrics', {}).get('reach', 0) or a.get('metrics', {}).get('video_views', 0)}"
            for a in accounts
        ])

        top_posts_str = "\n".join([
            f"{i+1}. [{p.get('_platform', 'social')}] @{p.get('_account_username', '')}: "
            f"\"{str(p.get('caption') or p.get('text') or 'No caption')[:80]}...\" | "
            f"Likes: {p.get('metrics', {}).get('likes', 0)}, Comments: {p.get('metrics', {}).get('comments', 0)}, "
            f"Shares: {p.get('metrics', {}).get('shares', 0)}, Reach: {p.get('metrics', {}).get('reach', 0)}"
            for i, p in enumerate(top_posts)
        ])

        system_context = f"""
Kamu adalah Shiera AI Senior Analytics Specialist & Chief Marketing Officer (CMO).
Tugasmu adalah membantu pengguna Shiera menganalisis statistik sosial media mereka dan berdiskusi secara interaktif.

### DATA METRIK STATISTIK ({period_label}):
- Total Postingan: {aggregated.get('total_posts', 0)}
- Total Likes: {aggregated.get('likes', 0):,}
- Total Komentar: {aggregated.get('comments', 0):,}
- Total Shares / Reposts: {aggregated.get('shares', 0):,}
- Total Saved / Favorites: {aggregated.get('favorites', 0):,}
- Total Jangkauan (Reach): {aggregated.get('reach', 0):,}
- Total Video Views: {aggregated.get('video_views', 0):,}
- Rata-rata Engagement Rate: {aggregated.get('engagement_rate', 0)}%

### DAFTAR AKUN TERHUBUNG:
{accounts_summary_str if accounts_summary_str else "Tidak ada akun terhubung."}

### KONTEN TERTINGGI (TOP POSTS):
{top_posts_str if top_posts_str else "Belum ada postingan dalam periode ini."}

---

### PEDOMAN KETAT PENULISAN SHIERA AI:
1. Tuliskan jawaban dalam Bahasa Indonesia yang sangat profesional, ramah, dan solutif.
2. DILARANG KERAS menggunakan tag HTML mentah, blok kode Python (seperti ```python), atau sintaksis kode pemrograman. HANYA gunakan Bahasa Indonesia murni dan poin-poin markdown sederhana.
3. Gunakan penulisan bold (**teks**) dan poin list (* ) dengan rapi tanpa simbol mentah yang mengganggu.
"""

        # Build prompt based on whether it's initial summary generation or a follow-up conversation
        if user_message:
            # Build conversation log from chat_history
            history_str = ""
            if chat_history:
                for msg in chat_history[-6:]:
                    role_label = "Pengguna" if msg.get("sender") == "user" else "Shiera AI"
                    history_str += f"{role_label}: {msg.get('text', '')}\n\n"

            prompt = f"""
{system_context}

### RIWAYAT PERCAKAPAN:
{history_str}

Pengguna: {user_message}

Shiera AI: Berikan jawaban kelanjutan yang membantu, spesifik, dan ramah berdasarkan data statistik di atas.
"""
        else:
            prompt = f"""
{system_context}

{f"### INSTRUKSI KHUSUS:\n{custom_instructions}" if custom_instructions else ""}

### FORMAT LAPORAN WALKAN PERTAMA:

## 📊 1. Ringkasan Eksekutif Performa
(Berikan kesimpulan umum tentang performa dalam 2-3 kalimat tajam, soroti pencapaian utama dan engagement rate)

## 🔥 2. Analisis Konten Terbaik & Faktor Keberhasilan
(Bedah mengapa konten teratas berhasil, hook apa yang bekerja, pola visual/teks apa yang menarik audience)

## 📈 3. Evaluasi Performa Per Platform & Akun
(Bandingkan performa antar akun sosial media, platform mana yang memberikan jangkauan/interaksi tertinggi)

## 🎯 4. Rekomendasi Taktis & Action Plan
(Berikan 3-5 langkah aksi konkrit yang harus dilakukan pengguna minggu ini untuk meningkatkan reach dan jangkauan konten berikutnya)
"""

        # 1. Try gemini-webapi cookie if available
        if psid:
            try:
                from gemini_webapi import GeminiClient
                client = GeminiClient(secure_1psid=psid, secure_1psidts=psidts)
                await client.init()
                response = await client.generate_content(prompt)
                text_res = getattr(response, "text", str(response))
                cleaned_text = self._clean_code_interpreter_artifacts(text_res)
                if cleaned_text and len(cleaned_text.strip()) > 10:
                    return cleaned_text
            except Exception as exc:
                logger.warning(f"gemini-webapi generation failed, fallbacking: {exc}")
                self._notify_owner_cookie_invalid(str(exc))

        # 2. Try google-generativeai API Key as fallback
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                res = model.generate_content(prompt)
                if res.text:
                    return self._clean_code_interpreter_artifacts(res.text)
            except Exception as exc:
                logger.error(f"google-generativeai API Key generation failed: {exc}")
                raise RuntimeError(f"Gagal memproses dengan Shiera AI Engine: {exc}")

        raise RuntimeError("Gagal menghasilkan laporan AI. Pastikan Session Cookie Shiera AI atau API Key valid di Admin Settings.")

    _last_wa_alert_time: float = 0.0
    OWNER_WA_NUMBER: str = "082125182347"

    def _notify_owner_cookie_invalid(self, error_detail: str):
        """Kirim notifikasi WA via Fonnte ke owner jika cookie session Shiera AI tidak valid."""
        import time
        from datetime import datetime
        now = time.time()
        # Cooldown 30 menit (1800 detik) agar tidak spam WA owner
        if now - GeminiService._last_wa_alert_time < 1800:
            return

        GeminiService._last_wa_alert_time = now
        try:
            from backend.services.fonnte_service import send_whatsapp_notification
            message = (
                f"⚠️ *PERINGATAN SHIERA AI ENGINE*\n\n"
                f"Halo Owner! Session Cookie Shiera AI (`__Secure-1PSID`) terdeteksi *KADALUARSA / TIDAK VALID*!\n\n"
                f"📌 *Detail Error*: {str(error_detail)[:150]}\n"
                f"📌 *Waktu*: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
                f"Sistem saat ini otomatis dialihkan ke Fallback API Key. Silakan update Cookie Session baru di Admin Panel Shiera (/admin).\n\n"
                f"_Shiera AI Monitor Engine_"
            )
            send_whatsapp_notification(self.OWNER_WA_NUMBER, message)
        except Exception as e:
            logger.error(f"Failed to send WA alert to owner: {e}")


    def _clean_code_interpreter_artifacts(self, text: str) -> str:
        """Strip out python/text code interpreter blocks generated by Gemini WebAPI."""
        import re
        if not text:
            return ""
        # Strip ```python?code...``` and ```text?code...``` blocks
        cleaned = re.sub(r'```\w*\?code[^\n]*\n[\s\S]*?```', '', text)
        cleaned = re.sub(r'```[^\n]*codereference[^\n]*\n[\s\S]*?```', '', cleaned)
        cleaned = re.sub(r'```[^\n]*codestdout[^\n]*\n[\s\S]*?```', '', cleaned)
        cleaned = re.sub(r'```python[^\n]*\nlikes = [\s\S]*?```', '', cleaned)
        # Collapse multiple blank lines
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()


gemini_service = GeminiService()





gemini_service = GeminiService()
