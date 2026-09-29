import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'public');
const port=Number(process.env.PORT||3000);

const types={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.svg':'image/svg+xml; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.woff':'font/woff',
  '.woff2':'font/woff2'
};

function indexHtml(){
  let html=fs.readFileSync(path.join(root,'src/pages/index.astro'),'utf8');
  return html.replace(/^---[\s\S]*?---\s*/,'').replaceAll(' is:inline','');
}

function simplePage(title,body){
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#16202a}a{color:#102c46}</style></head><body><h1>${title}</h1><p>${body}</p><p><a href="/">Back to Paradise Shows</a></p></body></html>`;
}

const server=http.createServer((req,res)=>{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  const pathname=decodeURIComponent(url.pathname);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; connect-src 'self' https://taxlrlfsobtnbasjcnuf.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

  if(pathname==='/'||pathname==='/index.html'){
    res.statusCode=200;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-store, must-revalidate');
    res.end(indexHtml());
    return;
  }
  if(pathname==='/health'){
    res.statusCode=200;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({ok:true,app:'Paradise Shows'}));
    return;
  }
  if(pathname==='/privacy'){
    res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(simplePage('Privacy','Paradise Shows is an internal operational planning app. It does not use advertising or tracking.'));return;
  }
  if(pathname==='/support'){
    res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(simplePage('Support','Use the in-app Reload control if current operating data needs to be refreshed.'));return;
  }

  const rel=pathname.replace(/^\/+/, '');
  const file=path.resolve(publicDir,rel);
  if(!file.startsWith(publicDir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.statusCode=404;res.setHeader('Content-Type','text/plain; charset=utf-8');res.end('Not Found');return;
  }
  const ext=path.extname(file).toLowerCase();
  res.statusCode=200;
  res.setHeader('Content-Type',types[ext]||'application/octet-stream');
  res.setHeader('Cache-Control',pathname==='/sw.js'?'no-cache, no-store, must-revalidate':'public, max-age=60');
  if(pathname==='/sw.js')res.setHeader('Service-Worker-Allowed','/');
  fs.createReadStream(file).pipe(res);
});

server.listen(port,'0.0.0.0',()=>console.log(`Paradise Shows listening on ${port}`));
