import { CDP, getTab } from './cdp-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/WPS-Syn/09-MyProjectcs/MyProjects-Home/PaperMan/portfolio-website-v2-qdoer/assets';
const OUT = 'C:/WPS-Syn/09-MyProjectcs/MyProjects-Home/PaperMan/itch-assets';
fs.mkdirSync(OUT, { recursive: true });

const files = ['cover-room.webp', 'scene-desk.webp', 'scene-wardrobe.webp', 'dialog-fail.webp', 'playtest-level.webp'];

const tabs = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const tab = tabs.find(t => t.url.includes('blank.html'));
if (!tab) { console.log('no blank.html tab'); process.exit(1); }
const cdp = new CDP(tab.webSocketDebuggerUrl);
await cdp.connect();
for (let i = 0; i < 20; i++) {
  try { const st = await cdp.eval('document.readyState', 3000); if (st === 'complete') break; } catch {}
  await new Promise(r => setTimeout(r, 1000));
}

for (const f of files) {
  const url = 'file:///' + path.join(SRC, f).replace(/\\/g, '/');
  const dataUrl = await cdp.eval(`new Promise(res=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;c.getContext('2d').drawImage(i,0,0);res(c.toDataURL('image/png'))};i.onerror=()=>res('ERR');i.src=${JSON.stringify(url)}})`, 30000);
  if (!dataUrl || dataUrl === 'ERR') { console.log(f, 'FAILED'); continue; }
  const b64 = dataUrl.split(',')[1];
  const out = path.join(OUT, f.replace(/\.webp$/, '.png'));
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log(f, '->', out, fs.statSync(out).size, 'bytes');
}
cdp.close();
