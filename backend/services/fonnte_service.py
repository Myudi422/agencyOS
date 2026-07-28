"""
Fonnte WhatsApp OTP Service
Mengirim kode OTP via WhatsApp menggunakan Fonnte API (https://docs.fonnte.com/api-send-message/)
"""
import random
import string
import logging
import urllib.request
import urllib.parse
import urllib.error
import json

from backend.config import settings

logger = logging.getLogger("FonnteService")


def generate_otp(length: int = 6) -> str:
    """Generate OTP numerik acak."""
    return "".join(random.choices(string.digits, k=length))


def normalize_phone(phone: str) -> str:
    """
    Normalisasi nomor WA ke format internasional tanpa '+'.
    Contoh: '08123456789' → '628123456789'
             '+6281234567' → '6281234567'
             '6281234567'  → '6281234567'
    """
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if phone.startswith("0"):
        phone = "62" + phone[1:]
    if not phone.startswith("62"):
        phone = "62" + phone
    return phone


def send_otp_whatsapp(phone: str, otp_code: str) -> dict:
    """
    Kirim OTP ke nomor WhatsApp via Fonnte API.

    Args:
        phone: Nomor WA (format apapun, akan dinormalisasi ke 628xxx)
        otp_code: 6-digit OTP code

    Returns:
        dict berisi {'success': bool, 'message': str}
    """
    normalized = normalize_phone(phone)

    message = (
        f"*Shiera - Kode Verifikasi*\n\n"
        f"Kode OTP kamu adalah:\n"
        f"*{otp_code}*\n\n"
        f"Kode berlaku 5 menit. Jangan bagikan kepada siapapun.\n\n"
        f"_Shiera | Kelola Sosmed Dalam Satu Tempat_"
    )

    url = "https://api.fonnte.com/send"
    payload = {
        "target": normalized,
        "message": message,
        "countryCode": "62",
    }

    data = urllib.parse.urlencode(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", settings.FONNTE_TOKEN)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
            result = json.loads(raw)
            logger.info(f"Fonnte response for {normalized}: {result}")

            if result.get("status") is True:
                return {"success": True, "message": "OTP berhasil dikirim ke WhatsApp"}
            else:
                reason = result.get("reason", "Unknown error from Fonnte")
                logger.warning(f"Fonnte send failed for {normalized}: {reason}")
                return {"success": False, "message": f"Gagal kirim OTP: {reason}"}

    except urllib.error.HTTPError as e:
        logger.error(f"Fonnte HTTP error {e.code}: {e.reason}")
        return {"success": False, "message": f"HTTP error saat kirim OTP: {e.code}"}
    except urllib.error.URLError as e:
        logger.error(f"Fonnte URL error: {e.reason}")
        return {"success": False, "message": "Gagal terhubung ke layanan WA. Coba lagi."}
    except Exception as e:
        logger.error(f"Fonnte unexpected error: {e}", exc_info=True)
        return {"success": False, "message": "Error tidak terduga saat kirim OTP."}
