import { CDP, getTab, waitFor } from './cdp-lib.mjs';
import fs from 'node:fs';

const tab = await getTab('itch.io');
const cdp = new CDP(tab.webSocketDebuggerUrl);
await cdp.connect();
await waitFor(8000);
const info = await cdp.eval(`JSON.stringify({href:location.href, title:document.title, body:document.body?document.body.innerText.slice(0,400):''})`);
console.log(info);
await cdp.screenshot('qa-shots/itch-auto-check3.png');
cdp.close();
