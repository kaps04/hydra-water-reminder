from PIL import Image, ImageDraw, ImageFilter
import math

S = 512
img = Image.new("RGBA", (S, S), (246, 243, 255, 255))

# Rounded lavender app-icon background
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle(
    (12, 12, 500, 500), radius=112, fill=255
)

# Soft background gradient
bg = Image.new("RGBA", (S, S))
p = bg.load()
for y in range(S):
    for x in range(S):
        t = (x + y) / (2 * S)
        p[x, y] = (
            int(249 - 12 * t),
            int(247 - 8 * t),
            255,
            255
        )

img = Image.composite(bg, img, mask)

# Smooth teardrop shape using Bézier curves
def bezier(p0, p1, p2, p3, n=100):
    points = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        points.append((x, y))
    return points

# Outline: pointed top, rounded base, smooth sides
outline = []
outline += bezier((256, 91), (231, 145), (126, 255), (126, 319))
outline += bezier((126, 319), (126, 398), (183, 437), (256, 437))[1:]
outline += bezier((256, 437), (329, 437), (386, 398), (386, 319))[1:]
outline += bezier((386, 319), (386, 255), (281, 145), (256, 91))[1:]

# Draw at high resolution for smooth edges
drop_mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(drop_mask).polygon(outline, fill=255)
drop_mask = drop_mask.filter(ImageFilter.GaussianBlur(1.2))

# Blue-violet gradient clipped to droplet
drop = Image.new("RGBA", (S, S))
dp = drop.load()
for y in range(S):
    for x in range(S):
        t = min(1, max(0, (x + y * 0.35) / (S * 1.35)))
        dp[x, y] = (
            int(91 + 43 * t),
            int(151 - 28 * t),
            int(247 - 3 * t),
            255
        )

# Soft shadow
shadow_mask = drop_mask.filter(ImageFilter.GaussianBlur(16))
shadow = Image.new("RGBA", (S, S), (93, 83, 200, 0))
shadow.putalpha(shadow_mask.point(lambda a: int(a * 0.22)))
shadow_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
shadow_layer.alpha_composite(shadow, (0, 9))
img = Image.alpha_composite(img, shadow_layer)

drop.putalpha(drop_mask)
img = Image.alpha_composite(img, drop)

# Elegant curved highlight
shine = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(shine)
d.ellipse((177, 195, 222, 286), fill=(255, 255, 255, 150))
d.ellipse((182, 190, 207, 231), fill=(255, 255, 255, 115))
shine = shine.filter(ImageFilter.GaussianBlur(4))
img = Image.alpha_composite(img, shine)

# Export crisp Chrome-ready PNG
img.convert("RGB").resize((128, 128), Image.Resampling.LANCZOS).save(
    "icon.png"
)

print("Created the new Hydra icon: icon.png")
