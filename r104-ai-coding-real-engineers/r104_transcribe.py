#!/usr/bin/env python3
import argparse, hashlib, json, math, os, pathlib, re, shutil, subprocess, sys, time, urllib.parse, urllib.request

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
REFERER = "https://www.bilibili.com/"
CORE_SEC = 54.0
CTX_SEC = 2.0

def log(msg):
    print(msg, flush=True)

def sha256_file(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(1024*1024), b""):
            h.update(b)
    return h.hexdigest()

def run(cmd, capture=False):
    p=subprocess.run(cmd, text=True, stdout=subprocess.PIPE if capture else None, stderr=subprocess.PIPE if capture else None)
    if p.returncode:
        if capture and p.stderr:
            sys.stderr.write(p.stderr[-4000:])
        raise RuntimeError(f"command failed rc={p.returncode}: {cmd[0]}")
    return p.stdout if capture else ""

def http_json(url, retries=5):
    err=None
    for i in range(retries):
        try:
            req=urllib.request.Request(url, headers={"User-Agent":UA,"Referer":REFERER,"Accept":"application/json,text/plain,*/*"})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            err=e
            time.sleep(min(2**i,12))
    raise RuntimeError(f"HTTP JSON failed after {retries}: {type(err).__name__}: {err}")

def progressive_url(bvid,cid):
    q=urllib.parse.urlencode({"bvid":bvid,"cid":cid,"qn":16,"fnval":0,"platform":"html5","high_quality":1})
    obj=http_json("https://api.bilibili.com/x/player/playurl?"+q)
    if obj.get("code")!=0:
        raise RuntimeError(f"playurl code={obj.get('code')} message={obj.get('message')}")
    d=obj.get("data") or obj.get("result") or {}
    arr=d.get("durl") or []
    if not arr or not arr[0].get("url"):
        raise RuntimeError("no progressive durl")
    return arr[0]["url"], d

def download_media(url,out):
    run(["curl","-L","--fail","--retry","5","--retry-all-errors","--connect-timeout","20","--max-time","900",
         "-A",UA,"-e",REFERER,"-o",str(out),url])

def parse_pages(spec):
    out=[]
    for token in spec.split(","):
        token=token.strip()
        if not token: continue
        if "-" in token:
            a,b=token.split("-",1)
            out.extend(range(int(a),int(b)+1))
        else:
            out.append(int(token))
    return sorted(set(out))

def ffprobe_duration(wav):
    s=run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",str(wav)],capture=True)
    return float(s.strip())

def normalize(media,wav):
    run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(media),"-vn","-ac","1","-ar","16000","-c:a","pcm_s16le",str(wav)])

def transcribe(cli,model,wav,threads=4):
    s=run([str(cli),"transcribe","--model",str(model),"--input",str(wav),"--decoder","tdt","--timestamps","--threads",str(threads),"--json"],capture=True)
    return json.loads(s)

