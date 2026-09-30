#!/usr/bin/env python3
import argparse, hashlib, json, math, os, pathlib, shutil, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

BVID = "BV16eKb6PEUo"
VIEW_URL = f"https://api.bilibili.com/x/web-interface/view?bvid={BVID}"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36"
HEADERS = {"User-Agent": UA, "Referer": "https://www.bilibili.com/"}
CORE_SEC = 54.0
CONTEXT_SEC = 2.0
MODEL_SHA256 = "614feee3a990cf0e672b0314f4da0c80ae8da9094507f5ccb7c42e43b5fc5a12"
SOURCE_COMMIT = "1bfbebfaaf493866f49597cd3b7901959d395c60"

def fetch_json(url, retries=4):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=60) as r:
                raw = r.read()
            data = json.loads(raw.decode("utf-8"))
            if isinstance(data, dict) and data.get("code") not in (None, 0):
                raise RuntimeError(f"API code={data.get('code')} message={data.get('message')}")
            return data
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (403, 412):
                raise
            time.sleep(2 * (attempt + 1))
        except Exception as e:
            last = e
            time.sleep(2 * (attempt + 1))
    raise last

def download(url, dest, retries=3):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
                while True:
                    block = r.read(1024 * 1024)
                    if not block:
                        break
                    f.write(block)
            if os.path.getsize(dest) < 4096:
                raise RuntimeError("download unexpectedly small")
            return
        except Exception as e:
            last = e
            try:
                os.remove(dest)
            except FileNotFoundError:
                pass
            time.sleep(2 * (attempt + 1))
    raise last

def official_audio_candidates(cid):
    q = urllib.parse.urlencode({
        "bvid": BVID, "cid": cid, "qn": 16, "fnval": 16, "fourk": 1
    })
    data = fetch_json("https://api.bilibili.com/x/player/playurl?" + q)["data"]
    audio = list((data.get("dash") or {}).get("audio") or [])
    audio.sort(key=lambda x: int(x.get("bandwidth") or 0), reverse=True)
    out = []
    for row in audio:
        for key in ("baseUrl", "base_url"):
            if row.get(key):
                out.append(("official:" + key, row[key]))
                break
        for u in row.get("backupUrl") or row.get("backup_url") or []:
            out.append(("official:backup", u))
    return out

def parser_audio_candidates(part):
    url = f"https://api.injahow.cn/bparse/?bv={BVID}&p={part}&q=16&format=dash&otype=json"
    d = fetch_json(url)
    out = []
    for key in ("audio", "backup_audio"):
        if d.get(key):
            out.append(("parser:" + key, d[key]))
    return out

def acquire_audio(part, cid, work):
    errors = []
    for refresh in range(1):
        try:
            candidates = official_audio_candidates(cid)
        except Exception as e:
            candidates = []
            errors.append(f"official-api:{type(e).__name__}")
        for label, url in candidates:
            dest = work / f"P{part:03d}.m4s"
            try:
                download(url, dest)
                return dest, label
            except Exception as e:
                errors.append(f"{label}:{type(e).__name__}")
        time.sleep(1 + refresh)
    try:
        candidates = parser_audio_candidates(part)
    except Exception as e:
        candidates = []
        errors.append(f"parser-api:{type(e).__name__}")
    for label, url in candidates:
        dest = work / f"P{part:03d}.m4s"
        try:
            download(url, dest)
            return dest, label
        except Exception as e:
            errors.append(f"{label}:{type(e).__name__}")
    raise RuntimeError("audio acquisition failed: " + ",".join(errors[-12:]))

def ffprobe_duration(ffprobe, path):
    p = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        text=True, capture_output=True, check=True
    )
    return float(p.stdout.strip())

def make_wav(ffmpeg, media, wav):
    subprocess.run(
        [ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
         "-i", str(media), "-vn", "-ac", "1", "-ar", "16000",
         "-c:a", "pcm_s16le", str(wav)],
        check=True
    )

