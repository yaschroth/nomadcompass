"""
Generates assets/og-image.png (1200x630) - the branded default Open Graph /
Twitter card image for The Nomad HQ. Run with: py scripts/generate_og_image.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
NAVY_TOP = (26, 31, 54)    # #1A1F36 brand navy
NAVY_BOT = (8, 11, 22)     # deeper navy
WHITE    = (255, 255, 255)
CORAL    = (255, 107, 74)  # #FF6B4A brand accent
MUTED    = (155, 168, 191)
BLUE     = (80, 150, 255)

FONTS = "C:/Windows/Fonts/"
def font(name, size):
    return ImageFont.truetype(FONTS + name, size)

serif  = font("georgiab.ttf", 118)   # wordmark
tag    = font("arialbd.ttf", 52)      # tagline
sub    = font("arial.ttf", 30)        # supporting line
dom    = font("arialbd.ttf", 26)      # domain

img  = Image.new("RGB", (W, H), NAVY_TOP)
draw = ImageDraw.Draw(img)

# vertical gradient background
for y in range(H):
    t = y / (H - 1)
    c = tuple(int(NAVY_TOP[i] + (NAVY_BOT[i] - NAVY_TOP[i]) * t) for i in range(3))
    draw.line([(0, y), (W, y)], fill=c)

# top brand bar
draw.rectangle([0, 0, W, 8], fill=CORAL)

def center(text, fnt, y, fill):
    w = draw.textlength(text, font=fnt)
    draw.text(((W - w) / 2, y), text, font=fnt, fill=fill)

# wordmark "The Nomad HQ" (HQ in coral), centered as a group
part1, part2 = "The Nomad ", "HQ"
w1 = draw.textlength(part1, font=serif)
w2 = draw.textlength(part2, font=serif)
x0 = (W - (w1 + w2)) / 2
y0 = 168
draw.text((x0, y0), part1, font=serif, fill=WHITE)
draw.text((x0 + w1, y0), part2, font=serif, fill=CORAL)

# coral underline accent
bar_w = 120
draw.rounded_rectangle([(W - bar_w) / 2, 330, (W + bar_w) / 2, 337], radius=4, fill=CORAL)

# tagline + supporting line + domain
center("Find Your Next City", tag, 372, WHITE)
center("Cost of living, WiFi, safety and visas for 400+ cities", sub, 452, MUTED)
center("thenomadhq.com", dom, 545, BLUE)

out = os.path.join(os.path.dirname(__file__), "..", "assets", "og-image.png")
img.save(out, "PNG", optimize=True)
print("Wrote", os.path.relpath(out), f"({W}x{H}, {os.path.getsize(out)//1024} KB)")
