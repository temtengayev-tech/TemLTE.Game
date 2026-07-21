import argparse
from collections import deque
from pathlib import Path

from PIL import Image

from assemble_action_strip import CELL, normalized_cell


def components(image: Image.Image) -> list[tuple[int, int, int, int]]:
    alpha = image.getchannel("A")
    width, height = image.size
    mask = bytearray(1 if value > 48 else 0 for value in alpha.getdata())
    found: list[tuple[int, int, int, int, int]] = []
    for origin, present in enumerate(mask):
        if not present:
            continue
        queue = deque([origin])
        mask[origin] = 0
        left = right = origin % width
        top = bottom = origin // width
        area = 0
        while queue:
            index = queue.popleft()
            x, y = index % width, index // width
            area += 1
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            for neighbour in (index - 1, index + 1, index - width, index + width):
                if neighbour < 0 or neighbour >= len(mask) or not mask[neighbour]:
                    continue
                nx = neighbour % width
                if abs(nx - x) > 1:
                    continue
                mask[neighbour] = 0
                queue.append(neighbour)
        if area > 700:
            found.append((left, top, right + 1, bottom + 1, area))
    return [(left, top, right, bottom) for left, top, right, bottom, _ in sorted(found, key=lambda item: item[0])]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--expected", type=int, required=True)
    args = parser.parse_args()
    image = Image.open(args.input).convert("RGBA")
    boxes = components(image)
    if len(boxes) != args.expected:
        raise SystemExit(f"Expected {args.expected} full poses, found {len(boxes)}: {boxes}")
    strip = Image.new("RGBA", (CELL * len(boxes), CELL))
    for index, box in enumerate(boxes):
        strip.alpha_composite(normalized_cell(image.crop(box)), (index * CELL, 0))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.output, optimize=True)


if __name__ == "__main__":
    main()
