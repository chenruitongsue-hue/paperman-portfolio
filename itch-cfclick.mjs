import { CDP, getTab, waitFor } from './cdp-lib.mjs';

const page = await getTab('itch.io');
const pcdp = new CDP(page.webSocketDebuggerUrl);
await pcdp.connect();
await pcdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 63, y: 462 });
await waitFor(300);
await pcdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 63, y: 462, button: 'left', clickCount: 1 });
await pcdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 63, y: 462, button: 'left', clickCount: 1 });
console.log('clicked');
await waitFor(10000);
const s = await pcdp.eval(`JSON.stringify({href:location.href,title:document.title,body:document.body.innerText.slice(0,150)})`);
console.log(s);
await pcdp.screenshot('qa-shots/itch-cf2.png');
pcdp.close();
