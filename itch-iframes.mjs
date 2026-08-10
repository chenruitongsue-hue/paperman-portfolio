import { CDP, getTab, waitFor } from './cdp-lib.mjs';

const page = await getTab('itch.io');
const pcdp = new CDP(page.webSocketDebuggerUrl);
await pcdp.connect();
const frames = await pcdp.eval(`JSON.stringify([...document.querySelectorAll('iframe')].map(f=>({src:(f.src||'').slice(0,120),r:f.getBoundingClientRect()})))`);
console.log(frames);
const state = await pcdp.eval(`JSON.stringify({href:location.href,title:document.title,body:document.body.innerText.slice(0,200)})`);
console.log(state);
pcdp.close();
