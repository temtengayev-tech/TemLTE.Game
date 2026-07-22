from pathlib import Path

from PIL import Image, ImageDraw

from verify_version_one_strips import ACTIONS, FIGHTERS


ROOT = Path("public/assets/version1-action-strips")
OUTPUT = Path(".codex-animation-audit")
ROW_WIDTH = 1680
ROW_HEIGHT = 220


def main() -> None:
    OUTPUT.mkdir(exist_ok=True)
    for fighter in FIGHTERS:
        sheet = Image.new("RGBA", (ROW_WIDTH, ROW_HEIGHT * len(ACTIONS)), (15, 15, 15, 255))
        draw = ImageDraw.Draw(sheet)
        for row, action in enumerate(ACTIONS):
            strip = Image.open(ROOT / f"{fighter}-{action}.png").convert("RGBA")
            scale = min((ROW_WIDTH - 140) / strip.width, (ROW_HEIGHT - 20) / strip.height)
            resized = strip.resize((round(strip.width * scale), round(strip.height * scale)), Image.Resampling.LANCZOS)
            sheet.alpha_composite(resized, (130, row * ROW_HEIGHT + (ROW_HEIGHT - resized.height) // 2))
            draw.text((12, row * ROW_HEIGHT + 95), action.upper(), fill="white")
        sheet.save(OUTPUT / f"{fighter}.png", optimize=True)


if __name__ == "__main__":
    main()
