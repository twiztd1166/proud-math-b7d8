#!/usr/bin/env python3
from pathlib import Path
import struct, zlib, math

SIZE = 1024
BG = (16, 44, 70)
WHITE = (255, 255, 255)
GREEN = (104, 212, 154)
INK = (16, 44, 70)
OUT = Path("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png")

pixels = bytearray(BG * (SIZE * SIZE))

def put(x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        i = (y * SIZE + x) * 3
        pixels[i:i+3] = bytes(color)

def rect(x0, y0, x1, y1, color):
    for y in range(max(0,y0), min(SIZE,y1)):
        start = (y * SIZE + max(0,x0)) * 3
        end = (y * SIZE + min(SIZE,x1)) * 3
        pixels[start:end] = bytes(color) * (min(SIZE,x1)-max(0,x0))

def circle(cx, cy, r, color):
    rr = r*r
    for y in range(cy-r, cy+r+1):
        dy = y-cy
        dx = int(math.sqrt(max(0, rr-dy*dy)))
        rect(cx-dx, y, cx+dx+1, y+1, color)

def thick_line(x0, y0, x1, y1, width, color):
    steps = max(abs(x1-x0), abs(y1-y0))
    for s in range(steps+1):
        t = s/steps if steps else 0
        x = round(x0 + (x1-x0)*t)
        y = round(y0 + (y1-y0)*t)
        circle(x, y, width//2, color)

rect(220, 300, 720, 388, WHITE)
rect(220, 450, 720, 538, WHITE)
rect(220, 600, 550, 688, WHITE)
circle(720, 690, 112, GREEN)
thick_line(665, 690, 702, 727, 32, INK)
thick_line(702, 727, 785, 640, 32, INK)

def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

raw = bytearray()
stride = SIZE * 3
for y in range(SIZE):
    raw.append(0)
    raw.extend(pixels[y*stride:(y+1)*stride])

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_bytes(png)
print(f"Wrote {OUT} ({len(png)} bytes)")
