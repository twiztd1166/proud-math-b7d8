#!/usr/bin/env python3
import json, os, pathlib, secrets, shutil, subprocess, sys, tarfile, time
import requests
from faster_whisper import WhisperModel

BVID = os.environ.get("BVID", "BV16eKb6PEUo")
START = int(os.environ["START_PART"])
END = int(os.environ["END_PART"])
LABEL = os.environ.get("BATCH_LABEL", f"{START:03d}-{END:03d}")
ROOT = pathlib.Path("tmp_real_engineers")
OUT = ROOT / "out"
ROOT.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "Referer": "https://www.bilibili.com/",
})

model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=2)
manifest = []

def get_media_url(part: int) -> str:
    endpoint = f"https://api.injahow.cn/bparse/?bv={BVID}&p={part}&q=16&format=mp4&otype=json"
    last = None
    for attempt in range(4):
        try:
            r = session.get(endpoint, timeout=45)
            r.raise_for_status()
            data = r.json()
            if data.get("code") == 0 and data.get("url"):
                return data["url"]
            last = RuntimeError(f"parser code={data.get('code')}")
        except Exception as e:
            last = e
        time.sleep(2 + attempt * 2)
    raise RuntimeError(f"parser failed for part {part}: {last}")

def download_media(url: str, part: int) -> pathlib.Path:
    dest = ROOT / f"part_{part:03d}.mp4"
    last = None
    for attempt in range(4):
        try:
            with session.get(url, stream=True, timeout=(30, 180)) as r:
                r.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in r.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            f.write(chunk)
            if dest.stat().st_size < 10000:
                raise RuntimeError("media file unexpectedly small")
            return dest
        except Exception as e:
            last = e
            if dest.exists():
                dest.unlink()
            time.sleep(3 + attempt * 3)
    raise RuntimeError(f"download failed for part {part}: {last}")

for part in range(START, END + 1):
    rec = {"part": part, "status": "error"}
    media = None
    try:
        print(f"[part {part}] resolving", flush=True)
        media_url = get_media_url(part)
        media = download_media(media_url, part)
        print(f"[part {part}] transcribing bytes={media.stat().st_size}", flush=True)
        segments, info = model.transcribe(
            str(media),
            beam_size=5,
            vad_filter=True,
            word_timestamps=False,
            language="en",
        )
        segs = []
        chars = 0
        last_end = 0.0
        for s in segments:
            text = (s.text or "").strip()
            chars += len(text)
            last_end = max(last_end, float(s.end))
            segs.append({"start": round(float(s.start), 3), "end": round(float(s.end), 3), "text": text})
        payload = {
            "course": "AI Coding for Real Engineers",
            "instructor": "Matt Pocock",
            "bvid": BVID,
            "part": part,
            "engine": "faster-whisper small.en",
            "language": getattr(info, "language", "en"),
            "language_probability": getattr(info, "language_probability", None),
            "duration_seconds": getattr(info, "duration", None),
            "coverage_end_seconds": last_end,
            "segment_count": len(segs),
            "character_count": chars,
            "segments": segs,
        }
        path = OUT / f"part_{part:03d}.json"
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        rec.update({
            "status": "ok",
            "duration_seconds": payload["duration_seconds"],
            "coverage_end_seconds": last_end,
            "segment_count": len(segs),
            "character_count": chars,
        })
        print(f"[part {part}] ok segments={len(segs)} chars={chars}", flush=True)
    except Exception as e:
        rec["error"] = f"{type(e).__name__}: {e}"
        print(f"[part {part}] ERROR {type(e).__name__}: {e}", flush=True)
    finally:
        manifest.append(rec)
        if media and media.exists():
            media.unlink()

manifest_path = pathlib.Path(f"batch_manifest_{LABEL}.json")
manifest_path.write_text(json.dumps({
    "bvid": BVID,
    "start_part": START,
    "end_part": END,
    "records": manifest,
}, indent=2), encoding="utf-8")

archive = pathlib.Path(f"batch_{LABEL}.tar.gz")
with tarfile.open(archive, "w:gz") as tf:
    for p in sorted(OUT.glob("part_*.json")):
        tf.add(p, arcname=p.name)

keyfile = pathlib.Path(f"batch_{LABEL}.key.txt")
keyfile.write_text(secrets.token_hex(32), encoding="ascii")
enc_archive = pathlib.Path(f"batch_{LABEL}.tar.gz.enc")
enc_key = pathlib.Path(f"batch_{LABEL}.key.enc")

subprocess.run([
    "openssl", "enc", "-aes-256-cbc", "-salt", "-pbkdf2",
    "-pass", f"file:{keyfile}", "-in", str(archive), "-out", str(enc_archive)
], check=True)
subprocess.run([
    "openssl", "pkeyutl", "-encrypt", "-pubin",
    "-inkey", "tools/real_engineers/public.pem",
    "-in", str(keyfile), "-out", str(enc_key)
], check=True)

# Remove all plaintext transcript/media material before artifact upload.
shutil.rmtree(ROOT, ignore_errors=True)
archive.unlink(missing_ok=True)
keyfile.unlink(missing_ok=True)

ok = sum(1 for r in manifest if r["status"] == "ok")
bad = len(manifest) - ok
print(f"batch {LABEL}: ok={ok} errors={bad}", flush=True)
if bad:
    sys.exit(2)
