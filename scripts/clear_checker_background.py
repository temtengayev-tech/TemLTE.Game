from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def clear_checker(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            is_light_neutral = min(red, green, blue) >= 218 and max(red, green, blue) - min(red, green, blue) <= 12
            if alpha and is_light_neutral:
                pixels[x, y] = (red, green, blue, 0)
    image.save(path, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("images", nargs="+", type=Path)
    args = parser.parse_args()
    for path in args.images:
        clear_checker(path)


if __name__ == "__main__":
    main()
