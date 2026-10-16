"""Board image renderer, copied verbatim from the September one-shot study
(evaluations/2026-09-17-one-shot/prepare_boards.py, render_png) so new boards
match the original images pixel for pixel. Requires Pillow and macOS Arial.
"""
from __future__ import annotations

from pathlib import Path


def render_png(size: int, regions: list[list[int]], path: Path) -> None:
    """Render a 720px blank board with labels and no queen marks."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as exc:  # pragma: no cover - environment-dependent
        raise RuntimeError("Pillow is required to render PNG board previews.") from exc

    canvas = 768
    margin_left, margin_top = 54, 54
    margin_right, margin_bottom = 18, 18
    board_px = min(canvas - margin_left - margin_right, canvas - margin_top - margin_bottom)
    cell_px = board_px // size
    board_px = cell_px * size
    image = Image.new("RGB", (canvas, canvas), "white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", max(13, min(28, 240 // size)))
        label_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", max(12, min(20, 170 // size)))
    except OSError:
        font = ImageFont.load_default()
        label_font = font

    palette = [
        (244, 183, 177), (183, 218, 244), (190, 232, 190), (238, 219, 165),
        (218, 195, 238), (246, 204, 153), (178, 226, 218), (235, 190, 223),
        (205, 211, 238), (218, 228, 177), (245, 210, 186), (188, 216, 235),
    ]
    board_x, board_y = margin_left, margin_top
    for row in range(size):
        for column in range(size):
            x0 = board_x + column * cell_px
            y0 = board_y + row * cell_px
            x1, y1 = x0 + cell_px, y0 + cell_px
            draw.rectangle((x0, y0, x1, y1), fill=palette[regions[row][column] % len(palette)])
            letter = chr(ord("A") + regions[row][column])
            bbox = draw.textbbox((0, 0), letter, font=font)
            tx = x0 + (cell_px - (bbox[2] - bbox[0])) / 2
            ty = y0 + (cell_px - (bbox[3] - bbox[1])) / 2 - bbox[1]
            draw.text((tx, ty), letter, fill=(35, 35, 35), font=font)

    # Strong outer border and cell lines keep the image legible to vision models.
    draw.rectangle((board_x, board_y, board_x + board_px, board_y + board_px), outline=(30, 30, 30), width=4)
    for index in range(1, size):
        x = board_x + index * cell_px
        y = board_y + index * cell_px
        draw.line((x, board_y, x, board_y + board_px), fill=(65, 65, 65), width=2)
        draw.line((board_x, y, board_x + board_px, y), fill=(65, 65, 65), width=2)
    for index in range(size):
        col_text = str(index + 1)
        row_text = str(index + 1)
        draw.text((board_x + index * cell_px + cell_px / 2 - 4, 26), col_text, fill=(20, 20, 20), font=label_font)
        draw.text((22, board_y + index * cell_px + cell_px / 2 - 8), row_text, fill=(20, 20, 20), font=label_font)
    image.save(path, format="PNG", optimize=True)