def shard_wav(ffmpeg, wav, duration, shard_dir):
    shard_dir.mkdir(parents=True, exist_ok=True)
    n = max(1, math.ceil(duration / CORE_SEC))
    rows = []
    for i in range(n):
        core_start = i * CORE_SEC
        core_end = min(duration, (i + 1) * CORE_SEC)
        shard_start = max(0.0, core_start - CONTEXT_SEC)
        shard_end = min(duration, core_end + CONTEXT_SEC)
        shard_dur = max(0.01, shard_end - shard_start)
        path = shard_dir / f"shard_{i:03d}.wav"
        subprocess.run(
            [ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
             "-ss", f"{shard_start:.3f}", "-i", str(wav),
             "-t", f"{shard_dur:.3f}", "-ac", "1", "-ar", "16000",
             "-c:a", "pcm_s16le", str(path)],
            check=True
        )
        rows.append({
            "index": i, "path": str(path), "core_start": core_start,
            "core_end": core_end, "shard_start": shard_start,
            "shard_end": shard_end
        })
    return rows

def run_asr(runner, model, shard_rows, asr_out):
    asr_out.mkdir(parents=True, exist_ok=True)
    manifest = asr_out.parent / "manifest.txt"
    manifest.write_text("".join(r["path"] + "\n" for r in shard_rows), encoding="utf-8")
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = str(pathlib.Path(runner).parent) + (
        ":" + env["LD_LIBRARY_PATH"] if env.get("LD_LIBRARY_PATH") else ""
    )
    p = subprocess.run(
        [runner, "--model", model, "--manifest", str(manifest),
         "--out-dir", str(asr_out), "--threads", "4", "--decoder", "2"],
        env=env, text=True, capture_output=True
    )
    if p.returncode:
        raise RuntimeError("native ASR failed rc=" + str(p.returncode) + " stderr=" + p.stderr[-1000:])
    try:
        return json.loads(p.stdout)
    except Exception:
        return {"raw_summary": p.stdout.strip()}

def merge_words(shard_rows, asr_out, duration):
    merged = []
    for row in shard_rows:
        p = asr_out / f"shard_{row['index']:02d}.json"
        if not p.exists():
            raise RuntimeError(f"missing ASR output {p.name}")
        d = json.loads(p.read_text(encoding="utf-8"))
        for w in d.get("words") or []:
            rel_s = float(w["start"])
            rel_e = float(w["end"])
            abs_s = row["shard_start"] + rel_s
            abs_e = row["shard_start"] + rel_e
            mid = (abs_s + abs_e) / 2.0
            last = row["core_end"] >= duration - 0.001
            owned = mid >= row["core_start"] - 1e-9 and (
                mid < row["core_end"] - 1e-9 or last
            )
            if not owned:
                continue
            merged.append({
                "w": str(w.get("w") or ""),
                "start": round(max(0.0, abs_s), 3),
                "end": round(min(duration, abs_e), 3),
                "conf": round(float(w.get("conf") or 0.0), 4)
            })
    merged.sort(key=lambda x: (x["start"], x["end"]))
    return merged

def words_to_segments(words):
    if not words:
        return []
    segments = []
    current = []
    for i, w in enumerate(words):
        if current:
            gap = w["start"] - current[-1]["end"]
            if gap > 1.25:
                segments.append(current)
                current = []
        current.append(w)
        terminal = w["w"].rstrip().endswith((".", "?", "!"))
        if terminal and len(current) >= 4:
            segments.append(current)
            current = []
        elif len(current) >= 32:
            segments.append(current)
            current = []
    if current:
        segments.append(current)
    out = []
    for seg in segments:
        text = " ".join(x["w"] for x in seg).strip()
        out.append({
            "start": seg[0]["start"], "end": seg[-1]["end"], "text": text
        })
    return out

