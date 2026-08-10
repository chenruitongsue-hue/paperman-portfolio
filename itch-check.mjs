import { CDP, getTab, waitFor } from './cdp-lib.mjs';

const tab = await getTab('itch.io');
if (!tab) { console.log('NO itch tab'); process.exit(1); }
const cdp = new CDP(tab.webSocketDebuggerUrl);
await cdp.connect();
await waitFor(3000);
const info = await cdp.eval(`JSON.stringify({
  href: location.href,
  title: document.title,
  loggedIn: !!(document.querySelector('.user_panel_widget') || document.querySelector('[data-widget_id]') || document.querySelector('a[href*="/logout"]')),
  bodyLen: document.body ? document.body.innerText.length : 0
})`);
console.log(info);
await cdp.screenshot('qa-shots/itch-auto-check.png');
cdp.close();
