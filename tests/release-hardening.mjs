import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=name=>fs.readFileSync(path.join(root,name));
const text=name=>read(name).toString("utf8");

const html=text("index.html");
const manifest=JSON.parse(text("manifest.webmanifest"));
const sw=text("sw.js");

const versionMatch=html.match(/var VERSION="([^"]+)"/);
assert.ok(versionMatch,"runtime VERSION missing");
const version=versionMatch[1];
assert.match(version,/^\d+\.\d+\.\d+$/);

assert.equal(manifest.name,"Swoop");
assert.equal(manifest.short_name,"Swoop");
assert.equal(manifest.display,"fullscreen");
assert.ok(Array.isArray(manifest.display_override)&&manifest.display_override.includes("fullscreen"));
assert.equal(manifest.orientation,"landscape-primary");
assert.equal(manifest.start_url,"./");
assert.equal(manifest.scope,"./");

const requiredIcons=[
  ["icon-192.png",192,192,"any"],
  ["icon-512.png",512,512,"any"],
  ["icon-maskable-512.png",512,512,"maskable"]
];

function pngSize(filename){
  const b=read(filename);
  assert.equal(b.subarray(1,4).toString("ascii"),"PNG",filename+" is not PNG");
  return [b.readUInt32BE(16),b.readUInt32BE(20)];
}

for(const [src,w,h,purpose] of requiredIcons){
  assert.ok(fs.existsSync(path.join(root,src)),src+" missing");
  assert.deepEqual(pngSize(src),[w,h],src+" dimensions incorrect");
  const entry=manifest.icons.find(icon=>icon.src===src);
  assert.ok(entry,"manifest missing "+src);
  assert.equal(entry.type,"image/png");
  assert.equal(entry.sizes,w+"x"+h);
  assert.ok(String(entry.purpose||"").split(/\s+/).includes(purpose));
}
assert.deepEqual(pngSize("apple-touch-icon.png"),[180,180]);
assert.ok(html.includes('rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png"'));

const viewport=(html.match(/<meta name="viewport" content="([^"]+)"/)||[])[1]||"";
assert.ok(viewport.includes("user-scalable=no"),"zoom hardening missing");
assert.ok(viewport.includes("maximum-scale=1"),"maximum scale hardening missing");
assert.ok(viewport.includes("viewport-fit=cover"),"safe-area viewport missing");
assert.ok(html.includes('id="rotateNotice"'),"landscape fallback missing");
assert.ok(html.includes("requestFullscreen"),"fullscreen request missing");
assert.ok(html.includes('updateViaCache:"none"'),"service-worker update cache hardening missing");
assert.ok(html.includes('screen.orientation.lock("landscape-primary")'),"orientation lock missing");

assert.ok(sw.includes('const CACHE_PREFIX="swoop-"'),"cache namespace prefix missing");
assert.ok(sw.includes('const CACHE=CACHE_PREFIX+"v'+version+'"'),"service worker cache/version mismatch");
assert.ok(sw.includes("key.startsWith(CACHE_PREFIX)"),"cache cleanup must be scoped to Swoop");
assert.equal(/keys\.filter\(k=>k!==CACHE\)/.test(sw),false,"unsafe origin-wide cache deletion detected");
for(const asset of [
  "./","./index.html","./manifest.webmanifest","./icon.svg",
  "./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"
]){
  assert.ok(sw.includes(JSON.stringify(asset)),"offline cache missing "+asset);
}
assert.ok(sw.includes('req.mode==="navigate"'),"navigation strategy missing");
assert.ok(sw.includes('fetch(req)'),"navigation must attempt network");
assert.ok(sw.includes('caches.match("./index.html")'),"offline navigation fallback missing");
assert.ok(sw.includes("self.skipWaiting()"),"service-worker activation hardening missing");
assert.ok(sw.includes("self.clients.claim()"),"service-worker client claim missing");

assert.equal(/<script[^>]+src=["']https?:\/\//i.test(html),false,"remote runtime script dependency found");
assert.equal(/<link[^>]+href=["']https?:\/\//i.test(html),false,"remote stylesheet/font dependency found");
assert.equal(/\bNotification\b|PushManager|pushManager|showNotification/.test(html+sw),false,"notification/push code is out of scope");

for(const file of ["index.html","manifest.webmanifest","sw.js","icon.svg","icon-maskable.svg",".nojekyll"]){
  assert.ok(fs.existsSync(path.join(root,file)),file+" missing");
}

console.log("Swoop release hardening passed",{
  version,
  display:manifest.display,
  orientation:manifest.orientation,
  icons:requiredIcons.map(x=>x[0]),
  offlineCore:true,
  remoteRuntimeDependencies:false
});
