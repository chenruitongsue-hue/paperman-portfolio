import { readFileSync, writeFileSync } from 'node:fs';

const base = 'assets/Figma-11111-原始素材-2026-08-10/extracted-mapping/';
const texts = JSON.parse(readFileSync(base + 'figma-text-nodes.json', 'utf8')).text_nodes;
const assets = JSON.parse(readFileSync(base + 'figma-image-usage.json', 'utf8')).assets;

const segsOf = p => p.split(' / ');
const boards = new Map();
const LOOSE = '独立元素（画布浮层）';

const boardOf = segs => (segs.length <= 4 ? LOOSE : segs[3]);
const blockOf = segs => (segs.length <= 4 ? segs[3] : (segs[4] || '(板块直属)'));
function getBlock(segs) {
  const bk = boardOf(segs);
  if (!boards.has(bk)) boards.set(bk, { key: bk, blocks: new Map(), template: false, lang: '' });
  const b = boards.get(bk);
  const kk = blockOf(segs);
  if (!b.blocks.has(kk)) b.blocks.set(kk, { name: kk, texts: [], images: [] });
  return { b, blk: b.blocks.get(kk) };
}

const CJK = /[一-鿿]/;
for (const t of texts) {
  const segs = segsOf(t.layer_path);
  const { b, blk } = getBlock(segs);
  blk.texts.push({ id: t.id, name: t.name, text: t.text, font: t.font_name?.family, px: t.font_size });
  if (/Title Title Title|Cover Photo|Game Summary\s+Game Summary|软件\s*图标/.test(t.text)) b.template = true;
  if (CJK.test(t.text)) b.zh = true; else if (/[A-Za-z]{3,}/.test(t.text)) b.en = true;
}
for (const b of boards.values()) b.lang = b.zh && b.en ? 'CN+EN' : b.zh ? 'CN' : b.en ? 'EN' : '—';

const nodeImg = new Map();
for (const a of assets) for (const u of (a.usages || [])) {
  nodeImg.set(u.node_id, {
    node_id: u.node_id, node_name: u.node_name, file: u.image_file || a.file,
    role: a.role, w: a.width, h: a.height, ow: u.original_width, oh: u.original_height,
    layer_path: u.layer_path,
  });
}
for (const info of nodeImg.values()) {
  const { blk } = getBlock(segsOf(info.layer_path));
  blk.images.push(info);
}

const unusedSources = assets.filter(a => a.role === 'source-image' && (!a.usages || a.usages.length === 0));

const baseName = k => k.replace(/\s*\[\d+:\d+\]$/, '');
const CANON = ['Cover', 'Settings', 'Game Mechanics', 'Level 01 Design', 'Art Creation Display', 'Game Development Iteration', 'Playtest & Feedback, Future Plan'];
const orderedKeys = [...boards.keys()].sort((a, b) => {
  const rank = k => baseName(k) === LOOSE ? 2 : CANON.includes(baseName(k)) ? 0 : 1;
  return rank(a) - rank(b);
});

const json = {
  meta: {
    generated_from: ['figma-text-nodes.json', 'figma-image-usage.json'],
    text_nodes: texts.length, image_usages: nodeImg.size,
    boards: orderedKeys,
  },
  boards: orderedKeys.map(key => {
    const b = boards.get(key);
    return {
      board: key, template: b.template, lang: b.lang,
      blocks: [...b.blocks.values()].map(bl => ({
        block: bl.name,
        texts: bl.texts,
        images: bl.images.map(({ node_id, node_name, file, role, w, h, ow, oh }) =>
          ({ node_id, node_name, file, role, w, h, ow, oh })),
      })),
    };
  }),
  unused_source_images: unusedSources.map(a => ({ file: a.file, w: a.width, h: a.height })),
};
writeFileSync(base + 'board-alignment.json', JSON.stringify(json, null, 2));

const esc = s => s.replace(/\|/g, '\\|');
let md = `# 板块 → 文字块 → 图片文件 总对齐表

源：Figma 11111 原生画布解码（${texts.length} 文字节点 / ${nodeImg.size} 图片引用 / ${boards.size} 板块）
依据：节点 GUID、父子层级、图层路径、绝对坐标、IMAGE paint 哈希（非视觉猜测）

`;

for (const key of orderedKeys) {
  const b = boards.get(key);
  const [name, id] = [key.replace(/\s*\[\d+:\d+\]$/, ''), (key.match(/\[(\d+:\d+)\]/) || [])[1]];
  const nT = [...b.blocks.values()].reduce((n, bl) => n + bl.texts.length, 0);
  const nI = [...b.blocks.values()].reduce((n, bl) => n + bl.images.length, 0);
  const kind = b.template ? '模板板（占位文案）' : nI === 0 ? '骨架板（仅标题文字）' : '填充板';
  md += `---\n\n## ${esc(name)}${id ? ` \`${id}\`` : ''} · ${kind} · 语言 ${b.lang} · ${nT} 文字 / ${nI} 图\n\n`;
  for (const bl of b.blocks.values()) {
    const blId = (bl.name.match(/\[(\d+:\d+)\]/) || [])[1];
    md += `### ${esc(bl.name.replace(/\s*\[\d+:\d+\]$/, ''))}${blId ? ` \`${blId}\`` : ''}\n\n`;
    if (bl.texts.length) {
      md += `**文字**\n\n`;
      for (const t of bl.texts) {
        md += `- \`${t.id}\` ${t.font || ''} ${t.px || ''}px\n\n\`\`\`\n${t.text}\n\`\`\`\n\n`;
      }
    }
    if (bl.images.length) {
      md += `**图片**\n\n`;
      for (const im of bl.images) {
        md += `- \`${im.node_id}\` ${esc(im.node_name)} → \`${im.file}\` · ${im.role} · 显示 ${im.w}×${im.h}${im.ow ? ` / 原 ${im.ow}×${im.oh}` : ''}\n`;
      }
      md += `\n`;
    }
  }
}

md += `---\n\n## 附录 A · 图片文件索引（源图 → 板块/块）\n\n| 文件 | 板块 | 块 | 节点名 | 原始尺寸 |\n|---|---|---|---|---|\n`;
for (const info of nodeImg.values()) {
  const s = segsOf(info.layer_path);
  md += `| \`${info.file}\` | ${esc(boardOf(s).replace(/\s*\[\d+:\d+\]$/, ''))} | ${esc(blockOf(s).replace(/\s*\[\d+:\d+\]$/, ''))} | ${esc(info.node_name)} | ${info.ow || info.w}×${info.oh || info.h} |\n`;
}
md += `\n## 附录 B · 未被引用的源图\n\n`;
md += unusedSources.length ? unusedSources.map(a => `- \`${a.file}\` ${a.width}×${a.height}`).join('\n') : '（无）';
md += `\n`;
writeFileSync(base + 'board-alignment.md', md);

console.log('boards:', orderedKeys.map(k => `${k}${boards.get(k).template ? '(模板)' : ''}[${boards.get(k).lang}]`).join(' | '));
console.log('texts:', texts.length, 'imageUsages:', nodeImg.size, 'unusedSources:', unusedSources.length);
