from __future__ import annotations

from pathlib import Path

from PIL import Image


SOURCE_DIR = Path("public/assets/combat-v1")
OUTPUT_DIR = Path("public/assets/version1-action-strips")
FIGHTERS = ("agent", "officer", "islam", "khabibi", "chalres", "max", "ilia", "daniel")
ROWS = {
    "idle": (0,),
    "run": (1,),
    "jump": (2,),
    "punch": (3,),
    "kick": (4,),
    "roundhouse": (5,),
    "slide": (6,),
    "stagger": (7,),
    "knockdown": (8, 9),
    "recovery": (9,),
}


def extract_rows(sheet: Image.Image, rows: tuple[int, ...]) -> Image.Image:
    cell_width = sheet.width // 8
    cell_height = sheet.height // 10
    strip = Image.new("RGBA", (cell_width * 8 * len(rows), cell_height))
    for output_row, source_row in enumerate(rows):
        crop = sheet.crop((0, source_row * cell_height, sheet.width, (source_row + 1) * cell_height))
        strip.alpha_composite(crop, (output_row * sheet.width, 0))
    return strip


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for fighter in FIGHTERS:
        sheet = Image.open(SOURCE_DIR / f"{fighter}.png").convert("RGBA")
        if sheet.width % 8 or sheet.height % 10:
            raise ValueError(f"{fighter}: expected an 8 by 10 sheet, got {sheet.size}")
        for action, rows in ROWS.items():
            output = OUTPUT_DIR / f"{fighter}-{action}.png"
            extract_rows(sheet, rows).save(output, optimize=True)
            print(f"Wrote {output}")


if __name__ == "__main__":
    main()
