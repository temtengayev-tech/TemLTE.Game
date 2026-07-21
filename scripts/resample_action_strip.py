import argparse
from pathlib import Path

from PIL import Image


KEEP = (0, 1, 2, 3, 5, 9, 10, 11)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("strip", type=Path)
    args = parser.parse_args()
    image = Image.open(args.strip).convert("RGBA")
    if image.width % 12:
        raise SystemExit(f"Expected a 12-frame strip: {args.strip}")
    cell = image.width // 12
    result = Image.new("RGBA", (cell * len(KEEP), image.height))
    for output_index, source_index in enumerate(KEEP):
        frame = image.crop((source_index * cell, 0, (source_index + 1) * cell, image.height))
        result.alpha_composite(frame, (output_index * cell, 0))
    result.save(args.strip, optimize=True)


if __name__ == "__main__":
    main()
