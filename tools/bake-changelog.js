#!/usr/bin/env node
/**
 * 把 GitHub Release 烘焙成 changelog.html 里的静态内容。
 *
 * 为什么需要这一步：
 *   浏览器直连 GitHub API 时是未认证请求，限流 60 次/小时/IP。校园网、
 *   公司网这类共享出口 IP 很容易被限流，页面就会空着。所以更新记录必须
 *   先以静态 HTML 存在，JS 只负责在能连通时刷新出更新的版本。
 *
 * 渲染函数直接从 app.js 里抽取执行，保证烘焙结果与运行时渲染逐字一致。
 *
 * 用法：
 *   GITHUB_TOKEN=xxx node tools/bake-changelog.js     # 带 token，避免限流
 *   node tools/bake-changelog.js                      # 匿名请求亦可
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_JS = path.join(ROOT, 'app.js');
const CHANGELOG = path.join(ROOT, 'changelog.html');
const REPO = 'Lokeily/Earthquake-Sentinel';

const BEGIN = '<!-- BAKED:BEGIN -->';
const END = '<!-- BAKED:END -->';

/** 从 app.js 中抽出指定函数的源码，避免维护两份实现。 */
function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('在 app.js 中找不到函数 ' + name);
  let i = src.indexOf('{', start);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('函数 ' + name + ' 括号不闭合');
}

function loadRenderers() {
  const src = fs.readFileSync(APP_JS, 'utf8');
  const code = [
    extractFn(src, 'renderMarkdown'),
    extractFn(src, 'stripRedundantTitle'),
    extractFn(src, 'versionOf'),
    extractFn(src, 'fmtDate'),
    extractFn(src, 'findApk'),
    'return { renderMarkdown, stripRedundantTitle, versionOf, fmtDate, findApk };'
  ].join('\n');
  return new Function(code)();
}

async function fetchReleases() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'dianguard-site-bake' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = 'token ' + process.env.GITHUB_TOKEN;
  const res = await fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=20', { headers });
  if (!res.ok) throw new Error('GitHub API 返回 ' + res.status);
  const data = await res.json();
  return data.filter(r => !r.draft && !r.prerelease);
}

function buildCards(releases, R) {
  return releases.map((rel, i) => {
    const ver = R.versionOf(rel);
    const date = R.fmtDate(rel.published_at);
    const body = R.stripRedundantTitle(rel.body || '', ver);
    const notes = R.renderMarkdown(body.trim() || '（本次发布未附文字说明，详见 GitHub Release 页面。）');
    const dl = R.findApk(rel);
    const dlHtml = dl
      ? '\n      <p class="release-dl"><a class="btn btn-secondary btn-small" href="' + dl +
        '" target="_blank" rel="noopener">下载 v' + ver + ' APK</a></p>'
      : '';
    const latest = i === 0 ? ' latest' : '';
    const badge = i === 0 ? '<span class="release-badge">最新</span>' : '';
    return '    <article class="release-card' + latest + '">\n' +
      '      <div class="release-head">\n' +
      '        <span class="release-version">v' + ver + '</span>' + badge + '\n' +
      '        <span class="release-date">' + date + '</span>\n' +
      '      </div>\n' +
      '      <div class="release-notes">' + notes + '</div>' + dlHtml + '\n' +
      '    </article>';
  }).join('\n');
}

(async function main() {
  const R = loadRenderers();
  const releases = await fetchReleases();
  if (!releases.length) throw new Error('没有取到任何正式 Release');

  const signature = releases.map(R.versionOf).join(',');
  const cards = buildCards(releases, R);

  const block = BEGIN + '\n' +
    '  <div id="release-list" class="release-list" data-baked="' + signature + '">\n' +
    cards + '\n' +
    '  </div>\n  ' + END;

  const html = fs.readFileSync(CHANGELOG, 'utf8');
  const s = html.indexOf(BEGIN);
  const e = html.indexOf(END);
  if (s === -1 || e === -1) throw new Error('changelog.html 中缺少 BAKED 标记');

  fs.writeFileSync(CHANGELOG, html.slice(0, s) + block + html.slice(e + END.length), 'utf8');
  console.log('已烘焙 ' + releases.length + ' 个版本: ' + signature);
})().catch(err => {
  console.error('烘焙失败:', err.message);
  process.exit(1);
});
