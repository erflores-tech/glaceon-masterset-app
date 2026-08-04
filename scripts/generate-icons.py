"""Generate simple PWA icons for the Glaceon Master Set app."""
from PIL import Image, ImageDraw

ACCENT = (91, 206, 230)  # #5BCEE6
DARK = (11, 31, 51)      # #0B1F33
WHITE = (245, 250, 252)  # #F5FAFC


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def draw_snowflake(draw, cx, cy, radius, color, arms=6, width=8):
    """Draw a six-pointed snowflake made of lines."""
    for i in range(arms):
        angle = i * 360 / arms
        rad = angle * 3.14159 / 180
        x2 = cx + radius * 0.85 * rad.__class__(rad)
        # wait, we need cos/sin
        pass


def generate_icon(size, filename):
    img = Image.new('RGB', (size, size), DARK)
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Outer icy ring
    ring_width = max(4, size // 40)
    ring_radius = size * 0.42
    draw.ellipse(
        [(cx - ring_radius, cy - ring_radius), (cx + ring_radius, cy + ring_radius)],
        outline=ACCENT,
        width=ring_width
    )

    # Inner filled circle
    inner_radius = size * 0.30
    draw.ellipse(
        [(cx - inner_radius, cy - inner_radius), (cx + inner_radius, cy + inner_radius)],
        fill=ACCENT
    )

    # Snowflake arms
    arms = 6
    arm_inner = size * 0.14
    arm_outer = size * 0.37
    arm_width = max(6, size // 35)
    import math
    for i in range(arms):
        angle = math.radians(i * 360 / arms - 90)
        x1 = cx + arm_inner * math.cos(angle)
        y1 = cy + arm_inner * math.sin(angle)
        x2 = cx + arm_outer * math.cos(angle)
        y2 = cy + arm_outer * math.sin(angle)
        draw.line([(x1, y1), (x2, y2)], fill=DARK, width=arm_width)

    # Center dot
    dot_radius = size * 0.06
    draw.ellipse(
        [(cx - dot_radius, cy - dot_radius), (cx + dot_radius, cy + dot_radius)],
        fill=DARK
    )

    img.save(filename, 'PNG')
    print(f'Wrote {filename}')


if __name__ == '__main__':
    import os
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
    os.makedirs(out_dir, exist_ok=True)
    generate_icon(192, os.path.join(out_dir, 'icon-192x192.png'))
    generate_icon(512, os.path.join(out_dir, 'icon-512x512.png'))
