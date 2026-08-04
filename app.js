(function () {
  'use strict';

  /* ---------- 1. 波纹背景动画 ---------- */
  const canvas = document.getElementById('wave-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width, height, dpr = 1;
    let isVisible = true;
    let rafId = null;
    const waves = [];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduceMotion) drawStill();
    }

    class Wave {
      constructor() { this.reset(); this.y = Math.random() * height; }
      reset() {
        this.x = -Math.random() * 200;
        this.y = Math.random() * height;
        this.speed = 0.3 + Math.random() * 0.5;
        this.amplitude = 18 + Math.random() * 34;
        this.wavelength = 140 + Math.random() * 200;
        this.opacity = 0.04 + Math.random() * 0.10;
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
        ctx.lineWidth = 1.3;
        for (let px = 0; px <= width; px += 7) {
          const dy = Math.sin((px - this.x) / this.wavelength * Math.PI * 2) * this.amplitude;
          if (px === 0) ctx.moveTo(px, this.y + dy);
          else ctx.lineTo(px, this.y + dy);
        }
        ctx.stroke();
      }
    }

    for (let i = 0; i < 7; i++) waves.push(new Wave());

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);
      waves.forEach(w => { w.update(); w.draw(); });
    }
    function drawStill() {
      ctx.clearRect(0, 0, width, height);
      waves.forEach((w, i) => { w.x = i * (width / waves.length); w.draw(); });
    }
    function loop() {
      if (!isVisible) return;
      drawFrame();
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      isVisible = document.visibilityState === 'visible';
      if (isVisible && !reduceMotion) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(loop);
      } else if (!isVisible && rafId) {
        cancelAnimationFrame(rafId); rafId = null;
      }
    });

    resize();
    if (reduceMotion) drawStill();
    else rafId = requestAnimationFrame(loop);
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
  if (countEl || ringFgEl) {
    setCountdown(12);
    setInterval(() => { cd = cd <= 0 ? 12 : cd - 1; setCountdown(cd); }, 1000);
  }

  /* ---------- 3. 滚动进度条 + 导航栏悬浮态 ---------- */
  const progressBar = document.querySelector('.scroll-progress i');
  const siteNav = document.getElementById('site-nav');

  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const scrolled = doc.scrollTop || document.body.scrollTop || window.scrollY || 0;
    if (progressBar) {
      const p = max > 0 ? scrolled / max : 0;
      progressBar.style.width = (Math.min(1, Math.max(0, p)) * 100).toFixed(2) + '%';
    }
    if (siteNav) siteNav.classList.toggle('scrolled', scrolled > 12);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 4. 移动端导航菜单 ---------- */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- 5. 光标跟随高光 (spotlight) ---------- */
  const spotEls = document.querySelectorAll(
    '.feature-card, .source-card, .level-row, .perm-card, .stat-cell, ' +
    '.arch-node, .tl-step, .flow-node, .callout, .formula-card, .release-card'
  );
  spotEls.forEach(el => el.classList.add('spot'));
  document.addEventListener('mousemove', (e) => {
    const s = e.target.closest && e.target.closest('.spot');
    if (s) {
      const r = s.getBoundingClientRect();
      s.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      s.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
  }, { passive: true });

  /* ---------- 6. 数字滚动计数 ---------- */
  function animateCount(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const dur = 1500;
    const start = performance.now();
    (function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target.toFixed(decimals) + suffix;
    })(start);
  }

  /* ---------- 7. 滚动渐显 + 计数触发 ---------- */
  const REVEAL_SELECTOR = [
    '.fade-block', '.fx-block', '.fx-row', '.fx-copy', '.fx-visual',
    '.feature-card', '.source-card', '.level-row', '.perm-card', '.stat-cell',
    '.stat-strip', '.arch', '.arch-node', '.tl-step', '.tl-track', '.pw-demo',
    '.formula-card', '.bz-graph', '.bz-legend', '.flow-node', '.flow-split',
    '.callout', '.cmp-table', '.cta-inner', '.how-step', '.how-arrow',
    '.reliability-text', '.reliability-graph', '.release-card', '.disclaimer-block',
    '.review-card', '.download-version', '.phone.small', '.step', '.faq-item',
    '.voice-seq', '.vs-item', '.screen-showcase',
    '.timeline', '.blindzone', '.flow', '.intensity-vis'
  ].join(', ');

  const revealTargets = document.querySelectorAll(REVEAL_SELECTOR);
  revealTargets.forEach(el => el.classList.add('reveal'));

  // 方向性提示
  document.querySelectorAll('.fx-visual, .tl-track, .voice-visual, .reliability-graph, .screen-showcase')
    .forEach(el => el.classList.add('from-right'));
  document.querySelectorAll('.fx-copy, .reliability-text, .voice-text')
    .forEach(el => el.classList.add('from-left'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      entry.target.querySelectorAll('[data-count]').forEach(animateCount);
      if (entry.target.matches('[data-count]')) animateCount(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach(el => io.observe(el));

  /* ---------- 7.5 增强动效：in-view 触发 ---------- */
  // 以下元素的 CSS 动画需要 .in-view 类才会启动。
  // 用一个独立的 IntersectionObserver 在元素进入视口时添加该类，
  // 首次触发后不再移除（动画持续播放或按 CSS 定义一次性完成）。
  const ENHANCE_SELECTOR = [
    '.hero-device', '.how-grid', '.reliability-graph',
    '.screen-showcase', '.voice-seq', '.cmp-table',
    '.flow', '.level-row'
  ].join(', ');
  const enhanceEls = document.querySelectorAll(ENHANCE_SELECTOR);
  const enhanceIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        enhanceIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  enhanceEls.forEach(el => enhanceIO.observe(el));

  /* ---------- 7.6 功能详解 · 语音序列轮播 ---------- */
  // 三段语音序列依次「激活」，模拟逐段播报的真实流程。
  const voiceSeq = document.querySelector('.voice-seq');
  if (voiceSeq) {
    const items = voiceSeq.querySelectorAll('.vs-item');
    let vIdx = 0;
    const voiceIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        voiceIO.unobserve(e.target);
        setInterval(() => {
          items.forEach(it => it.classList.remove('active'));
          if (items[vIdx]) items[vIdx].classList.add('active');
          vIdx = (vIdx + 1) % items.length;
        }, 2200);
      });
    }, { threshold: 0.3 });
    voiceIO.observe(voiceSeq);
  }

  /* ---------- 8. 子页锚点导航高亮 ---------- */
  const subnav = document.getElementById('subnav');
  if (subnav) {
    const links = Array.from(subnav.querySelectorAll('a'));
    const map = {};
    links.forEach(l => {
      const href = l.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        const sec = document.getElementById(href.slice(1));
        if (sec) map[href.slice(1)] = l;
      }
    });
    const subIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const l = map[entry.target.id];
          if (l) l.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(id => {
      const s = document.getElementById(id);
      if (s) subIO.observe(s);
    });
  }

  /* ---------- 9. GitHub Release 实时同步 ---------- */
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

  // 极简 Markdown 渲染（标题 / 列表 / 加粗 / 行内代码 / 链接 / 分割线 / 引用）
  //
  // 标题：支持 # ~ ###### 全部六级。卡片头部已展示版本号，故整体降级两档
  // 映射到 h3~h5，避免与页面 h1/h2 抢层级；四级以上统一收敛到 h5。
  // （旧实现只认 # / ## / ###，Release 里常用的 #### 会被当成正文，
  //   直接把「#### 标题」四个井号原样渲染出来。）
  function renderMarkdown(md) {
    if (!md) return '';
    const lines = md.replace(/\r/g, '').split('\n');
    let html = '', inUl = false, inOl = false, inCode = false;
    const closeLists = () => {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    };
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = t => esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const HTAG = { 1: 'h3', 2: 'h3', 3: 'h4', 4: 'h5', 5: 'h5', 6: 'h5' };

    for (const raw of lines) {
      const line = raw.trimEnd();
      let m;

      // 围栏代码块：内部内容原样转义，不参与其他规则
      if (/^\s*```/.test(line)) {
        closeLists();
        html += inCode ? '</code></pre>' : '<pre class="release-pre"><code>';
        inCode = !inCode;
        continue;
      }
      if (inCode) { html += esc(raw) + '\n'; continue; }

      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        closeLists();
        const tag = HTAG[m[1].length];
        html += '<' + tag + '>' + inline(m[2]) + '</' + tag + '>';
      }
      else if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) { closeLists(); html += '<hr>'; }
      else if ((m = line.match(/^\s*>\s?(.*)$/))) {
        closeLists(); html += '<blockquote>' + inline(m[1]) + '</blockquote>';
      }
      else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
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
    if (inCode) html += '</code></pre>';
    closeLists();
    return html;
  }

  // Release 正文首行常是「## v1.2.0 更新说明」，与卡片头部的版本号重复，去掉。
  function stripRedundantTitle(body, ver) {
    if (!body) return body;
    const lines = body.replace(/\r/g, '').split('\n');
    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    const first = (lines[i] || '').trim();
    if (/^#{1,6}\s/.test(first) && first.indexOf(ver) !== -1) {
      lines.splice(i, 1);
      return lines.join('\n');
    }
    return body;
  }

  function renderChangelog(releases) {
    const list = document.getElementById('release-list');
    if (!list) return;

    // 拿不到数据时，保留页面内已烘焙的静态更新记录，不做任何改动。
    if (!releases || !releases.length) return;

    // 与页面内烘焙的版本完全一致时跳过重绘，避免打开页面时闪一下。
    const signature = releases.map(versionOf).join(',');
    if (list.getAttribute('data-baked') === signature) return;

    list.innerHTML = releases.map((rel, i) => {
      const ver = versionOf(rel);
      const date = fmtDate(rel.published_at);
      const body = stripRedundantTitle(rel.body || '', ver);
      const notes = renderMarkdown(body.trim() || '（本次发布未附文字说明，详见 GitHub Release 页面。）');
      const dl = findApk(rel);
      const dlHtml = dl
        ? '<p class="release-dl"><a class="btn btn-secondary btn-small" href="' + dl + '" target="_blank" rel="noopener">下载 v' + ver + ' APK</a></p>'
        : '';
      const latest = i === 0 ? ' latest' : '';
      const badge = i === 0 ? '<span class="release-badge">最新</span>' : '';
      return '<article class="release-card' + latest + '">' +
        '<div class="release-head">' +
          '<span class="release-version">v' + ver + '</span>' + badge +
          '<span class="release-date">' + date + '</span>' +
        '</div>' +
        '<div class="release-notes">' + notes + '</div>' +
        dlHtml +
      '</article>';
    }).join('');
    list.setAttribute('data-baked', signature);
    list.querySelectorAll('.release-card').forEach(el => { el.classList.add('reveal', 'revealed'); });
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
        // 失败时静默降级：首页保持静态默认版本号，更新页保留已烘焙的静态记录。
        // GitHub API 对未认证请求限流 60 次/小时/IP，校园网、公司网等
        // 共享出口 IP 很容易触发，因此页面内容不能依赖这次请求。
      });
  }

  fetchReleases();
})();
