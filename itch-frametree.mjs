import { CDP, getTab } from './cdp-lib.mjs';

const page = await getTab('itch.io');
const pcdp = new CDP(page.webSocketDebuggerUrl);
await pcdp.connect();
const tree = await pcdp.send('Page.getFrameTree');
function walk(f, depth) {
  console.log(' '.repeat(depth * 2), f.frame.id.slice(0, 8), f.frame.url.slice(0, 110));
  (f.childFrames || []).forEach(c => walk(c, depth + 1));
}
walk(tree.result.frameTree, 0);
const metrics = await pcdp.send('Page.getLayoutMetrics');
console.log('visualViewport:', JSON.stringify(metrics.result.visualViewport));
pcdp.close();
