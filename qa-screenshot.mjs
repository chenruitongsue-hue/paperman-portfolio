import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173/qa.html';
const OUT = 'qa-shots/';

const sections = ['setting','challenge','mechanic','level','art','playtest','reflection','quote'];

const proc = spawn(EDGE, [
  '--headless=new','--disable-gpu','--hide-scrollbars',
  '--remote-debugging-port=9222','--window-size=1440,1000',
  '--user-data-dir=' + join(process.cwd(),'qa-edge-profile'),
  'about:blank'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2500));

const list = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
function send(method, params = {}) {
  return new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: BASE });
await new Promise(r => setTimeout(r, 4000));

async function evalTop(sendFn, expr) {
  for (let i = 0; i < 40; i++) {
    const resp = await sendFn('Runtime.evaluate', { expression: expr });
    const v = resp.result.result.value;
    if (typeof v === 'number') return v;
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('could not evaluate ' + expr);
}

for (const sec of sections) {
  const expr = sec === 'quote'
    ? `document.querySelector('.quoteband').getBoundingClientRect().top + window.scrollY`
    : `document.getElementById('${sec}').offsetTop`;
  const top = await evalTop(send, expr);
  console.log(sec, 'offsetTop=', top);
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${Math.round(top)} - 60)` });
  await new Promise(r => setTimeout(r, 700));
  const sy = await send('Runtime.evaluate', { expression: 'window.scrollY' });
  console.log(sec, 'scrollY=', sy.result.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT + 'cdp-' + sec + '.png', Buffer.from(shot.result.data, 'base64'));
  console.log('captured', sec);
}

ws.close();
proc.kill();
console.log('done');

// second pass: zh language + challenge re-capture
const proc2 = spawn(EDGE, [
  '--headless=new','--disable-gpu','--hide-scrollbars',
  '--remote-debugging-port=9224','--window-size=1440,1000',
  '--user-data-dir=' + join(process.cwd(),'qa-edge-profile2'),
  'about:blank'
], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const list2 = await (await fetch('http://127.0.0.1:9224/json')).json();
const page2 = list2.find(t => t.type === 'page');
const ws2 = new WebSocket(page2.webSocketDebuggerUrl);
await new Promise(r => ws2.addEventListener('open', r));
let id2 = 0;
const pending2 = new Map();
ws2.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending2.has(msg.id)) { pending2.get(msg.id)(msg); pending2.delete(msg.id); }
});
function send2(method, params = {}) {
  return new Promise(res => { const i = ++id2; pending2.set(i, res); ws2.send(JSON.stringify({ id: i, method, params })); });
}
await send2('Page.enable'); await send2('Runtime.enable');
await send2('Page.navigate', { url: BASE });
await new Promise(r => setTimeout(r, 3000));
await send2('Runtime.evaluate', { expression: `localStorage.setItem('pm-lang','zh')` });
await send2('Page.reload', {});
await new Promise(r => setTimeout(r, 4000));
for (const sec of ['setting','challenge','playtest','quote']) {
  const expr = sec === 'quote'
    ? `document.querySelector('.quoteband').getBoundingClientRect().top + window.scrollY`
    : `document.getElementById('${sec}').offsetTop`;
  const resp = await send2('Runtime.evaluate', { expression: expr });
  const top = await evalTop(send2, expr);
  await send2('Runtime.evaluate', { expression: `window.scrollTo(0, ${Math.round(top)} - 60)` });
  await new Promise(r => setTimeout(r, 700));
  const shot = await send2('Page.captureScreenshot', { format: 'png' });
  writeFileSync(OUT + 'cdp-zh-' + sec + '.png', Buffer.from(shot.result.data, 'base64'));
  console.log('captured zh', sec);
}
ws2.close();
proc2.kill();
console.log('done zh');
