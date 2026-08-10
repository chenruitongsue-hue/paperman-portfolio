import http from 'node:http';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:9222';

function listTargets() {
  return new Promise((res, rej) => {
    http.get(BASE + '/json/list', r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

export class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => res();
      this.ws.onerror = e => rej(e);
      this.ws.onmessage = ev => {
        const msg = JSON.parse(ev.data.toString());
        if (msg.id && this.pending.has(msg.id)) { this.pending.get(msg.id)(msg); this.pending.delete(msg.id); }
        if (msg.method && this.onEvent) this.onEvent(msg);
      };
    });
  }
  send(method, params = {}) {
    return new Promise(res => {
      const id = ++this.id;
      this.pending.set(id, res);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, timeoutMs = 15000) {
    const r = await Promise.race([
      this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }),
      new Promise(res => setTimeout(() => res({ timeout: true }), timeoutMs))
    ]);
    if (r.timeout) throw new Error('eval timeout');
    if (r.result && r.result.exceptionDetails) throw new Error('eval exception: ' + JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result && r.result.result ? r.result.result.value : undefined;
  }
  async navigate(url) { await this.send('Page.enable'); await this.send('Page.navigate', { url }); }
  async screenshot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path, Buffer.from(r.result.data, 'base64'));
  }
  close() { this.ws.close(); }
}

export async function getTab(urlPart) {
  const targets = await listTargets();
  return targets.find(t => t.type === 'page' && t.url.includes(urlPart));
}

export async function waitFor(ms) { return new Promise(r => setTimeout(r, ms)); }
