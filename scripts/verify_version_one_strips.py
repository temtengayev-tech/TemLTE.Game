from __future__ import annotations

from pathlib import Path
from collections import deque

from PIL import Image


FIGHTERS = ("agent", "officer", "john", "conor", "islam", "khabibi", "chalres", "max", "ilia", "daniel")
ACTIONS = ("idle", "run", "jump", "punch", "kick", "roundhouse", "slide", "stagger", "knockdown", "recovery")
EXTENDED_FIGHTERS = {"john", "conor"}
ACTION_OVERRIDES = {("khabibi", "punch"): 12}


def expected_frames(fighter: str, action: str) -> int:
    if (fighter, action) in ACTION_OVERRIDES:
        return ACTION_OVERRIDES[(fighter, action)]
    if fighter in EXTENDED_FIGHTERS:
        if action in {"punch", "kick", "roundhouse", "slide", "knockdown"}:
            return 12
        return 8
    return 16 if action == "knockdown" else 8


def component_sizes(alpha: Image.Image) -> list[int]:
    width, height = alpha.size
    values = alpha.tobytes()
    visited = bytearray(len(values))
    sizes: list[int] = []
    for start, value in enumerate(values):
        if value <= 16 or visited[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        size = 0
        while queue:
            index = queue.popleft()
            size += 1
            x = index % width
            for neighbor in (index - width, index + width, index - 1, index + 1):
                if neighbor < 0 or neighbor >= len(values) or visited[neighbor] or values[neighbor] <= 16:
                    continue
                if neighbor == index - 1 and x == 0 or neighbor == index + 1 and x == width - 1:
                    continue
                visited[neighbor] = 1
                queue.append(neighbor)
        sizes.append(size)
    return sorted(sizes, reverse=True)


def main() -> None:
    root = Path("public/assets/version1-action-strips")
    failures: list[str] = []
    checked = 0
    for fighter in FIGHTERS:
        for action in ACTIONS:
            path = root / f"{fighter}-{action}.png"
            if not path.exists():
                failures.append(f"missing {path}")
                continue
            image = Image.open(path).convert("RGBA")
            count = expected_frames(fighter, action)
            if image.width % count:
                failures.append(f"{path}: width {image.width} is not divisible by {count}")
                continue
            cell_width = image.width // count
            if cell_width != image.height:
                failures.append(f"{path}: expected {count} square frames, got {cell_width}x{image.height} cells")
                continue
            for frame in range(count):
                cell = image.crop((frame * cell_width, 0, (frame + 1) * cell_width, image.height))
                bounds = cell.getchannel("A").getbbox()
                if not bounds:
                    failures.append(f"{path}: frame {frame + 1} is empty")
                elif bounds[0] <= 0 or bounds[1] <= 0 or bounds[2] >= cell_width or bounds[3] >= image.height:
                    failures.append(f"{path}: frame {frame + 1} touches an edge: {bounds}")
                else:
                    sizes = component_sizes(cell.getchannel("A"))
                    if len(sizes) > 1 and sizes[1] >= sizes[0] * .008:
                        failures.append(f"{path}: frame {frame + 1} has a detached fragment ({sizes[1]} px vs body {sizes[0]} px)")
                checked += 1
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"Verified {checked} full-body frames across {len(FIGHTERS) * len(ACTIONS)} action strips.")


if __name__ == "__main__":
    main()
