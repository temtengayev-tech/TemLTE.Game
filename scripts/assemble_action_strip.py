from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageOps


CELL = 420
FRAMES_PER_PART = 4
EDGE_CLEANUP = 18
FRAME_PADDING = 20


def clear_panel_edge_lines(frame: Image.Image) -> Image.Image:
    cleaned = frame.copy()
    pixels = cleaned.load()
    width, height = cleaned.size
    for y in range(height):
        for x in range(width):
            if x >= EDGE_CLEANUP and x < width - EDGE_CLEANUP and y >= EDGE_CLEANUP and y < height - EDGE_CLEANUP:
                continue
            red, green, blue, alpha = pixels[x, y]
            if alpha:
                pixels[x, y] = (red, green, blue, 0)
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()
    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < width and 0 <= y < height):
            continue
        visited.add((x, y))
        red, green, blue, alpha = pixels[x, y]
        if alpha == 0:
            continue
        pixels[x, y] = (red, green, blue, 0)
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return cleaned


def clear_light_checker_background(frame: Image.Image) -> Image.Image:
    """Remove a baked neutral checkerboard, including checker cells boxed by dividers."""
    cleaned = frame.copy()
    pixels = cleaned.load()
    width, height = cleaned.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha and min(red, green, blue) >= 218 and max(red, green, blue) - min(red, green, blue) <= 12:
                pixels[x, y] = (red, green, blue, 0)
    return cleaned


def frame_bounds(frame: Image.Image) -> tuple[int, int, int, int] | None:
    return frame.getchannel("A").getbbox()


def adaptive_slices(image: Image.Image, count: int) -> list[Image.Image]:
    alpha = image.getchannel("A")
    boundaries = [0]
    search_radius = max(24, image.width // count // 3)
    for index in range(1, count):
        target = round(index * image.width / count)
        candidates = range(max(boundaries[-1] + 1, target - search_radius), min(image.width - 1, target + search_radius))
        boundary = min(candidates, key=lambda x: (alpha.crop((x, 0, x + 1, image.height)).getbbox() is not None, abs(x - target)))
        boundaries.append(boundary)
    boundaries.append(image.width)
    return [image.crop((boundaries[index], 0, boundaries[index + 1], image.height)) for index in range(count)]


def opaque_components(frame: Image.Image) -> list[list[int]]:
    alpha = frame.getchannel("A")
    values = alpha.tobytes()
    width, height = frame.size
    visited = bytearray(len(values))
    components: list[list[int]] = []
    for start, value in enumerate(values):
        if value <= 8 or visited[start]:
            continue
        visited[start] = 1
        component: list[int] = []
        queue = deque([start])
        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            for neighbor in (index - width, index + width, index - 1, index + 1):
                if neighbor < 0 or neighbor >= len(values) or visited[neighbor] or values[neighbor] <= 8:
                    continue
                if neighbor == index - 1 and x == 0 or neighbor == index + 1 and x == width - 1:
                    continue
                visited[neighbor] = 1
                queue.append(neighbor)
        components.append(component)
    return components


def component_image(frame: Image.Image, component: list[int]) -> Image.Image:
    values = frame.getchannel("A").tobytes()
    cleaned_alpha = bytearray(len(values))
    for index in component:
        cleaned_alpha[index] = values[index]
    cleaned = frame.copy()
    cleaned.putalpha(Image.frombytes("L", frame.size, bytes(cleaned_alpha)))
    return cleaned


def keep_largest_component(frame: Image.Image) -> Image.Image:
    components = opaque_components(frame)
    return component_image(frame, max(components, key=len)) if components else frame


def component_slices(image: Image.Image, count: int) -> list[Image.Image]:
    components = sorted(opaque_components(image), key=len, reverse=True)[:count]
    if len(components) != count:
        raise ValueError(f"expected {count} poses, found {len(components)}")
    width = image.width
    components.sort(key=lambda component: sum(index % width for index in component) / len(component))
    return [component_image(image, component) for component in components]


def normalized_cell(frame: Image.Image, scale: float) -> Image.Image:
    bounds = frame_bounds(frame)
    canvas = Image.new("RGBA", (CELL, CELL))
    if not bounds:
        return canvas
    fighter = frame.crop(bounds)
    fighter = fighter.resize(
        (round(fighter.width * scale), round(fighter.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas.alpha_composite(
        fighter,
        ((CELL - fighter.width) // 2, CELL - fighter.height - FRAME_PADDING),
    )
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--frames-per-input", type=int, default=FRAMES_PER_PART)
    parser.add_argument("--grid-columns", type=int, default=0, help="Read each input as a row-major grid instead of one horizontal row")
    parser.add_argument("--mirror-input-frames", action="store_true")
    parser.add_argument("--mirror-frame", action="append", type=int, default=[], help="One-based output frame index to mirror")
    parser.add_argument("--replace-frame", action="append", default=[], help="Replace TARGET with SOURCE using one-based indices")
    parser.add_argument("--adaptive-slices", action="store_true")
    parser.add_argument("--component-slices", action="store_true")
    parser.add_argument("--largest-component", action="store_true")
    parser.add_argument("--clear-light-checker", action="store_true")
    args = parser.parse_args()
    raw_frames: list[Image.Image] = []
    for path in args.inputs:
        image = Image.open(path).convert("RGBA")
        if args.clear_light_checker:
            image = clear_light_checker_background(image)
        if args.grid_columns:
            if args.frames_per_input % args.grid_columns:
                raise ValueError("frames-per-input must be divisible by grid-columns")
            rows = args.frames_per_input // args.grid_columns
            slices = [
                image.crop((
                    round(column * image.width / args.grid_columns),
                    round(row * image.height / rows),
                    round((column + 1) * image.width / args.grid_columns),
                    round((row + 1) * image.height / rows),
                ))
                for row in range(rows)
                for column in range(args.grid_columns)
            ]
        else:
            slices = component_slices(image, args.frames_per_input) if args.component_slices else adaptive_slices(image, args.frames_per_input) if args.adaptive_slices else [
            image.crop((
                round(index * image.width / args.frames_per_input),
                0,
                round((index + 1) * image.width / args.frames_per_input),
                image.height,
            ))
            for index in range(args.frames_per_input)
            ]
        for sliced in slices:
            frame = sliced if args.adaptive_slices else clear_panel_edge_lines(sliced)
            if args.largest_component:
                frame = keep_largest_component(frame)
            frame_index = len(raw_frames) + 1
            should_mirror = args.mirror_input_frames or frame_index in args.mirror_frame
            raw_frames.append(ImageOps.mirror(frame) if should_mirror else frame)
    for replacement in args.replace_frame:
        target_text, source_text = replacement.split(":", 1)
        raw_frames[int(target_text) - 1] = raw_frames[int(source_text) - 1].copy()
    sizes = [
        (bounds[2] - bounds[0], bounds[3] - bounds[1])
        for frame in raw_frames
        if (bounds := frame_bounds(frame))
    ]
    if not sizes:
        frames = [Image.new("RGBA", (CELL, CELL)) for _ in raw_frames]
    else:
        widest = max(width for width, _ in sizes)
        tallest = max(height for _, height in sizes)
        shared_scale = min(
            (CELL - FRAME_PADDING * 2) / widest,
            (CELL - FRAME_PADDING * 2) / tallest,
        )
        frames = [normalized_cell(frame, shared_scale) for frame in raw_frames]
    strip = Image.new("RGBA", (CELL * len(frames), CELL))
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (index * CELL, 0))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.output, optimize=True)


if __name__ == "__main__":
    main()
