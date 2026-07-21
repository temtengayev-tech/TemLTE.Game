from pathlib import Path
from PIL import Image

ASSETS = Path("public/assets")
OUTPUT = ASSETS / "combat-v1"
FIGHTERS = ("agent", "officer", "john", "conor", "islam", "khabibi", "chalres")
NEW_FIGHTERS = {
    "max": {"movement": 8, "attacks": 8, "jump-recovery": 7, "reactions": 8},
    "ilia": {"movement": 8, "attacks": 8, "jump-recovery": 8, "reactions": 8},
    "daniel": {"movement": 9, "attacks": 7, "jump-recovery": 7, "reactions": 8},
}
CELL = 300
FRAMES = 8


def single_fighter(frame: Image.Image) -> Image.Image:
    """Remove detached pieces leaked in from neighbouring generated rows."""
    alpha = frame.getchannel("A")
    pixels = alpha.load()
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []
    for y in range(frame.height):
        for x in range(frame.width):
            if pixels[x, y] < 28 or (x, y) in seen:
                continue
            stack = [(x, y)]
            seen.add((x, y))
            component: list[tuple[int, int]] = []
            while stack:
                point = stack.pop()
                component.append(point)
                px, py = point
                for neighbour in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    nx, ny = neighbour
                    if 0 <= nx < frame.width and 0 <= ny < frame.height and pixels[nx, ny] >= 28 and neighbour not in seen:
                        seen.add(neighbour)
                        stack.append(neighbour)
            components.append(component)
    if not components:
        return frame
    keep = set(max(components, key=len))
    cleaned = frame.copy()
    cleaned_alpha = cleaned.getchannel("A")
    cleaned_pixels = cleaned_alpha.load()
    for y in range(frame.height):
        for x in range(frame.width):
            if (x, y) not in keep:
                cleaned_pixels[x, y] = 0
    cleaned.putalpha(cleaned_alpha)
    return cleaned


def cells(path: Path, columns: int, row: int = 0, rows: int = 1) -> list[Image.Image]:
    image = Image.open(path).convert("RGBA")
    top, bottom = round(row * image.height / rows), round((row + 1) * image.height / rows)
    return [image.crop((round(index * image.width / columns), top,
                        round((index + 1) * image.width / columns), bottom)) for index in range(columns)]


