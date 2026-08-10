import { CDP, getTab, waitFor } from './cdp-lib.mjs';

const page = await getTab('itch.io');
const pcdp = new CDP(page.webSocketDebuggerUrl);
await pcdp.connect();

const rect = await pcdp.eval(`(()=>{const f=document.querySelector('iframe[src*="challenges.cloudflare.com"]');if(!f)return null;const r=f.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
console.log('iframe rect:', JSON.stringify(rect));
if (!rect) { console.log('no turnstile iframe'); process.exit(0); }

const targets = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const ifr = targets.find(t => t.type === 'iframe' && t.url.includes('challenges.cloudflare.com'));
if (!ifr) { console.log('no iframe target'); process.exit(1); }
const icdp = new CDP(ifr.webSocketDebuggerUrl);
await icdp.connect();

const info = await icdp.eval(`(()=>{const body=document.body;const inputs=[...document.querySelectorAll('input,label,button,[role="checkbox"]')].map(e=>({tag:e.tagName,type:e.type||'',cls:(e.className||'').toString().slice(0,60),r:e.getBoundingClientRect()}));return {url:location.href,bodyText:body?body.innerText.slice(0,200):'',inputs}})()`);
console.log(JSON.stringify(info, null, 1));

icdp.close(); pcdp.close();