def ts(sec):
    ms = int(round(float(sec) * 1000))
    h, rem = divmod(ms, 3600000)
    m, rem = divmod(rem, 60000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=int, required=True)
    ap.add_argument("--end", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--runner", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--ffmpeg", default="ffmpeg")
    ap.add_argument("--ffprobe", default="ffprobe")
    a = ap.parse_args()

    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    work = out.parent / "_work"
    work.mkdir(parents=True, exist_ok=True)

    source_manifest_path = pathlib.Path(__file__).with_name("source_manifest.json")
    frozen = json.loads(source_manifest_path.read_text(encoding="utf-8"))
    pages = {int(x["page"]): x for x in frozen.get("pages") or []}
    if len(pages) != 92:
        raise SystemExit(f"frozen source manifest invalid: expected 92 pages, got {len(pages)}")
    (out / "SOURCE_MANIFEST.json").write_text(
        json.dumps(frozen, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    runner_path = pathlib.Path(a.runner)
    runner_sha256 = hashlib.sha256(runner_path.read_bytes()).hexdigest()
    qual_path = runner_path.parent / "RUNTIME_QUALIFICATION.json"
    qualification = json.loads(qual_path.read_text(encoding="utf-8"))
    if qualification.get("status") != "PASS_SOURCE_EXACT_MODEL_EXACT_R51_R54_SMOKE_JSON_BYTE_IDENTICAL":
        raise SystemExit("engine qualification missing or failed")

    records = []
    failures = 0
    for part in range(a.start, a.end + 1):
        page = pages[part]
        rec = {
            "part": part, "cid": page.get("cid"), "title": page.get("part"),
            "published_duration_seconds": page.get("duration"),
            "source_url": f"https://www.bilibili.com/video/{BVID}/?p={part}",
            "status": "ERROR"
        }
        part_dir = work / f"P{part:03d}"
        shutil.rmtree(part_dir, ignore_errors=True)
        part_dir.mkdir(parents=True)
        media = part_dir / "audio.m4s"
        wav = part_dir / "audio.wav"
        try:
            media, method = acquire_audio(part, page["cid"], part_dir)
            make_wav(a.ffmpeg, media, wav)
            actual = ffprobe_duration(a.ffprobe, wav)
            shard_rows = shard_wav(a.ffmpeg, wav, actual, part_dir / "shards")
            asr_summary = run_asr(a.runner, a.model, shard_rows, part_dir / "asr")
            words = merge_words(shard_rows, part_dir / "asr", actual)
            segments = words_to_segments(words)
            if not words:
                raise RuntimeError("ASR returned zero owned words")
            last_end = words[-1]["end"]
            duration_delta = actual - float(page.get("duration") or actual)
            qc = {
                "actual_duration_seconds": round(actual, 3),
                "duration_delta_vs_published_seconds": round(duration_delta, 3),
                "word_count": len(words),
                "segment_count": len(segments),
                "last_word_end_seconds": last_end,
                "end_silence_or_gap_seconds": round(max(0.0, actual - last_end), 3),
                "mean_word_confidence": round(sum(x["conf"] for x in words) / len(words), 4)
            }
            rec.update({
                "status": "OK", "acquisition_method": method,
                "engine": {
                    "name": "parakeet.cpp native multirun",
                    "source_commit": SOURCE_COMMIT,
                    "runner_sha256": runner_sha256,
                    "historical_r54_runner_sha256": qualification.get("historical_r54_runner_sha256"),
                    "qualification_status": qualification.get("status"),
                    "qualification_smoke_timestamp_json_sha256": qualification.get("smoke_timestamp_json_sha256"),
                    "binary_identity_note": qualification.get("binary_identity_note"),
                    "model": "tdt_ctc-110m-q8_0.gguf",
                    "model_sha256": MODEL_SHA256,
                    "decoder": "TDT", "threads": 4,
                    "sharding": {
                        "core_sec": CORE_SEC,
                        "symmetric_context_sec_each_side": CONTEXT_SEC,
                        "merge": "timestamp midpoint ownership"
                    }
                },
                "qc": qc, "runner_summary": asr_summary
            })
            payload = {"metadata": rec, "segments": segments, "words": words}
            (out / f"P{part:03d}.json").write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            with open(out / f"P{part:03d}.txt", "w", encoding="utf-8") as f:
                f.write(f"P{part:03d} — {page.get('part')}\n")
                f.write(rec["source_url"] + "\n\n")
                for s in segments:
                    f.write(f"[{ts(s['start'])} --> {ts(s['end'])}] {s['text']}\n")
            print(f"P{part:03d} OK words={len(words)} shards={len(shard_rows)}", flush=True)
        except Exception as e:
            failures += 1
            rec["error"] = f"{type(e).__name__}: {e}"
            (out / f"P{part:03d}_ERROR.json").write_text(
                json.dumps(rec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            print(f"P{part:03d} ERROR {type(e).__name__}", flush=True)
        finally:
            shutil.rmtree(part_dir, ignore_errors=True)
        records.append(rec)

    chunk = {
        "bvid": BVID, "range": [a.start, a.end],
        "ok": sum(x["status"] == "OK" for x in records),
        "errors": failures, "records": records
    }
    (out / "CHUNK_MANIFEST.json").write_text(
        json.dumps(chunk, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    shutil.rmtree(work, ignore_errors=True)
    return 0 if failures == 0 else 10

if __name__ == "__main__":
    raise SystemExit(main())