def remove_green(frame: Image.Image) -> Image.Image:
    pixels = frame.load()
    for y in range(frame.height):
        for x in range(frame.width):
            red, green, blue, alpha = pixels[x, y]
            dominance = green - max(red, blue)
            if green > 85 and dominance > 18:
                alpha = max(0, min(alpha, 255 - dominance * 4))
                red = min(255, red + max(0, dominance - 35) // 2)
                green = min(green, max(red, blue) + 12)
                pixels[x, y] = red, green, blue, alpha
    return frame


def eight(frames: list[Image.Image]) -> list[Image.Image]:
    if len(frames) == FRAMES:
        return frames
    return [frames[round(index * (len(frames) - 1) / (FRAMES - 1))] for index in range(FRAMES)]


def idle_to_idle(frames: list[Image.Image], idle: Image.Image) -> list[Image.Image]:
    """Every controllable action visibly leaves guard and returns to guard."""
    sequence = eight(frames)
    return [idle, *sequence[1:-1], idle]


def place(frame: Image.Image) -> Image.Image:
    alpha = frame.getchannel("A")
    bounds = alpha.getbbox()
    canvas = Image.new("RGBA", (CELL, CELL))
    if not bounds:
        return canvas
    subject = frame.crop(bounds)
    scale = min((CELL - 18) / subject.width, (CELL - 18) / subject.height)
    if abs(scale - 1) > .01:
        subject = subject.resize((round(subject.width * scale), round(subject.height * scale)), Image.Resampling.LANCZOS)
    x = (CELL - subject.width) // 2
    y = CELL - subject.height - 9
    canvas.alpha_composite(subject, (x, y))
    return canvas


def repair_frames(frames: list[Image.Image]) -> list[Image.Image]:
    cleaned = [single_fighter(frame) for frame in frames]
    ratios: list[float] = []
    for source, isolated in zip(frames, cleaned):
        source_area = sum(value > 28 for value in source.getchannel("A").getdata())
        isolated_area = sum(value > 28 for value in isolated.getchannel("A").getdata())
        ratios.append(isolated_area / source_area if source_area else 0)
    valid = [index for index, ratio in enumerate(ratios) if ratio >= .72]
    if not valid:
        valid = [max(range(len(cleaned)), key=lambda index: ratios[index])]
    repaired = [frame if index in valid else cleaned[min(valid, key=lambda good: abs(good - index))]
                for index, frame in enumerate(cleaned)]
    return [place(frame) for frame in repaired]


def strip(name: str, suffix: str, columns: int) -> list[Image.Image]:
    return eight(cells(ASSETS / f"{name}-{suffix}-actions-premium.png", columns))


def build(name: str) -> None:
    main = ASSETS / f"{name}-actions-premium.png"
    rows = [
        [cells(main, 7, row=3, rows=4)[0]] * FRAMES,
        eight(cells(main, 7, row=0, rows=4)),
        eight(cells(main, 7, row=1, rows=4)),
        eight(cells(main, 7, row=3, rows=4)),
        eight(cells(main, 7, row=2, rows=4)),
        strip(name, "roundhouse", 10),
        strip(name, "slide", 8),
        strip(name, "stun", 8),
        strip(name, "fall", 10),
    ]
    rows.append(list(reversed(rows[-1])))
    sheet = Image.new("RGBA", (CELL * FRAMES, CELL * len(rows)))
    for row, frames in enumerate(rows):
        for column, frame in enumerate(repair_frames(frames)):
            sheet.alpha_composite(frame, (column * CELL, row * CELL))
    sheet.save(OUTPUT / f"{name}.png", optimize=True)


def content_runs(values: list[int], threshold: int = 3) -> list[tuple[int, int]]:
    occupied = [index for index, value in enumerate(values) if value > threshold]
    runs: list[list[int]] = []
    for value in occupied:
        if not runs or value - runs[-1][-1] > 4:
            runs.append([value])
        else:
            runs[-1].append(value)
    return [(run[0], run[-1] + 1) for run in runs if run[-1] - run[0] > 5]


def generated_cells(name: str, source: str, _columns: int, row: int, _rows: int) -> list[Image.Image]:
    path = ASSETS / "version1-new-sources" / f"{name}-{source}.png"
    image = Image.open(path).convert("RGBA")
    opaque = [[False] * image.width for _ in range(image.height)]
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, _ = pixels[x, y]
            opaque[y][x] = not (green > 85 and green - max(red, blue) > 18)
    row_runs = content_runs([sum(line) for line in opaque], 5)
    top, bottom = row_runs[min(row, len(row_runs) - 1)]
    column_runs = content_runs([sum(opaque[y][x] for y in range(top, bottom)) for x in range(image.width)], 2)
    frames = [remove_green(image.crop((max(0, left - 3), max(0, top - 3),
                                        min(image.width, right + 3), min(image.height, bottom + 3))))
              for left, right in column_runs]
    return eight(frames)


def version_one_cells(name: str, source: str, row_position: float) -> list[Image.Image]:
    """Read the genuinely redesigned transparent sheets for the original roster."""
    image = Image.open(ASSETS / "version1-fighting" / f"{name}-{source}.png").convert("RGBA")
    alpha = image.getchannel("A")
    pixels = alpha.load()
    occupied = [[pixels[x, y] >= 28 for x in range(image.width)] for y in range(image.height)]
    row_runs = content_runs([sum(line) for line in occupied], 5)
    row_index = round(row_position * (len(row_runs) - 1))
    top, bottom = row_runs[row_index]
    column_runs = content_runs([
        sum(occupied[y][x] for y in range(top, bottom)) for x in range(image.width)
    ], 2)
    frames = [image.crop((max(0, left - 3), max(0, top - 3),
                          min(image.width, right + 3), min(image.height, bottom + 3)))
              for left, right in column_runs]
    return eight(frames)


def build_original_version_one(name: str) -> None:
    idle = version_one_cells(name, "movement", 0)
    fall = version_one_cells(name, "reactions", .55)
    rows = [
        idle,
        version_one_cells(name, "movement", .34),
        idle_to_idle(version_one_cells(name, "movement", .68), idle[0]),
        idle_to_idle(version_one_cells(name, "attacks", 0), idle[0]),
        idle_to_idle(version_one_cells(name, "attacks", .34), idle[0]),
        idle_to_idle(version_one_cells(name, "attacks", .68), idle[0]),
        idle_to_idle(version_one_cells(name, "attacks", 1), idle[0]),
        idle_to_idle(version_one_cells(name, "reactions", .2), idle[0]),
        fall,
        list(reversed(fall[:-1])) + [idle[0]],
    ]
    sheet = Image.new("RGBA", (CELL * FRAMES, CELL * len(rows)))
    for row, frames in enumerate(rows):
        for column, frame in enumerate(repair_frames(frames)):
            sheet.alpha_composite(frame, (column * CELL, row * CELL))
    sheet.save(OUTPUT / f"{name}.png", optimize=True)
    place(idle[0]).save(ASSETS / f"{name}-menu-fighter.png", optimize=True)


def build_generated(name: str, grids: dict[str, int]) -> None:
    idle = generated_cells(name, "movement", grids["movement"], 0, 4)
    rows = [
        idle,
        generated_cells(name, "movement", grids["movement"], 2, 4),
        idle_to_idle(generated_cells(name, "jump-recovery", grids["jump-recovery"], 0, 4), idle[0]),
        idle_to_idle(generated_cells(name, "attacks", grids["attacks"], 0, 8), idle[0]),
        idle_to_idle(generated_cells(name, "attacks", grids["attacks"], 2, 8), idle[0]),
        idle_to_idle(generated_cells(name, "attacks", grids["attacks"], 4, 8), idle[0]),
        idle_to_idle(generated_cells(name, "attacks", grids["attacks"], 6, 8), idle[0]),
        idle_to_idle(generated_cells(name, "reactions", grids["reactions"], 0, 6), idle[0]),
        generated_cells(name, "reactions", grids["reactions"], 2, 6),
        generated_cells(name, "jump-recovery", grids["jump-recovery"], 2, 4),
    ]
    sheet = Image.new("RGBA", (CELL * FRAMES, CELL * len(rows)))
    for row, frames in enumerate(rows):
        for column, frame in enumerate(repair_frames(frames)):
            sheet.alpha_composite(frame, (column * CELL, row * CELL))
    sheet.save(OUTPUT / f"{name}.png", optimize=True)
    place(rows[0][0]).save(ASSETS / f"{name}-menu-fighter.png", optimize=True)


OUTPUT.mkdir(parents=True, exist_ok=True)
for fighter in FIGHTERS:
    build_original_version_one(fighter)
for fighter, layout in NEW_FIGHTERS.items():
    build_generated(fighter, layout)
