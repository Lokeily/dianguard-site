(function () {
  'use strict';

  /* ---------- 1. 波纹背景动画 ---------- */
  const canvas = document.getElementById('wave-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    const waves = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Wave {
      constructor() { this.reset(); this.y = Math.random() * height; }
      reset() {
        this.x = -Math.random() * 200;
        this.y = Math.random() * height;
        this.speed = 0.4 + Math.random() * 0.8;
        this.amplitude = 20 + Math.random() * 40;
        this.wavelength = 120 + Math.random() * 180;
        this.opacity = 0.05 + Math.random() * 0.12;
        this.hue = Math.random() > 0.7 ? 0 : 210;
      }
      update() {
        this.x += this.speed;
        if (this.x - this.wavelength > width) this.reset();
      }
      draw() {
        ctx.beginPath();
        const color = this.hue === 0
          ? `rgba(255, 59, 48, ${this.opacity})`
          : `rgba(10, 132, 255, ${this.opacity})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        for (let px = 0; px <= width; px += 6) {
          const dy = Math.sin((px - this.x) / this.wavelength * Math.PI * 2) * this.amplitude;
          if (px === 0) ctx.moveTo(px, this.y + dy);
          else ctx.lineTo(px, this.y + dy);
        }
        ctx.stroke();
      }
    }
    for (let i = 0; i < 8; i++) waves.push(new Wave());

    (function animate() {
      ctx.clearRect(0, 0, width, height);
      waves.forEach(w => { w.update(); w.draw(); });
      requestAnimationFrame(animate);
    })();
  }

  /* ---------- 2. 首屏倒计时进度环 ---------- */
  const countEl = document.querySelector('.alert-eta .count');
  const ringFgEl = document.querySelector('.eta-ring-fg');
  const C = 2 * Math.PI * 44; // r=44
  let cd = 12;
  function setCountdown(n) {
    if (countEl) countEl.textContent = n;
    if (ringFgEl) ringFgEl.style.strokeDashoffset = (C * (1 - n / 12)).toFixed(2);
  }
  setCountdown(12);
  setInterval(() => { cd = cd <= 0 ? 12 : cd - 1; setCountdown(cd); }, 1000);

  /* ---------- 3. 滚动渐显 ---------- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(
    '.feature-card, .source-card, .step, .review-card, .disclaimer-block, ' +
    '.phone.small, .how-step, .reliability-text, .reliability-graph, .faq-item, .release-card, .download-version'
  ).forEach(el => { el.classList.add('reveal'); observer.observe(el); });

  /* ---------- 4. GitHub Release 实时同步 ---------- */
  const REPO = 'Lokeily/Earthquake-Sentinel';
  const RELEASES_URL = 'https://api.github.com/repos/' + REPO + '/releases?per_page=20';
  const CACHE_KEY = 'dg_releases_v1';
  const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

  function findApk(release) {
    if (!release.assets) return null;
    const apk = release.assets.find(a => /\.apk$/i.test(a.name));
    return apk ? apk.browser_download_url : null;
  }

  function versionOf(release) {
    const t = release.tag_name || release.name || '';
    return t.replace(/^v/i, '');
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso.slice(0, 10);
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function applyLatest(rel) {
    if (!rel) return;
    const ver = versionOf(rel);
    const apkUrl = findApk(rel);
    const apkName = (rel.assets || []).find(a => /\.apk$/i.test(a.name));
    const date = fmtDate(rel.published_at);
    const size = apkName && apkName.size ? apkName.size : 0;

    document.querySelectorAll('[data-release-download]').forEach(a => {
      if (apkUrl) a.href = apkUrl;
    });
    const mainLabel = document.querySelector('.download .dl-label');
    if (mainLabel) mainLabel.textContent = '下载 Dianguard v' + ver;
    const badge = document.querySelector('[data-release-badge]');
    if (badge) badge.textContent = 'Android 版 v' + ver + ' 已发布';
    const apkEl = document.querySelector('[data-release-apkname]');
    if (apkEl && apkName) apkEl.textContent = apkName.name;
    const sizeEl = document.querySelector('[data-release-size]');
    if (sizeEl && size) sizeEl.textContent = String(Math.max(1, Math.round(size / 1e6)));
    const line = document.querySelector('[data-release-version-line]');
    if (line) line.innerHTML = '当前最新版本 <strong>v' + ver + '</strong> · 发布于 ' + date;
  }

  // 极简 Markdown 渲染（标题 / 列表 / 加粗 / 行内代码 / 链接 / 分割线）
  function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.replace(/\r/g, '').split('\n');
    let html = '', inUl = false, inOl = false;
    const closeLists = () => {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    };
    const inline = t => t
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    for (const raw of lines) {
      const line = raw.trimEnd();
      let m;
      if ((m = line.match(/^###\s+(.*)$/))) { closeLists(); html += '<h4>' + inline(m[1]) + '</h4>'; }
      else if ((m = line.match(/^##\s+(.*)$/))) { closeLists(); html += '<h3>' + inline(m[1]) + '</h3>'; }
      else if ((m = line.match(/^#\s+(.*)$/))) { closeLists(); html += '<h2>' + inline(m[1]) + '</h2>'; }
      else if (/^---+\s*$/.test(line)) { closeLists(); html += '<hr>'; }
      else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul>'; inUl = true; }
        html += '<li>' + inline(m[1]) + '</li>';
      }
      else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol>'; inOl = true; }
        html += '<li>' + inline(m[1]) + '</li>';
      }
      else if (line === '') { closeLists(); }
      else { closeLists(); html += '<p>' + inline(line) + '</p>'; }
    }
    closeLists();
    return html;
  }

  function renderChangelog(releases) {
    const list = document.getElementById('release-list');
    if (!list) return;
    if (!releases || !releases.length) {
      list.innerHTML = '<div class="release-error">暂时无法加载更新记录，请稍后重试，或直接前往 ' +
        '<a href="https://github.com/' + REPO + '/releases" target="_blank" rel="noopener">GitHub Release</a> 查看。</div>';
      return;
    }
    list.innerHTML = releases.map((rel, i) => {
      const ver = versionOf(rel);
      const date = fmtDate(rel.published_at);
      const notes = renderMarkdown(rel.body || '（暂无文字说明，详见 GitHub Release）');
      const dl = findApk(rel);
      const dlHtml = dl
        ? '<p class="release-dl"><a class="btn btn-secondary btn-small" href="' + dl + '" target="_blank" rel="noopener">下载此版本 APK</a></p>'
        : '';
      const latest = i === 0 ? ' latest' : '';
      const badge = i === 0 ? '<span class="release-badge">最新</span>' : '';
      return '<article class="release-card' + latest + ' reveal">' +
        '<div class="release-head">' +
          '<span class="release-version">v' + ver + '</span>' + badge +
          '<span class="release-date">' + date + '</span>' +
        '</div>' +
        '<div class="release-notes">' + notes + '</div>' +
        dlHtml +
      '</article>';
    }).join('');
    list.querySelectorAll('.release-card').forEach(el => { el.classList.add('revealed'); });
  }

  function loadFallback() {
    // 接口不可用时，用页面内嵌快照兜底（保证页面不空白）
    try {
      const raw = document.getElementById('fallback-releases');
      if (raw) {
        const fb = JSON.parse(raw.textContent);
        const mapped = fb.map(r => ({
          tag_name: r.tag, name: r.tag, published_at: r.date + 'T00:00:00Z',
          body: r.notes, assets: [], prerelease: false, draft: false
        }));
        renderChangelog(mapped);
      }
    } catch (e) { /* ignore */ }
  }

  function fetchReleases() {
    const cached = (function () {
      try {
        const s = localStorage.getItem(CACHE_KEY);
        if (!s) return null;
        const o = JSON.parse(s);
        if (Date.now() - o.ts < CACHE_TTL) return o.data;
      } catch (e) {}
      return null;
    })();

    if (cached) {
      applyLatest(cached[0]);
      renderChangelog(cached);
      return;
    }

    fetch(RELEASES_URL, { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(data => {
        const list = (Array.isArray(data) ? data : [])
          .filter(r => !r.draft && !r.prerelease);
        if (!list.length) throw new Error('empty');
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: list }));
        } catch (e) {}
        applyLatest(list[0]);
        renderChangelog(list);
      })
      .catch(() => {
        // 失败时：首页保持静态默认值，更新页用内嵌快照兜底
        if (document.getElementById('release-list')) loadFallback();
      });
  }

  fetchReleases();
})();
