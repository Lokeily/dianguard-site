(function () {
  // Canvas seismic wave background
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let waves = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Wave {
    constructor() {
      this.reset();
      this.y = Math.random() * height;
    }
    reset() {
      this.x = -Math.random() * 200;
      this.y = Math.random() * height;
      this.speed = 0.4 + Math.random() * 0.8;
      this.amplitude = 20 + Math.random() * 40;
      this.wavelength = 120 + Math.random() * 180;
      this.opacity = 0.05 + Math.random() * 0.12;
      this.hue = Math.random() > 0.7 ? 0 : 210; // red or blue
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

  function animate() {
    ctx.clearRect(0, 0, width, height);
    waves.forEach(w => { w.update(); w.draw(); });
    requestAnimationFrame(animate);
  }
  animate();

  // Hero countdown animation
  const countEl = document.querySelector('.alert-eta .count');
  if (countEl) {
    let n = 12;
    setInterval(() => {
      n = n <= 3 ? 12 : n - 1;
      countEl.textContent = n;
    }, 1000);
  }

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.feature-card, .source-card, .step, .review-card, .disclaimer-block, .phone.small').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
})();