def timestamp(sec):
    sec=max(0,float(sec))
    h=int(sec//3600); m=int((sec%3600)//60); s=int(sec%60)
    return f"{h:02d}:{m:02d}:{s:02d}"

def readable_segments(words, bucket=30):
    groups=[]
    cur=[]; cur_bucket=None
    for w in words:
        b=int(float(w["start"])//bucket)
        if cur and b!=cur_bucket:
            groups.append(cur); cur=[]
        if not cur: cur_bucket=b
        cur.append(w)
    if cur: groups.append(cur)
    lines=[]
    for g in groups:
        txt=" ".join(x["w"] for x in g).strip()
        lines.append(f"[{timestamp(g[0]['start'])}] {txt}")
    return "\n\n".join(lines)+"\n"

def transcribe_with_router(cli,model,wav,duration,workdir):
    if duration <= 61.0:
        obj=transcribe(cli,model,wav,4)
        words=[]
        for w in obj.get("words",[]):
            words.append({"w":w["w"],"start":float(w["start"]),"end":float(w["end"]),"conf":w.get("conf")})
        return words, {"route":"WHOLE_FILE_CLI_4T","n_shards":1}

    n=max(1,math.ceil(duration/CORE_SEC))
    words=[]
    shards=workdir/"shards"; shards.mkdir(parents=True,exist_ok=True)
    for i in range(n):
        core_start=i*CORE_SEC
        core_end=min(duration,(i+1)*CORE_SEC)
        shard_start=max(0.0,core_start-CTX_SEC)
        shard_end=min(duration,core_end+CTX_SEC)
        shard=shards/f"shard_{i:03d}.wav"
        run(["ffmpeg","-hide_banner","-loglevel","error","-y","-ss",f"{shard_start:.3f}","-i",str(wav),
             "-t",f"{(shard_end-shard_start):.3f}","-ac","1","-ar","16000","-c:a","pcm_s16le",str(shard)])
        obj=transcribe(cli,model,shard,4)
        for w in obj.get("words",[]):
            st=float(w["start"])+shard_start
            en=float(w["end"])+shard_start
            mid=(st+en)/2.0
            owned = (mid >= core_start-1e-6) and ((mid < core_end-1e-6) or (i==n-1 and mid <= core_end+0.5))
            if owned:
                words.append({"w":w["w"],"start":st,"end":en,"conf":w.get("conf")})
        shard.unlink(missing_ok=True)
    shutil.rmtree(shards,ignore_errors=True)
    words.sort(key=lambda x:(x["start"],x["end"]))
    return words, {"route":"R55_54S_CORE_2S_CONTEXT_STATELESS_CLI_4T","n_shards":n,"core_sec":54,"context_sec_each_side":2,"merge":"timestamp_midpoint_ownership"}

def process_item(item,args,cli,model,root):
    page=int(item["page"])
    pagekey=f"{page:03d}"
    wd=root/"scratch"/pagekey
    shutil.rmtree(wd,ignore_errors=True); wd.mkdir(parents=True)
    media=wd/"media.mp4"; wav=wd/"audio.wav"
    candidates=[
        (args.target_bvid,int(item["target_cid"]),"target"),
        (args.mirror_bvid,int(item["mirror_cid"]),"english_identity_mirror")
    ]
    last=None; chosen=None
    for bvid,cid,label in candidates:
        try:
            url,play=progressive_url(bvid,cid)
            download_media(url,media)
            if media.stat().st_size < 10000:
                raise RuntimeError("media too small")
            chosen=(bvid,cid,label,play)
            break
        except Exception as e:
            last=e
            media.unlink(missing_ok=True)
    if not chosen:
        raise RuntimeError(f"all media candidates failed: {last}")
    media_sha=sha256_file(media)
    normalize(media,wav)
    wav_sha=sha256_file(wav)
    duration=ffprobe_duration(wav)
    words,route=transcribe_with_router(cli,model,wav,duration,wd)
    if not words:
        raise RuntimeError("zero transcript words")
    text=" ".join(w["w"] for w in words).strip()
    if len(text)<20:
        raise RuntimeError(f"transcript too short chars={len(text)}")
    bvid,cid,label,play=chosen
    tjson={
      "schema_version":"1.0",
      "page":page,
      "english_title":item["english_title"],
      "target_title":item["target_title"],
      "duration_manifest_sec":item["duration_sec"],
      "duration_audio_sec":round(duration,3),
      "media_source":{"bvid":bvid,"cid":cid,"role":label},
      "target_source":{"bvid":args.target_bvid,"cid":item["target_cid"]},
      "identity_mirror":{"bvid":args.mirror_bvid,"cid":item["mirror_cid"]},
      "asr":{"engine":"parakeet.cpp","release":"v0.5.0","model":"tdt_ctc-110m-q8_0.gguf","decoder":"TDT","router":route},
      "text":text,
      "words":words
    }
    tj=root/"plaintext"/"transcripts"/f"{pagekey}.json"
    tm=root/"plaintext"/"transcripts"/f"{pagekey}.md"
    md=root/"plaintext"/"metadata"/f"{pagekey}.json"
    tj.parent.mkdir(parents=True,exist_ok=True); md.parent.mkdir(parents=True,exist_ok=True)
    tj.write_text(json.dumps(tjson,ensure_ascii=False,separators=(",",":"))+"\n")
    tm.write_text(f"# {pagekey} — {item['english_title']}\n\n"+readable_segments(words))
    meta={
      "page":page,"english_title":item["english_title"],"target_title":item["target_title"],
      "target_cid":item["target_cid"],"mirror_cid":item["mirror_cid"],
      "manifest_duration_sec":item["duration_sec"],"audio_duration_sec":round(duration,3),
      "media_source_role":label,"media_bvid":bvid,"media_cid":cid,
      "media_sha256":media_sha,"normalized_wav_sha256":wav_sha,
      "transcript_json_sha256":sha256_file(tj),"transcript_md_sha256":sha256_file(tm),
      "word_count":len(words),"character_count":len(text),"route":route
    }
    md.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
    shutil.rmtree(wd,ignore_errors=True)
    return meta

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--manifest",required=True)
    ap.add_argument("--cli",required=True)
    ap.add_argument("--model",required=True)
    ap.add_argument("--out-root",required=True)
    ap.add_argument("--pages",default="1-92")
    ap.add_argument("--target-bvid",default="BV16eKb6PEUo")
    ap.add_argument("--mirror-bvid",default="BV1Y6Ju6vEeN")
    args=ap.parse_args()
    root=pathlib.Path(args.out_root); root.mkdir(parents=True,exist_ok=True)
    manifest=json.load(open(args.manifest))
    selected=set(parse_pages(args.pages))
    items=[x for x in manifest["items"] if int(x["page"]) in selected]
    if not items: raise SystemExit("no selected items")
    results=[]; failures=[]
    start=time.time()
    for idx,item in enumerate(items,1):
        p=int(item["page"])
        log(f"R104 progress {idx}/{len(items)} page={p:03d} START")
        t=time.time()
        try:
            m=process_item(item,args,pathlib.Path(args.cli),pathlib.Path(args.model),root)
            results.append(m)
            log(f"R104 progress {idx}/{len(items)} page={p:03d} PASS words={m['word_count']} sec={time.time()-t:.1f}")
        except Exception as e:
            failures.append({"page":p,"error":f"{type(e).__name__}: {e}"})
            log(f"R104 progress {idx}/{len(items)} page={p:03d} FAIL type={type(e).__name__}")
            shutil.rmtree(root/"scratch"/f"{p:03d}",ignore_errors=True)
    public={
      "schema_version":"1.0",
      "project":"Matt Pocock — AI Coding for Real Engineers",
      "target_bvid":args.target_bvid,
      "identity_mirror_bvid":args.mirror_bvid,
      "requested_pages":args.pages,
      "expected_selected":len(items),
      "completed":len(results),
      "failed":len(failures),
      "failed_pages":[x["page"] for x in failures],
      "failures":failures,
      "elapsed_sec":round(time.time()-start,3),
      "validation":"PASS" if len(results)==len(items) else "PARTIAL"
    }
    (root/"PUBLIC_METADATA.json").write_text(json.dumps(public,indent=2)+"\n")
    (root/"plaintext"/"SOURCE_MANIFEST.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
    catalog={"items":results,"failures":failures}
    (root/"plaintext"/"CATALOG.json").write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
    log(f"R104 processing complete completed={len(results)} failed={len(failures)}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
