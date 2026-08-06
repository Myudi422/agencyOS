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
                text = self._generate_with_generative_ai(api_key, "Ping test. Respond with 'OK'.")
                return {
                    "success": True,
                    "provider": "Google Generative AI (API Key)",
                    "message": "Koneksi Gemini API Key berhasil!",
                    "sample": text[:100]
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
                text_res = self._generate_with_generative_ai(api_key, prompt)
                if text_res:
                    return self._clean_code_interpreter_artifacts(text_res)
            except Exception as exc:
                logger.error(f"google-generativeai API Key generation failed: {exc}")
                raise RuntimeError(f"Gagal memproses dengan Shiera AI Engine: {exc}")

        raise RuntimeError("Gagal menghasilkan laporan AI. Pastikan Session Cookie Shiera AI atau API Key valid di Admin Settings.")

    async def generate_content_brainstorm(
        self,
        accounts_info: List[Dict[str, Any]],
        content_pillar: str,
        content_format: str,
        user_idea: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        db: Session = None
    ) -> str:
        """
        Generate structured content brief & post composer payload based on account briefing,
        content pillar, content format (single image, carousel, video/reels), and user idea.
        """
        if not db:
            raise ValueError("Database session required to fetch Gemini settings.")

        psid, psidts, api_key = self._get_gemini_credentials(db)

        if not psid and not api_key:
            raise ValueError("Admin belum mengatur Session Cookie Shiera AI atau API Key di Control Panel.")

        acc_briefings_str = ""
        for acc in accounts_info:
            b = acc.get("briefing") or {}
            acc_briefings_str += (
                f"- **@{acc.get('username')} ({acc.get('platform')})**:\n"
                f"  * Brand: {b.get('brand_name') or acc.get('name') or 'N/A'}\n"
                f"  * Deskripsi: {b.get('business_description') or 'Belum diisi'}\n"
                f"  * Target Audiens: {b.get('target_audience') or 'Umum'}\n"
                f"  * Tone of Voice: {b.get('tone_of_voice') or 'Kasual & Profesional'}\n"
                f"  * Pilar Konten: {', '.join(b.get('content_pillars') or []) or 'Umum'}\n"
                f"  * Do's & Don'ts: {b.get('dos_and_donts') or 'Bebas'}\n\n"
            )

        format_instruction = ""
        if content_format == "carousel":
            format_instruction = """
FORMAT YANG DIMINTA: CAROUSEL (MULTI-SLIDE)
Berikan rincian slide per slide:
- Slide 1 (Cover Hook): Judul utama & Hook visual
- Slide 2-4 (Poin Utama): Penjelasan tiap poin per slide
- Slide 5 (Penutup & CTA): Call to Action
Berikan juga Copywriting Caption pendukung & 5 Hashtags.
Set post_type di JSON payload menjadi "carousel".
"""
        elif content_format == "video":
            format_instruction = """
FORMAT YANG DIMINTA: VIDEO / REELS / TIKTOK / SHORTS
Berikan Script Video Detik demi Detik:
- Detik 0-3 (Hook): On-screen Text + Voiceover + Visual Hook
- Detik 4-15 (Body Script): Penjelasan utama & aksi kamera
- Detik 16-20 (Outro & CTA): Closing action
Berikan juga saran Audio Mood, Caption Feed, & 5 Hashtags.
Set post_type di JSON payload menjadi "video".
"""
        elif content_format == "single_image":
            format_instruction = """
FORMAT YANG DIMINTA: SINGLE IMAGE (FEED POST)
Berikan:
- Visual Concept: Deskripsi elemen gambar/grafis yang perlu didesain
- Headline / Hook Teks di Gambar
- Copywriting Caption Lengkap
- Call to Action & 5 Hashtags
Set post_type di JSON payload menjadi "image".
"""
        else:
            format_instruction = """
FORMAT: REKOMENDASI AI
Tentukan format terbaik (Single Image, Carousel, atau Video/Reels) berdasarkan ide user, berikan briefing sesuai format terbaik tersebut, dan set post_type di JSON payload ("image", "carousel", atau "video").
"""

        history_str = ""
        if chat_history:
            for msg in chat_history[-4:]:
                role_label = "Pengguna" if msg.get("sender") == "user" else "Shiera AI"
                history_str += f"{role_label}: {msg.get('text', '')}\n\n"

        prompt = f"""
Kamu adalah Shiera AI Chief Marketing Officer (CMO) & Senior Content Strategist.
Tugasmu adalah membuat Briefing Konten Kreatif, Sangat Detail, & Siap Pakai untuk pengguna.

### DATA BRIEFING BRAND AKUN:
{acc_briefings_str}

### PARAMETER KONTEN:
- Pilar Konten: {content_pillar}
- Format Konten Target: {content_format}
- Permintaan Ide / Topik Pengguna: {user_idea}

{f"### RIWAYAT CHAT:\n{history_str}" if history_str else ""}

{format_instruction}

### PEDOMAN HASIL OUTPUT (MANDATORI):
1. Tuliskan jawaban dalam Bahasa Indonesia yang sangat menginspirasi, terstruktur, ramah, dan solutif.
2. Gunakan format Markdown yang rapi dengan emoji, bold, dan bullet points.
3. DI AKHIR JAWABANMU, KAMU WAJIB MENYERTAKAN KODE JSON DENGAN KEY `composer_payload` AGAR USER BISA LANGSUNG MENTRANSFER DRAFT KE SHIERA POST COMPOSER!
4. PASTI KAN FIELD `caption` DI DALAM `composer_payload` HANYA BERISI TEKS COPYWRITING / CAPTION PURE UNTUK FEED (HAPUS SEMUA JUDUL MARKDOWN '### 🖼️ Visual Concept' ATAU CATATAN INTERNAL LAINNYA DARINYA).

CONTOH BLOK JSON TERSEMBUNYI DI AKHIR JAWABAN:
```json
{{
  "composer_payload": {{
    "post_type": "image",
    "caption": "Tuliskan murni teks caption/copywriting yang siap tayang di instagram/tiktok di sini...",
    "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
  }}
}}
```
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
                text_res = self._generate_with_generative_ai(api_key, prompt)
                if text_res:
                    return self._clean_code_interpreter_artifacts(text_res)
            except Exception as exc:
                logger.error(f"google-generativeai API Key generation failed: {exc}")
                raise RuntimeError(f"Gagal memproses dengan Shiera AI Engine: {exc}")

        raise RuntimeError("Gagal menghasilkan brief AI. Pastikan Session Cookie Shiera AI atau API Key valid di Admin Settings.")

    async def generate_agent_content(
        self,
        accounts_info: List[Dict[str, Any]],
        content_pillar: str,
        content_format: str,
        user_idea: str,
        variation_index: int = 1,
        total_variations: int = 1,
        db: Session = None
    ) -> str:
        """
        Generate concise, direct AI Agent draft content (no conversational fluff).
        Structured specifically into:
        1. Teks Konten (Visual Text / Slide breakdown / Video script)
        2. Caption & Hashtags
        3. Hidden JSON payload for Post Composer
        """
        if not db:
            raise ValueError("Database session required to fetch Gemini settings.")

        psid, psidts, api_key = self._get_gemini_credentials(db)

        if not psid and not api_key:
            raise ValueError("Admin belum mengatur Session Cookie Shiera AI atau API Key di Control Panel.")

        acc_briefings_str = ""
        for acc in accounts_info:
            b = acc.get("briefing") or {}
            acc_briefings_str += (
                f"- **@{acc.get('username')} ({acc.get('platform')})**:\n"
                f"  * Brand: {b.get('brand_name') or acc.get('name') or 'N/A'}\n"
                f"  * Deskripsi: {b.get('business_description') or 'Belum diisi'}\n"
                f"  * Target Audiens: {b.get('target_audience') or 'Umum'}\n"
                f"  * Tone of Voice: {b.get('tone_of_voice') or 'Kasual & Profesional'}\n"
                f"  * Pilar Konten: {', '.join(b.get('content_pillars') or []) or 'Umum'}\n"
                f"  * Do's & Don'ts: {b.get('dos_and_donts') or 'Bebas'}\n\n"
            )

        variation_note = f"\n(Variasi Opsi ke-{variation_index} dari {total_variations}. Buat sudut pandang/headline unik yang berbeda dari opsi lain)." if total_variations > 1 else ""

        format_instruction = ""
        if content_format == "carousel":
            format_instruction = """
FORMAT: CAROUSEL (MULTI-SLIDE)
Sajikan Teks Tulisan Per Slide:
- Slide 1 (Cover Hook): [Teks Headline Utama & Sub-hook]
- Slide 2: [Teks Poin 1]
- Slide 3: [Teks Poin 2]
- Slide 4: [Teks Poin 3]
- Slide 5 (CTA): [Teks Penutup & Call to Action]
"""
            post_type_val = "carousel"
        elif content_format == "video":
            format_instruction = """
FORMAT: VIDEO / REELS / TIKTOK / SHORTS
Sajikan Video Script:
- Detik 0-3 (Visual Hook): [On-screen Text & Action] | Voiceover: "..."
- Detik 4-15 (Isi Script): [On-screen Text & Action] | Voiceover: "..."
- Detik 16-20 (Closing & CTA): [On-screen Text & Action] | Voiceover: "..."
"""
            post_type_val = "video"
        else:
            format_instruction = """
FORMAT: SINGLE POST / FEED IMAGE
Sajikan Teks Tulisan Gambar:
- Headline Utama di Gambar: "..."
- Sub-text / Visual Highlight: "..."
"""
            post_type_val = "image"

        prompt = f"""
Kamu adalah AI Content Generator khusus Shiera AI Agent.
Tugasmu adalah membuat DRAFT KONTEN HARIAN LANGSUNG, RINGKAS, & TO THE POINT.
DILARANG memberikan pembuka, salam, evaluasi, atau basa-basi analisis. Langsung ke isi konten.

### DATA BRAND AKUN:
{acc_briefings_str}

### PARAMETER:
- Pilar Konten: {content_pillar}
- Format Konten: {content_format}
- Ide / Topik Hint: {user_idea} {variation_note}

{format_instruction}

### ATURAN FORMAT MANDATORI (WAJIB TEPAT MURNI MARKDOWN DENGAN 2 SEKSI BERIKUT):

### 📝 TEKS KONTEN
(Sajikan teks tulisan gambar / slide breakdown / video script sesuai format di atas)

### ✍️ CAPTION & HASHTAGS
(Sajikan caption copywriting lengkap siap tayang, langsung diakhiri 5 hashtag paling relevan)

```json
{{
  "composer_payload": {{
    "post_type": "{post_type_val}",
    "caption": "Tuliskan caption copywriting murni lengkap yang siap posting di sini...",
    "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
  }}
}}
```
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
                text_res = self._generate_with_generative_ai(api_key, prompt)
                if text_res:
                    return self._clean_code_interpreter_artifacts(text_res)
            except Exception as exc:
                logger.error(f"google-generativeai API Key generation failed: {exc}")
                raise RuntimeError(f"Gagal memproses dengan Shiera AI Engine: {exc}")

        raise RuntimeError("Gagal menghasilkan brief AI. Pastikan Session Cookie Shiera AI atau API Key valid di Admin Settings.")

    def _generate_with_generative_ai(self, api_key: str, content_inputs: Any) -> str:
        """Helper to invoke google.generativeai with model fallback candidates (1.5-flash, 1.5-flash-latest, 2.0-flash, 1.5-pro, etc.)."""
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        is_vision = isinstance(content_inputs, list) and len(content_inputs) > 1
        model_candidates = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite",
            "gemini-2.5-pro",
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro",
            "gemini-pro-vision" if is_vision else "gemini-pro",
        ]

        last_error = None
        for m_name in model_candidates:
            try:
                model = genai.GenerativeModel(m_name)
                res = model.generate_content(content_inputs)
                if res and hasattr(res, "text") and res.text:
                    logger.info(f"google-generativeai call succeeded using model: {m_name}")
                    return res.text
            except Exception as e:
                last_error = e
                logger.debug(f"Model candidate '{m_name}' failed: {e}")
                continue

        raise RuntimeError(f"All Generative AI model candidates failed. Last error: {last_error}")

    async def generate_caption_from_image(
        self,
        image_url: str,
        post_type: str = "image",
        accounts_info: Optional[List[Dict[str, Any]]] = None,
        custom_instructions: Optional[str] = None,
        db: Session = None
    ) -> Dict[str, str]:
        """
        Analyze an image (slide ke-1 or video cover thumbnail) using Gemini Multimodal Vision.
        Incorporates Social Account Briefings (brand, tone of voice, pillars, target audience)
        and outputs a JSON containing 'caption' and 'hashtags'.
        """
        if not db:
            raise ValueError("Database session required to fetch Gemini settings.")

        psid, psidts, api_key = self._get_gemini_credentials(db)

        if not psid and not api_key:
            raise ValueError("Admin belum mengatur Session Cookie Shiera AI atau API Key di Control Panel.")

        acc_briefings_str = ""
        if accounts_info:
            for acc in accounts_info:
                b = acc.get("briefing") or {}
                if isinstance(b, dict) and any(b.values()):
                    acc_briefings_str += (
                        f"- **@{acc.get('username')} ({acc.get('platform')})**:\n"
                        f"  * Brand: {b.get('brand_name') or acc.get('name') or 'N/A'}\n"
                        f"  * Deskripsi: {b.get('business_description') or 'N/A'}\n"
                        f"  * Target Audiens: {b.get('target_audience') or 'Umum'}\n"
                        f"  * Tone of Voice: {b.get('tone_of_voice') or 'Kasual & Profesional'}\n"
                        f"  * Pilar Konten: {', '.join(b.get('content_pillars') or []) if isinstance(b.get('content_pillars'), list) else 'Umum'}\n"
                        f"  * Do's & Don'ts: {b.get('dos_and_donts') or 'Bebas'}\n\n"
                    )

        prompt = f"""
Kamu adalah Shiera AI Senior Copywriter & Social Media Director.
Tugas utamanya adalah menganalisis GAMBAR (Slide 1 Konten / Sampul Video Thumbnail) yang diberikan, lalu membuat Copywriting Caption & 5 Hashtags yang sangat menarik, kreatif, relevan dengan visual, dan persuasif.

{f"### BRIEFING BRAND AKUN SOSIAL MEDIA TERHUBUNG:\n{acc_briefings_str}" if acc_briefings_str else ""}

### PARAMETER KONTEN:
- Format Post: {post_type.upper()}
{f"- Instruksi Tambahan Pengguna: {custom_instructions}" if custom_instructions else ""}

### PETUNJUK PENULISAN:
1. Analisis detail visual pada gambar (objek, suasana, teks pada gambar jika ada, warna, tema).
2. Tuliskan copywriting caption Bahasa Indonesia yang kuat, memiliki hook pembuka yang memikat, memuat pesan utama dari gambar, dan diakhiri Call to Action (CTA) yang natural.
3. Sesuaikan gaya bahasa/tone of voice dengan briefing brand jika ada.
4. Berikan tepat 5 hashtag yang paling relevan dengan isi gambar dan niche brand.

### FORMAT OUTPUT WAJIB (HANYA BERIKAN BLOK JSON BERIKUT DENGAN TEREPAT DUA KEY):
```json
{{
  "caption": "Tuliskan caption copywriting lengkap di sini...",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
}}
```
"""

        # Fetch & compress image bytes for ultra-fast multimodal vision call
        import httpx, io
        from PIL import Image

        image_bytes = None
        content_type = "image/jpeg"
        pil_img = None

        if image_url:
            try:
                async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                    resp = await client.get(image_url)
                    if resp.status_code == 200:
                        raw_bytes = resp.content
                        try:
                            img = Image.open(io.BytesIO(raw_bytes))
                            if img.mode in ("RGBA", "P", "LA"):
                                img = img.convert("RGB")
                            # Downscale high-res images to max 1024x1024 for instant processing
                            img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                            buf = io.BytesIO()
                            img.save(buf, format="JPEG", quality=80, optimize=True)
                            image_bytes = buf.getvalue()
                            pil_img = Image.open(io.BytesIO(image_bytes))
                        except Exception as e:
                            logger.warning(f"Image resize optimization notice: {e}")
                            image_bytes = raw_bytes
            except Exception as e:
                logger.warning(f"Failed to download image for vision API from {image_url}: {e}")

        # 1. Try google-generativeai API Key FIRST if available (Fastest & most reliable for multimodal vision)
        if api_key:
            try:
                content_inputs = [prompt]
                if pil_img:
                    content_inputs.append(pil_img)
                elif image_bytes:
                    content_inputs.append({
                        "mime_type": content_type if "image" in content_type else "image/jpeg",
                        "data": image_bytes
                    })

                text_res = self._generate_with_generative_ai(api_key, content_inputs)
                if text_res:
                    cleaned = self._clean_code_interpreter_artifacts(text_res)
                    parsed = self._extract_caption_json(cleaned)
                    if parsed.get("caption"):
                        return parsed
            except Exception as exc:
                logger.warning(f"google-generativeai vision API Key generation failed, trying webapi fallback: {exc}")

        # 2. Try gemini-webapi cookie if available (with 15s timeout to prevent stream hangs)
        if psid and image_bytes:
            import tempfile, os
            temp_path = None
            try:
                ext = ".png" if "png" in content_type else ".webp" if "webp" in content_type else ".jpg"
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                    tmp.write(image_bytes)
                    temp_path = tmp.name

                from gemini_webapi import GeminiClient
                client = GeminiClient(secure_1psid=psid, secure_1psidts=psidts)
                await client.init()
                response = await asyncio.wait_for(
                    client.generate_content(prompt, images=[temp_path]),
                    timeout=15.0
                )
                text_res = getattr(response, "text", str(response))
                cleaned = self._clean_code_interpreter_artifacts(text_res)
                parsed = self._extract_caption_json(cleaned)
                if parsed.get("caption"):
                    return parsed
            except Exception as exc:
                logger.warning(f"gemini-webapi vision generation failed: {exc}")
                self._notify_owner_cookie_invalid(str(exc))
            finally:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass

        raise RuntimeError("Session Cookie Shiera AI kadaluarsa dan API Key belum dikonfigurasi. Silakan perbarui Cookie/API Key di Admin Panel (/admin).")

    def _extract_caption_json(self, text: str) -> Dict[str, str]:
        """Extract caption and hashtags from Gemini JSON output or text response."""
        import re, json
        if not text:
            return {"caption": "", "hashtags": ""}
        
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        blob = json_match.group(1) if json_match else text

        try:
            data = json.loads(blob.strip())
            if isinstance(data, dict):
                caption = data.get("caption", "").strip()
                hashtags = data.get("hashtags", "").strip()
                if caption:
                    return {"caption": caption, "hashtags": hashtags}
        except Exception:
            pass

        lines = text.strip().split("\n")
        caption_lines = []
        hashtags_list = []
        for line in lines:
            if line.strip().startswith("#"):
                hashtags_list.append(line.strip())
            else:
                caption_lines.append(line)

        return {
            "caption": "\n".join(caption_lines).strip(),
            "hashtags": " ".join(hashtags_list).strip()
        }


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
