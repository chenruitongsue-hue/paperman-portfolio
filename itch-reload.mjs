import { CDP, getTab, waitFor } from './cdp-lib.mjs';

const page = await getTab('itch.io');
const pcdp = new CDP(page.webSocketDebuggerUrl);
await pcdp.connect();
await pcdp.navigate('https://itch.io/login');
await waitFor(8000);
await pcdp.screenshot('qa-shots/itch-cf.png');
const s = await pcdp.eval(`JSON.stringify({href:location.href,title:document.title})`);
console.log(s);
pcdp.close();
