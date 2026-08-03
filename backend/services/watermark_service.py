"""
Watermark Service — High Performance Image Watermarking Engine for agencyOS
Uses Python Pillow (PIL) to apply customizable text or image logo watermarks
to social media images (JPEG, PNG, WebP) with 9-point grid positioning, opacity,
and scaling.
"""

import io
import base64
import logging
from typing import Dict, Any, Optional, Tuple, Union
import httpx
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

logger = logging.getLogger("WatermarkService")

# Position Grid Map (X, Y offset calculation)
GRID_POSITIONS = [
    "top_left", "top_center", "top_right",
    "center_left", "center", "center_right",
    "bottom_left", "bottom_center", "bottom_right"
]

class WatermarkService:
    def __init__(self):
        pass

    def _calculate_coordinates(
        self,
        base_size: Tuple[int, int],
        wm_size: Tuple[int, int],
        position: str,
        margin: int = 20
    ) -> Tuple[int, int]:
        """Calculates top-left (X, Y) coordinate for watermark placement based on 9-point grid."""
        bw, bh = base_size
        ww, wh = wm_size

        position = position.lower() if position else "bottom_right"

        # Horizontal coordinate
        if "left" in position:
            x = margin
        elif "right" in position:
            x = bw - ww - margin
        else:  # center
            x = (bw - ww) // 2

        # Vertical coordinate
        if "top" in position:
            y = margin
        elif "bottom" in position:
            y = bh - wh - margin
        else:  # center
            y = (bh - wh) // 2

        # Clamp to bounds
        x = max(0, min(x, bw - ww))
        y = max(0, min(y, bh - wh))

        return (x, y)

    def _fetch_remote_image(self, url: str) -> Optional[Image.Image]:
        """Download remote logo image via httpx."""
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                r = client.get(url)
                if r.status_code == 200:
                    return Image.open(io.BytesIO(r.content)).convert("RGBA")
        except Exception as e:
            logger.error(f"Failed to fetch watermark logo from URL '{url}': {e}")
        return None

    def apply_watermark(
        self,
        image_input: Union[bytes, str, Image.Image],
        config: Dict[str, Any]
    ) -> Image.Image:
        """
        Applies a watermark (Text or Image Logo) onto the base image.
        
        Config schema:
        {
            "mode": "image" | "text",
            "text_content": "@brandhandle",
            "text_color": "#ffffff",
            "image_url": "https://...",
            "position": "bottom_right",
            "opacity": 0.8,   # 0.1 to 1.0
            "scale": 0.2,     # 0.1 to 0.4 (10% to 40% of base width)
            "margin": 20
        }
        """
        # 1. Load Base Image
        if isinstance(image_input, bytes):
            base_img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, str):
            if image_input.startswith("data:image"):
                # Base64 string
                b64_data = image_input.split(",", 1)[1]
                base_img = Image.open(io.BytesIO(base64.b64decode(b64_data)))
            else:
                base_img = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            base_img = image_input.copy()
        else:
            raise ValueError("Unsupported image input format.")

        original_format = base_img.format or "JPEG"
        base_rgba = base_img.convert("RGBA")
        bw, bh = base_rgba.size

        # Extract config values
        mode = config.get("mode") or config.get("default_mode") or "text"
        position = config.get("position", "bottom_right")
        opacity = float(config.get("opacity", 0.8))
        opacity = max(0.1, min(1.0, opacity))
        scale = float(config.get("scale", 0.2))
        scale = max(0.08, min(0.5, scale))
        margin = int(config.get("margin", 20))

        # Create transparent overlay canvas matching base size
        overlay = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))

        if mode == "image" and config.get("image_url"):
            # ── IMAGE LOGO WATERMARK ──
            logo_img = self._fetch_remote_image(config["image_url"])
            if logo_img:
                # Scale logo width relative to base image width
                target_ww = max(30, int(bw * scale))
                w_percent = target_ww / float(logo_img.size[0])
                target_wh = max(30, int(float(logo_img.size[1]) * w_percent))

                logo_resized = logo_img.resize((target_ww, target_wh), Image.Resampling.LANCZOS)

                # Adjust logo opacity
                if opacity < 1.0:
                    r, g, b, alpha = logo_resized.split()
                    alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
                    logo_resized = Image.merge("RGBA", (r, g, b, alpha))

                # Calculate position
                pos_x, pos_y = self._calculate_coordinates((bw, bh), (target_ww, target_wh), position, margin)
                overlay.paste(logo_resized, (pos_x, pos_y), logo_resized)
            else:
                # Fallback to text mode if logo fetch failed
                mode = "text"

        if mode == "text" or not config.get("image_url"):
            # ── TEXT WATERMARK ──
            text = str(config.get("text_content") or config.get("username") or "@agencyOS").strip()
            text_color_hex = str(config.get("text_color", "#ffffff")).lstrip("#")
            
            try:
                r_c = int(text_color_hex[0:2], 16)
                g_c = int(text_color_hex[2:4], 16)
                b_c = int(text_color_hex[4:6], 16)
            except Exception:
                r_c, g_c, b_c = 255, 255, 255

            alpha_val = int(255 * opacity)

            # Dynamic font sizing relative to image width
            font_size = max(16, int(bw * (scale * 0.4)))
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except OSError:
                font = ImageFont.load_default()

            draw = ImageDraw.Draw(overlay)
            
            # Get text bounding box for accurate positioning
            bbox = draw.textbbox((0, 0), text, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]

            pos_x, pos_y = self._calculate_coordinates((bw, bh), (tw, th), position, margin)

            # Draw subtle text shadow/background pill for high contrast
            padding = 8
            bg_box = [pos_x - padding, pos_y - padding, pos_x + tw + padding, pos_y + th + padding]
            draw.rounded_rectangle(bg_box, radius=6, fill=(0, 0, 0, int(alpha_val * 0.4)))

            # Draw text
            draw.text((pos_x, pos_y), text, fill=(r_c, g_c, b_c, alpha_val), font=font)

        # Composite overlay onto base image
        composed = Image.alpha_composite(base_rgba, overlay)

        # Convert RGBA to RGB safely (flatten transparency to white background to prevent JPEG RGBA error)
        if composed.mode == "RGBA":
            background = Image.new("RGB", composed.size, (255, 255, 255))
            background.paste(composed, mask=composed.split()[3])
            return background

        return composed.convert("RGB")

    def preview_watermark_base64(
        self,
        image_bytes: bytes,
        config: Dict[str, Any]
    ) -> str:
        """Returns base64 data URI string of watermarked image for frontend live preview."""
        out_img = self.apply_watermark(image_bytes, config)
        if out_img.mode != "RGB":
            out_img = out_img.convert("RGB")
        buf = io.BytesIO()
        out_img.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64_str}"

watermark_service = WatermarkService()
