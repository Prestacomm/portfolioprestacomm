/* ==========================================================
   PRESTACOMM — maquette v1 — animations
   GSAP + ScrollTrigger + Lenis (défilement fluide)
   ========================================================== */
(() => {
  'use strict';

  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad3 = (n) => String(Math.round(n)).padStart(3, '0');
  const easeOut4 = (t) => 1 - Math.pow(1 - t, 4);

  let lenis = null;
  let casesST = null;

  /* ---------- Découpe de texte ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return Array.from(text).map((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
      return s;
    });
  }
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
  }
  function splitHeadline(el) {
    // « On en parle ? » -> mots (masque) + lettres ; l'espace insécable garde « parle ? » ensemble
    const words = el.textContent.trim().split(' ');
    el.textContent = '';
    const chars = [];
    words.forEach((w) => {
      const wrap = document.createElement('span');
      wrap.className = 'word';
      wrap.setAttribute('aria-hidden', 'true');
      Array.from(w).forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch;
        wrap.appendChild(s);
        chars.push(s);
      });
      el.appendChild(wrap);
    });
    return chars;
  }

  /* ---------- Défilement fluide ---------- */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: easeOut4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  }

  function initAnchors() {
    $$('[data-scroll]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        let target;
        if (id === '#top') target = 0;
        else if (id === '#cas' && casesST) target = casesST.start;
        else target = $(id);
        if (target === null || target === undefined) return;
        e.preventDefault();
        scrollToTarget(target);
      });
    });
  }

  /* ---------- Couleur de l'interface fixe selon le fond ---------- */
  function initUI() {
    const secs = $$('[data-ui]').filter((el) => !el.classList.contains('slide'));
    const slides = $$('.slide');
    const y = 56;
    let current = html.dataset.ui;
    const set = (v) => { if (v && v !== current) { current = v; html.dataset.ui = v; } };
    const update = () => {
      // la dernière section dans le DOM est celle qui recouvre les autres
      for (let i = secs.length - 1; i >= 0; i--) {
        const el = secs[i];
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          if (el.classList.contains('cases') && casesST && slides.length) {
            const idx = Math.min(slides.length - 1, Math.round(casesST.progress * (slides.length - 1)));
            set(slides[idx].dataset.ui);
          } else {
            set(el.dataset.ui);
          }
          return;
        }
      }
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
    update();
  }

  /* ---------- Chargement + intro ---------- */
  function runLoader(onLift) {
    // Déjà vu pendant cette session : intro express
    let seen = false;
    try { seen = sessionStorage.getItem('pc_seen') === '1'; sessionStorage.setItem('pc_seen', '1'); } catch (e) { /* stockage indisponible */ }
    const k = seen ? 0.3 : 1;
    const num = $('.loader__num');
    const fill = $('.loader__fill');
    const obj = { v: 0 };
    const tl = gsap.timeline();
    tl.to(obj, {
      v: 100, duration: 1.1 * k, ease: 'power2.inOut',
      onUpdate: () => {
        num.textContent = pad3(obj.v);
        fill.style.clipPath = 'inset(' + (100 - obj.v).toFixed(1) + '% 0 0 0)';
      },
    })
      .to('.loader__logo', { scale: 1.05, duration: 0.5, ease: 'expo.out' }, '>-0.1')
      .to('.loader__num', { yPercent: -45, opacity: 0, duration: 0.4, ease: 'power3.in' }, '<')
      .to('.loader', { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, '>0.05')
      .add(onLift, '<0.4')
      .set('.loader', { display: 'none' });
  }

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => lenis && lenis.start() });
    tl.fromTo('.hero-logo', { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 14, scale: 1.06 }, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, scale: 1, duration: 1.5 }, 0)
      .fromTo('.hero__meta > *', { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.3)
      .fromTo('.hero__lead', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.5)
      .fromTo('.hero__cta > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.65)
      .fromTo('.monitor', { y: 90, opacity: 0, rotateX: 18, scale: 0.92 }, { y: 0, opacity: 1, rotateX: 0, scale: 1, duration: 1.6 }, 0.25)
      .fromTo('.hero .blob', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: 'back.out(1.5)', stagger: 0.12 }, 0.2)
      .fromTo('.badge', { scale: 0, rotate: -90, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.4)' }, 0.9)
      .fromTo('.hero__foot > *', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.8)
      .fromTo('.nav > *', { y: -22, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.3);
  }

  /* ---------- Hero ---------- */
  function initHero() {
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
    gsap.to('.hero__inner', {
      scale: 0.92, yPercent: -8, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    gsap.set('.monitor__tilt', { transformPerspective: 1300 });
    if (fine) {
      const rx = gsap.quickTo('.monitor__tilt', 'rotationX', { duration: 0.9, ease: 'power3' });
      const ry = gsap.quickTo('.monitor__tilt', 'rotationY', { duration: 0.9, ease: 'power3' });
      window.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        ry(x * 16);
        rx(-y * 11);
      }, { passive: true });
    }

    // Écran du moniteur : les publications apparaissent, une est aimée, une notification passe
    const tiles = $$('.tile');
    const toast = $('.toast');
    if (tiles.length) {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, delay: 1.8 });
      tl.fromTo(tiles, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.6)', stagger: { each: 0.07, from: 'random' } })
        .fromTo(toast, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' }, '-=0.2')
        .to(tiles[4], { scale: 1.14, duration: 0.35, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '<0.2')
        .to(toast, { y: -10, opacity: 0, duration: 0.5, ease: 'power3.in' }, '+=1.6')
        .to(tiles, { scale: 0.4, opacity: 0, duration: 0.5, ease: 'power3.in', stagger: { each: 0.03, from: 'random' } }, '+=0.3');
    }
  }

  /* ---------- Bulles décoratives ---------- */
  function initBlobs() {
    $$('.blob').forEach((b, i) => {
      gsap.to(b, {
        x: 'random(-26, 26)', y: 'random(-26, 26)', rotation: 'random(-14, 14)',
        duration: 'random(5, 9)', repeat: -1, yoyo: true, repeatRefresh: true, ease: 'sine.inOut', delay: i * 0.2,
      });
      const speed = parseFloat(b.dataset.speed || '0');
      if (speed) {
        gsap.to(b, {
          yPercent: speed * 100, ease: 'none',
          scrollTrigger: { trigger: b.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }
    });
  }

  /* ---------- Bandeau défilant ---------- */
  function initMarquee() {
    const tweens = [];
    $$('.marquee__row').forEach((row) => {
      const track = $('.marquee__track', row);
      const group = $('.marquee__group', track);
      for (let i = 0; i < 3; i++) track.appendChild(group.cloneNode(true));
      const reverse = row.classList.contains('marquee__row--rev');
      const pct = 100 / track.children.length;
      tweens.push(gsap.fromTo(track,
        { xPercent: reverse ? -pct : 0 },
        { xPercent: reverse ? 0 : -pct, duration: 28, ease: 'none', repeat: -1 }));
    });
    // Le défilement du bandeau s'accélère avec la vitesse de scroll
    let boost = 0;
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => { boost = Math.max(boost, Math.min(Math.abs(self.getVelocity()) / 450, 6)); },
    });
    gsap.ticker.add(() => {
      boost += (0 - boost) * 0.06;
      tweens.forEach((t) => t.timeScale(1 + boost));
    });
  }

  /* ---------- Manifeste ---------- */
  function initManifesto() {
    const text = $('.manifesto__text');
    const words = splitWords(text);
    gsap.fromTo(words, { color: '#E6CD84' }, {
      color: '#7C0F27', ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: text, start: 'top 82%', end: 'bottom 52%', scrub: 0.5 },
    });
    gsap.from('.manifesto__foot > *', {
      y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.manifesto__foot', start: 'top 92%' },
    });
  }

  /* ---------- En bref ---------- */
  function initStats() {
    gsap.from('.stat', {
      y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.stats__grid', start: 'top 88%' },
    });
    $$('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(o, { v: to, duration: 1.7, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('fr-FR'); } }),
      });
    });
  }

  /* ---------- Réalisations : slides épinglées ---------- */
  function initCases() {
    const root = $('.cases');
    if (!root) return;
    const slides = $$('.slide', root);
    const n = slides.length;
    const ticks = $$('.cases__tick', root);
    slides.forEach((s, i) => { s.style.zIndex = String(i + 1); });

    const firstLines = $$('.mask > span', slides[0]);
    const firstFade = $$('.fade', slides[0]);
    gsap.set(firstLines, { yPercent: 110 });
    gsap.set(firstFade, { opacity: 0, y: 20 });
    ScrollTrigger.create({
      trigger: root, start: 'top 65%', once: true,
      onEnter: () => {
        gsap.to(firstLines, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out' });
        gsap.to(firstFade, { opacity: 1, y: 0, duration: 1, stagger: 0.08, delay: 0.3, ease: 'expo.out' });
      },
    });

    // flottement doux des « posts »
    $$('.post', root).forEach((p, i) => {
      gsap.to(p, { y: gsap.utils.random(-6, 6), rotate: gsap.utils.random(-0.8, 0.8), duration: gsap.utils.random(2.8, 4.4), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.15 });
    });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root, start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 0.95 * (n - 1)),
        pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.round(self.progress * (n - 1));
          ticks.forEach((t, i) => t.classList.toggle('is-on', i === idx));
        },
      },
    });

    // La slide i est entièrement visible au temps entier i ; durée totale = n - 1
    for (let i = 1; i < n; i++) {
      const t = (i - 1) + 0.2;
      const prev = slides[i - 1];
      const next = slides[i];
      tl.fromTo(next, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.inOut', duration: 0.8 }, t)
        .to($('.slide__inner', prev), { yPercent: -10, scale: 0.95, ease: 'power2.in', duration: 0.8 }, t)
        .to($('.slide__shade', prev), { opacity: 0.6, duration: 0.8 }, t)
        .fromTo($('.slide__inner', next), { yPercent: 12 }, { yPercent: 0, ease: 'power3.out', duration: 0.8 }, t)
        .fromTo($('.art', next), { scale: 1.35 }, { scale: 1, ease: 'power2.out', duration: 0.8 }, t)
        .fromTo($$('.mask > span', next), { yPercent: 110 }, { yPercent: 0, ease: 'power3.out', duration: 0.35, stagger: 0.04 }, t + 0.25)
        .fromTo($$('.fade', next), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04 }, t + 0.35);
    }
    casesST = tl.scrollTrigger;

    // Aimantation sur les slides (via Lenis, pour ne pas lutter contre le défilement fluide)
    if (lenis) {
      let timer = null;
      lenis.on('scroll', () => {
        clearTimeout(timer);
        const p = casesST.progress;
        if (p <= 0 || p >= 1) return;
        timer = setTimeout(() => {
          const span = casesST.end - casesST.start;
          const target = Math.round(casesST.progress * (n - 1)) / (n - 1);
          const dist = Math.abs(target - casesST.progress) * span;
          if (dist < 3) return;
          lenis.scrollTo(casesST.start + target * span, { duration: 0.8, easing: easeOut4 });
        }, 150);
      });
    } else {
      casesST.vars.snap = { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.05, ease: 'power2.inOut' };
    }
  }

  /* ---------- Lecteur Instagram (chargé uniquement au clic) ---------- */
  function initLightbox() {
    const box = $('.lightbox');
    if (!box) return;
    const frame = $('.lightbox__frame', box);
    const link = $('.lightbox__link', box);
    const closeBtn = $('.lightbox__close', box);
    let last = null;
    const open = (path, trigger) => {
      last = trigger;
      frame.src = 'https://www.instagram.com/' + path + '/embed/';
      link.href = 'https://www.instagram.com/' + path + '/';
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };
    const close = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      frame.src = 'about:blank';
      if (lenis) lenis.start(); else document.body.style.overflow = '';
      if (last) last.focus();
    };
    $$('.pub').forEach((b) => b.addEventListener('click', () => open(b.dataset.ig, b)));
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
  }

  /* ---------- Services ---------- */
  function initServices() {
    gsap.from('.services .sec-head > *', {
      y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.services .sec-head', start: 'top 85%' },
    });
    gsap.from('.card', {
      y: 90, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14,
      scrollTrigger: { trigger: '.svc', start: 'top 88%' },
    });
    gsap.fromTo('.services__ghost', { xPercent: 12 }, {
      xPercent: -38, ease: 'none',
      scrollTrigger: { trigger: '.services', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* ---------- L'agence en mouvement ---------- */
  function initReel() {
    gsap.from('.reel .sec-head > *', {
      y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: '.reel .sec-head', start: 'top 85%' },
    });
    // le cadre vidéo grandit et s'arrondit moins au fil du scroll
    gsap.fromTo('.reel__frame', { scale: 0.78, borderRadius: 140 }, {
      scale: 1, borderRadius: 32, ease: 'none',
      scrollTrigger: { trigger: '.reel__frame', start: 'top 92%', end: 'top 30%', scrub: true },
    });
  }

  /* ---------- Méthode ---------- */
  function initMethod() {
    const chars = splitChars($('.method__title'));
    gsap.from(chars, {
      yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: '.method__title', start: 'top 85%' },
    });
    const steps = $$('.step');
    const box = $('.steps');
    gsap.fromTo(box, { '--p': 0 }, {
      '--p': 1, ease: 'none',
      scrollTrigger: {
        trigger: box, start: 'top 72%', end: 'bottom 62%', scrub: 0.4,
        onUpdate: (self) => {
          steps.forEach((s, i) => s.classList.toggle('is-on', self.progress >= i / steps.length - 0.01));
        },
      },
    });
  }

  /* ---------- Clients ---------- */
  function initBrands() {
    gsap.from('.brand', {
      y: 34, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.brands__strip', start: 'top 90%' },
    });
  }

  /* ---------- Réservation (aperçu : rien n'est envoyé) ---------- */
  function initBooking() {
    const daysEl = $('.book__days');
    const slotsEl = $('.book__slots');
    const confirm = $('.book__confirm');
    const done = $('.book__done');
    if (!daysEl) return;

    const days = [];
    const d = new Date();
    while (days.length < 5) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      days.push(new Date(d));
    }
    const times = ['09:30', '10:30', '11:30', '14:00', '15:00', '16:30'];
    const state = { day: 0, slot: null };

    const longDay = (dt) => dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    function renderDays() {
      daysEl.innerHTML = '';
      days.forEach((dt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'day';
        b.setAttribute('aria-pressed', String(i === state.day));
        b.innerHTML = '<small>' + dt.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '') + '</small><b>' + dt.getDate() + '</b><small>' + dt.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') + '</small>';
        b.addEventListener('click', () => { state.day = i; state.slot = null; done.hidden = true; renderDays(); renderSlots(); });
        daysEl.appendChild(b);
      });
    }
    function renderSlots() {
      slotsEl.innerHTML = '';
      times.forEach((t, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = t;
        b.disabled = (state.day * 7 + i * 3) % 5 === 0;
        b.setAttribute('aria-pressed', String(state.slot === t));
        b.addEventListener('click', () => { state.slot = t; done.hidden = true; renderSlots(); });
        slotsEl.appendChild(b);
      });
      confirm.disabled = !state.slot;
      confirm.textContent = state.slot ? 'Confirmer — ' + state.slot : 'Choisissez une heure';
    }
    confirm.addEventListener('click', () => {
      if (!state.slot) return;
      done.hidden = false;
      done.innerHTML = '<b>Créneau sélectionné : ' + longDay(days[state.day]) + ' à ' + state.slot + '.</b>Aperçu uniquement : la vraie réservation sera reliée à notre calendrier, avec confirmation par email.';
      if (!reduce && window.gsap) gsap.fromTo(done, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' });
    });
    renderDays();
    renderSlots();
  }

  function initCta() {
    const chars = splitHeadline($('.cta__title'));
    gsap.from(chars, {
      yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.045,
      scrollTrigger: { trigger: '.cta__title', start: 'top 88%' },
    });
    gsap.from('.cta__grid > *', {
      y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.cta__grid', start: 'top 92%' },
    });
  }

  /* ---------- Éléments d'interface ---------- */
  function initFab() {
    const fab = $('.fab');
    const hero = $('.hero');
    const cta = $('.cta');
    if (!fab || !hero || !cta) return;
    const update = () => {
      const past = window.scrollY > hero.offsetHeight * 0.7;
      const ctaVisible = cta.getBoundingClientRect().top < window.innerHeight * 0.55;
      fab.classList.toggle('is-on', past && !ctaVisible);
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
    update();
  }

  function initWhere() {
    const secs = $$('[data-label]');
    const n = $('.where__n');
    const t = $('.where__t');
    if (!n || !t || !secs.length) return;
    const total = String(secs.length).padStart(2, '0');
    let current = -1;
    const update = () => {
      // la dernière section dont le haut a dépassé 55 % de l'écran (robuste aux sauts de scroll)
      const y = window.innerHeight * 0.55;
      let idx = 0;
      for (let i = secs.length - 1; i >= 0; i--) {
        if (secs[i].getBoundingClientRect().top <= y) { idx = i; break; }
      }
      if (idx === current) return;
      current = idx;
      n.textContent = String(idx + 1).padStart(2, '0') + '/' + total;
      t.textContent = secs[idx].dataset.label;
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
    update();
  }

  function initCursor() {
    if (!fine) return;
    const c = $('.cursor');
    if (!c) return;
    const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('mousemove', (e) => {
      c.classList.add('is-live');
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      c.classList.toggle('is-hover', !!e.target.closest('a, button, .card, .brand, .pub'));
    });
    // boutons « aimantés »
    $$('.pill').forEach((el) => {
      const xT = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yT = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xT((e.clientX - (r.left + r.width / 2)) * 0.25);
        yT((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('mouseleave', () => { xT(0); yT(0); });
    });
  }

  /* ---------- Démarrage ---------- */
  function startReduced() {
    html.classList.add('reduce');
    const loader = $('.loader');
    if (loader) loader.remove();
    $$('[data-count]').forEach((el) => { el.textContent = Number(el.dataset.count).toLocaleString('fr-FR'); });
    splitWords($('.manifesto__text')).forEach((w) => { w.style.color = 'var(--bordeaux)'; });
    splitHeadline($('.cta__title'));
    initBooking();
    initLightbox();
    $$('[data-scroll]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const el = id === '#top' ? document.body : $(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView();
      });
    });
  }

  function start() {
    if (reduce) { startReduced(); return; }
    if (!window.gsap || !window.ScrollTrigger) {
      // Bibliothèques indisponibles : on affiche la page sans animation
      html.classList.remove('js');
      html.classList.add('reduce');
      const loader = $('.loader');
      if (loader) loader.remove();
      initBooking();
      initLightbox();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    initLenis();
    if (lenis) lenis.stop();

    // L'ordre suit celui du DOM : ScrollTrigger calcule les espaces des sections épinglées dans cet ordre
    initHero();
    initMarquee();
    initManifesto();
    initStats();
    initCases();
    initLightbox();
    initServices();
    initReel();
    initMethod();
    initBrands();
    initBooking();
    initCta();
    initBlobs();
    initFab();
    initWhere();
    initUI();
    initAnchors();
    initCursor();

    runLoader(heroIntro);

    // Filet de sécurité : si l'intro ne s'est pas terminée (onglet figé, réseau lent), on affiche la page
    setTimeout(() => {
      const l = $('.loader');
      if (l && getComputedStyle(l).display !== 'none') {
        gsap.set('.loader', { display: 'none' });
        gsap.set(['.hero-logo', '.hero__meta > *', '.hero__lead', '.hero__cta > *', '.monitor', '.hero .blob', '.badge', '.hero__foot > *', '.nav > *'], { clearProps: 'transform,opacity,clipPath' });
        if (lenis) lenis.start();
      }
    }, 7000);

    window.addEventListener('load', () => ScrollTrigger.refresh());
  }

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(start);
})();
