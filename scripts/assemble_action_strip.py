import argparse
from pathlib import Path

from PIL import Image


CELL = 420
FRAMES_PER_PART = 4


def normalized_cell(frame: Image.Image) -> Image.Image:
    bounds = frame.getchannel("A").getbbox()
    canvas = Image.new("RGBA", (CELL, CELL))
    if not bounds:
        return canvas
    fighter = frame.crop(bounds)
    scale = min((CELL - 24) / fighter.width, (CELL - 24) / fighter.height)
    fighter = fighter.resize(
        (round(fighter.width * scale), round(fighter.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas.alpha_composite(fighter, ((CELL - fighter.width) // 2, CELL - fighter.height - 12))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--frames-per-input", type=int, default=FRAMES_PER_PART)
    args = parser.parse_args()
    frames: list[Image.Image] = []
    for path in args.inputs:
        image = Image.open(path).convert("RGBA")
        for index in range(args.frames_per_input):
            left = round(index * image.width / args.frames_per_input)
            right = round((index + 1) * image.width / args.frames_per_input)
            frames.append(normalized_cell(image.crop((left, 0, right, image.height))))
    strip = Image.new("RGBA", (CELL * len(frames), CELL))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * CELL, 0))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.output, optimize=True)


if __name__ == "__main__":
    main()
