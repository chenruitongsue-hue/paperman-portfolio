import { CDP, getTab, waitFor } from './cdp-lib.mjs';

const tab = await getTab('itch.io');
const cdp = new CDP(tab.webSocketDebuggerUrl);
await cdp.connect();
await waitFor(6000);
const cookies = await cdp.send('Network.getAllCookies');
const itch = (cookies.result && cookies.result.cookies || []).filter(c => /itch/.test(c.domain));
console.log('itch cookies:', itch.map(c => c.name + '@' + c.domain + ' len=' + c.value.length).join(' | ') || 'NONE');
const info = await cdp.eval(`JSON.stringify({href:location.href, title:document.title})`);
console.log(info);
await cdp.screenshot('qa-shots/itch-auto-check2.png');
cdp.close();
