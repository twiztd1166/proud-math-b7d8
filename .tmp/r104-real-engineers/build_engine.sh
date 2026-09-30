#!/usr/bin/env bash
set -euo pipefail

SRC=/tmp/parakeet
OUT="$1"
test -n "$OUT"
rm -rf "$SRC" "$OUT"
mkdir -p "$OUT"

sudo apt-get update -qq
sudo apt-get install -y -qq gcc-14 g++-14
export CC=gcc-14
export CXX=g++-14
test "$($CXX --version | head -1 | grep -o '14\.[0-9.]*')" != ""

git clone -q --recursive https://github.com/mudler/parakeet.cpp.git "$SRC"
git -C "$SRC" checkout -q 1bfbebfaaf493866f49597cd3b7901959d395c60
git -C "$SRC" submodule update --init --recursive -q
test "$(git -C "$SRC" rev-parse HEAD)" = "1bfbebfaaf493866f49597cd3b7901959d395c60"

cmake -S "$SRC" -B "$SRC/build" \
  -DCMAKE_BUILD_TYPE=Release \
  -DPARAKEET_BUILD_CLI=OFF \
  -DPARAKEET_BUILD_SERVER=OFF \
  -DPARAKEET_SHARED=ON \
  -DGGML_NATIVE=OFF \
  -DGGML_LLAMAFILE=ON
cmake --build "$SRC/build" --target parakeet -j2

cat > "$SRC/native_multirun.cpp" <<'CPP'
#include "parakeet_capi.h"
#include "ggml_graph.hpp"
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

static std::vector<std::string> read_manifest(const std::string& p) {
    std::ifstream f(p);
    if (!f) throw std::runtime_error("cannot open manifest");
    std::vector<std::string> out;
    std::string line;
    while (std::getline(f, line)) {
        auto b=line.find_first_not_of(" \t\r\n");
        if (b==std::string::npos || line[b]=='#') continue;
        auto e=line.find_last_not_of(" \t\r\n");
        out.push_back(line.substr(b,e-b+1));
    }
    return out;
}
static std::string esc(const std::string& s) {
    std::string o="\"";
    for (unsigned char c: s) {
        switch(c) {
          case '\\': o += "\\\\"; break;
          case '\"': o += "\\\""; break;
          case '\n': o += "\\n"; break;
          case '\r': o += "\\r"; break;
          case '\t': o += "\\t"; break;
          default:
            if (c < 0x20) { char b[7]; std::snprintf(b,sizeof(b),"\\u%04x",(unsigned)c); o += b; }
            else o += (char)c;
        }
    }
    o += "\"";
    return o;
}
int main(int argc, char** argv) {
    std::string model, manifest, outdir;
    int threads=4, decoder=2;
    for (int i=1;i<argc;i++) {
        std::string a=argv[i];
        if (a=="--model" && i+1<argc) model=argv[++i];
        else if (a=="--manifest" && i+1<argc) manifest=argv[++i];
        else if (a=="--out-dir" && i+1<argc) outdir=argv[++i];
        else if (a=="--threads" && i+1<argc) threads=std::atoi(argv[++i]);
        else if (a=="--decoder" && i+1<argc) decoder=std::atoi(argv[++i]);
    }
    if (model.empty() || manifest.empty() || outdir.empty()) {
        std::cerr << "usage: parakeet-native-multirun --model M --manifest F --out-dir D [--threads 4] [--decoder 2]\n";
        return 2;
    }
    auto paths=read_manifest(manifest);
    if (paths.empty()) return 3;
    pk::set_num_threads(threads);
    using clock=std::chrono::steady_clock;
    auto ms=[](clock::time_point t){ return std::chrono::duration<double,std::milli>(clock::now()-t).count(); };
    auto tload=clock::now();
    parakeet_ctx* ctx=parakeet_capi_load(model.c_str());
    double load_ms=ms(tload);
    if (!ctx) { std::cerr << "model load failed\n"; return 4; }
    std::ostringstream summary;
    summary << "{\"threads\":" << threads << ",\"decoder\":" << decoder
            << ",\"load_ms\":" << std::fixed << std::setprecision(3) << load_ms << ",\"files\":[";
    auto tall=clock::now();
    for (size_t i=0;i<paths.size();++i) {
        auto t=clock::now();
        char* js=parakeet_capi_transcribe_path_json(ctx, paths[i].c_str(), decoder);
        double proc=ms(t);
        if (!js) {
            std::cerr << "transcribe failed " << paths[i] << ": " << parakeet_capi_last_error(ctx) << "\n";
            parakeet_capi_free(ctx); pk::shutdown_backend(); return 5;
        }
        std::ostringstream fp;
        fp << outdir << "/shard_" << std::setw(2) << std::setfill('0') << i << ".json";
        std::ofstream of(fp.str(), std::ios::binary|std::ios::trunc);
        of << js << "\n";
        of.close();
        parakeet_capi_free_string(js);
        if (i) summary << ",";
        summary << "{\"path\":" << esc(paths[i]) << ",\"proc_ms\":"
                << std::fixed << std::setprecision(3) << proc << "}";
    }
    double run_ms=ms(tall);
    summary << "],\"run_ms\":" << std::fixed << std::setprecision(3) << run_ms << "}";
    std::cout << summary.str() << "\n";
    parakeet_capi_free(ctx);
    pk::shutdown_backend();
    return 0;
}
CPP

"$CXX" -O3 -std=c++17 \
  -I"$SRC/include" -I"$SRC/src" \
  "$SRC/native_multirun.cpp" \
  -L"$SRC/build" -lparakeet \
  -Wl,-rpath,'$ORIGIN' \
  -o "$OUT/parakeet-native-multirun"

cp "$SRC/build/libparakeet.so" "$OUT/"
cp "$SRC/build/third_party/ggml/src/libggml.so.0" "$OUT/"
cp "$SRC/build/third_party/ggml/src/libggml-cpu.so.0" "$OUT/"
cp "$SRC/build/third_party/ggml/src/libggml-base.so.0" "$OUT/"

test "$(sha256sum "$OUT/parakeet-native-multirun" | awk '{print $1}')" = \
  "a1df72483823659e439dbc5b03ccffefb31583cfd3aeb6df44f3117dcae3b9fc"

curl -fL --retry 4 --retry-all-errors \
  -o "$OUT/tdt_ctc-110m-q8_0.gguf" \
  "https://huggingface.co/mudler/parakeet-cpp-gguf/resolve/bf0af9f425fa01809cadec671b3cb672709d13e9/tdt_ctc-110m-q8_0.gguf?download=true"

test "$(sha256sum "$OUT/tdt_ctc-110m-q8_0.gguf" | awk '{print $1}')" = \
  "614feee3a990cf0e672b0314f4da0c80ae8da9094507f5ccb7c42e43b5fc5a12"

printf '%s\n' "1bfbebfaaf493866f49597cd3b7901959d395c60" > "$OUT/SOURCE_COMMIT.txt"
(
  cd "$OUT"
  sha256sum parakeet-native-multirun libparakeet.so libggml.so.0 \
    libggml-cpu.so.0 libggml-base.so.0 tdt_ctc-110m-q8_0.gguf \
    SOURCE_COMMIT.txt > FILES.sha256
  sha256sum -c FILES.sha256
)
