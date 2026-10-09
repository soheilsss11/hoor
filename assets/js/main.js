/* =========================================================
   هور — اسکریپت‌های اصلی لندینگ
   ========================================================= */
(() => {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const toFa = (val) => String(val).replace(/[0-9]/g, (d) => FA_DIGITS[+d]).replace(/\./g, "٫");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;


  /* ---------- اسکرول کرمی (Lenis — حال‌وهوای awwwards) ---------- */
  let lenis = null;
  if (!reduceMotion && "Lenis" in window) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  const smoothTo = (target, opts = {}) => {
    if (lenis) { lenis.scrollTo(target, { duration: 1.2, ...opts }); return; }
    const headerFix = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
    if (typeof target === "number") window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerFix - 10, behavior: reduceMotion ? "auto" : "smooth" });
  };
  /* لنگرهای داخلی */
  $$('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (href.length < 2) return;
    a.addEventListener("click", (e) => {
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      smoothTo(target);
    });
  });

  /* ---------- سال جاری فوتر (شمسی) ---------- */
  try {
    const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
    $("#year").textContent = year.replace(/[^\d۰-۹]/g, "");
  } catch (_) { /* نسخه قدیمی مرورگر: مقدار پیش‌فرض می‌ماند */ }

  /* ---------- هدر چسبان + نوار پیشرفت ---------- */
  const header = $("#header");
  const scrollBar = $("#scrollBar");
  const toTop = $("#toTop");

  const heroStageEl = $("#heroStage");
  let scrollTick = false;
  const onScroll = () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollBar) scrollBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      toTop.classList.toggle("is-visible", y > 700);

      if (reduceMotion) return;

      /* پارالکس اسکرولی صحنهٔ هیرو */
      if (heroStageEl && y < window.innerHeight) heroStageEl.style.translate = `0 ${(y * 0.1).toFixed(1)}px`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => smoothTo(0));

  /* ---------- منوی موبایل ---------- */
  const burger = $("#burger");
  const mmenu = $("#mobileMenu");

  const setMenu = (open) => {
    const willOpen = open ?? !mmenu.classList.contains("is-open");
    mmenu.classList.toggle("is-open", willOpen);
    burger.classList.toggle("is-open", willOpen);
    burger.setAttribute("aria-expanded", String(willOpen));
    mmenu.setAttribute("aria-hidden", String(!willOpen));
    document.body.style.overflow = willOpen ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu());
  $$("[data-close-menu]").forEach((el) => el.addEventListener("click", () => setMenu(false)));
  $$(".mmenu__link, .mmenu__cta").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 992) setMenu(false); });

  /* ---------- اسکرول‌اسپای ---------- */
  const navLinks = $$(".nav__link");
  const sections = navLinks
    .map((a) => $(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
        );
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- ریویل هنگام اسکرول ---------- */
  const revealEls = $$("[data-reveal]");
  revealEls.forEach((el) => el.style.setProperty("--d", el.dataset.delay || 0));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in-view"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- پارالکس هیرو ---------- */
  const stage = $("#heroStage");
  if (stage && finePointer && !reduceMotion) {
    const layers = $$("[data-depth]", stage).map((el) => ({ el, depth: +el.dataset.depth }));
    let rx = 0, ry = 0, cx = 0, cy = 0, raf = null;
    const animate = () => {
      cx += (rx - cx) * 0.08; cy += (ry - cy) * 0.08;
      layers.forEach(({ el, depth }) => {
        el.style.translate = `${(-cx * depth) / 14}px ${(-cy * depth) / 14}px`;
      });
      if (Math.abs(rx - cx) > 0.001 || Math.abs(ry - cy) > 0.001) raf = requestAnimationFrame(animate);
      else raf = null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(animate); };
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      rx = (e.clientX - r.left) / r.width - 0.5;
      ry = (e.clientY - r.top) / r.height - 0.5;
      kick();
    });
    stage.addEventListener("pointerleave", () => { rx = ry = 0; kick(); });
  }

  /* ---------- هایلایت دنبال‌کنندهٔ نشانگر روی کارت‌های امکانات ---------- */
  if (finePointer) {
    $$(".fcard").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--mx", "130%");
        card.style.setProperty("--my", "-30%");
      });
    });
  }

  /* ---------- اسلایدر نمایش اپ (showcase) — اسکرولِ بومی + scroll-snap ---------- */
  const scTrack = $("#showcaseTrack");
  if (scTrack) {
    const strip = $("#showcaseStrip");
    const slides = $$(".showcase__slide", strip);
    const dotsWrap = $("#showcaseDots");
    let scIndex = slides.length - 1, scTimer = null, scSuppressClick = false;   /* شروع از سمتِ راست: چک‌لیست */

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      const target = slides.length - 1 - i;       /* ترتیب دات‌ها برعکس */
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `صفحهٔ ${toFa(i + 1)}`);
      dot.addEventListener("click", () => goSc(target, true));
      dotsWrap.appendChild(dot);
    });
    const scDots = $$("button", dotsWrap);

    const paintSc = () => {
      slides.forEach((s, j) => s.classList.toggle("is-current", j === scIndex));
      scDots.forEach((d, j) => d.classList.toggle("is-active", j === slides.length - 1 - scIndex));
    };

    /* --- هستهٔ ترنسفورمی: هیچ scrollLeft؛ صفحهٔ صاحب اسکرولی بیرون نمی‌شناسد --- */
    const maxOff = () => {                                /* اندازهٔ مستقیم — با overflow:clip درست کار می‌کند */
      const last = slides[slides.length - 1];
      const padR = parseFloat(getComputedStyle(strip).paddingInlineEnd) || 0;
      return Math.max(0, last.offsetLeft + last.offsetWidth + padR - scTrack.clientWidth);
    };
    const clampOff = (v) => Math.max(0, Math.min(maxOff(), v));
    let curOff = 0, rafTween = null, rafMom = null;
    const stopAnims = () => { cancelAnimationFrame(rafTween); cancelAnimationFrame(rafMom); };
    const paintX = (v) => { curOff = v; strip.style.transform = `translateX(${-v.toFixed(1)}px)`;};

    const slideOff = (i) => {
      const s = slides[Math.max(0, Math.min(slides.length - 1, i))];
      return clampOff(s.offsetLeft - (scTrack.clientWidth - s.offsetWidth) / 2);
    };
    const nearestIdx = () => {
      let best = 0, bd = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs((s.offsetLeft - (scTrack.clientWidth - s.offsetWidth) / 2) - curOff);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    };
    const scTweenTo = (left, instant) => {
      cancelAnimationFrame(rafTween);
      if (instant) { paintX(clampOff(left)); return; }
      const target = clampOff(left);
      const step = () => {
        const diff = target - curOff;
        if (Math.abs(diff) < .6) { paintX(target); return; }
        paintX(curOff + diff * .16);
        rafTween = requestAnimationFrame(step);
      };
      rafTween = requestAnimationFrame(step);
    };

    const goSc = (i, user = false, instant = false) => {
      scIndex = Math.max(0, Math.min(slides.length - 1, i));    /* کلون‌ها مجازند؛ settle به جفت برمی‌گرداند */
      scTweenTo(slideOff(scIndex), instant);
      paintSc();
      if (user) restartSc();
    };
    const restartSc = () => {
      clearInterval(scTimer);
      if (reduceMotion) return;
      scTimer = setInterval(() => {                         /* چرخهٔ پیوسته مثل کلیک‌کردن — بدون کلون */
        goSc((scIndex - 1 + slides.length) % slides.length);
      }, 5200);
    };
    const scPads = () => {
      const pad = Math.max(14, (scTrack.clientWidth - slides[0].offsetWidth) / 2);
      strip.style.paddingLeft = pad + "px";
      strip.style.paddingRight = pad + "px";
    };

    $("#scNext").addEventListener("click", () => goSc((scIndex - 1 + slides.length) % slides.length, true));
    $("#scPrev").addEventListener("click", () => goSc((scIndex + 1) % slides.length, true));
    slides.forEach((s, i) => s.addEventListener("click", () => { if (!scSuppressClick) goSc(i, true); }));

    /* ===== درگِ تاچ: کلاچِ یکی‌یکی + مُومنتوم + کشسانِ لبه — دسکتاپ: هیچ درگی ===== */
    let dragX = null, dragY0 = null, dragMode = null, dragL = 0, velX = 0, lastX = 0, lastT = 0,
        movedPx = 0, bndMin = 0, bndMax = 0;
    const setBand = (cIdx) => {                              /* محدودهٔ مجاز: فقط ±۱ اسلاید */
      const a = slideOff(cIdx - 1), b = slideOff(cIdx + 1);
      bndMin = Math.min(a, b); bndMax = Math.max(a, b);
    };

    scTrack.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;                 /* ساده در دسکتاپ */
      dragX = e.clientX; dragY0 = e.clientY; dragMode = null;
      dragL = clampOff(curOff); movedPx = 0;
      lastX = e.clientX; lastT = performance.now(); velX = 0;
      stopAnims();
      /* capture فقط بعد از قفلِ افقی — نه اینجا، وگرنه کروم ژستِ بومی را لغو می‌کند */
    });
    scTrack.addEventListener("pointermove", (e) => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      const dy = e.clientY - dragY0;
      if (dragMode === null) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { dragMode = "pass"; dragX = null; return; }  /* عمودی = اسکرولِ بومی صفحه، دست نمی‌زنیم */
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          dragMode = "drag";
          try { scTrack.setPointerCapture(e.pointerId); } catch (_) {}
          strip.classList.add("is-dragging");
          setBand(nearestIdx());
          clearInterval(scTimer);
          dragX = e.clientX; lastX = e.clientX; lastT = performance.now(); velX = 0;
          return;
        }
        return;
      }
      if (dragMode !== "drag") return;
      movedPx = Math.max(movedPx, Math.abs(dx));
      const now = performance.now();
      velX = (e.clientX - lastX) / Math.max(1, now - lastT) * 16.7;
      lastX = e.clientX; lastT = now;
      const want = dragL - dx;
      const over = want < bndMin ? want - bndMin : want > bndMax ? want - bndMax : 0;
      const inside = Math.max(bndMin, Math.min(bndMax, want));
      paintX(inside + Math.max(-48, Math.min(48, over * .35)));   /* کشسانِ لبه */
    });
    const endDrag = () => {
      if (dragX === null) return;
      const wasDrag = dragMode === "drag";
      dragX = null; dragY0 = null; dragMode = null;
      strip.classList.remove("is-dragging");
      if (!wasDrag) return;
      if (movedPx > 8) { scSuppressClick = true; setTimeout(() => { scSuppressClick = false; }, 350); }
      const mom = () => {
        velX *= .92;
        const next = Math.max(bndMin, Math.min(bndMax, curOff - velX));
        paintX(next);
        if (Math.abs(velX) < .45 || next === bndMin || next === bndMax) { goSc(nearestIdx()); restartSc(); return; }
        rafMom = requestAnimationFrame(mom);
      };
      rafMom = requestAnimationFrame(mom);
    };
    scTrack.addEventListener("pointerup", endDrag);
    scTrack.addEventListener("pointercancel", endDrag);
    scTrack.addEventListener("dragstart", (e) => e.preventDefault());

    let scResize;
    window.addEventListener("resize", () => {
      clearTimeout(scResize);
      scResize = setTimeout(() => { scPads(); goSc(scIndex, false, true); }, 150);
    });
    scPads();
    goSc(slides.length - 1, false, true); restartSc();
  }

  /* ---------- اسلایدر نظرات (RTL) ---------- */
  const tTrack = $("#testiTrack");
  if (tTrack) {
    const cards = $$(".tcard", tTrack);
    const dotsWrap = $("#testiDots");
    const perView = () => (window.innerWidth <= 720 ? 1 : window.innerWidth <= 1120 ? 2 : 3);
    const maxIndex = () => Math.max(0, cards.length - perView());
    let tIndex = 0, tTimer = null;

    const goT = (i, user = false) => {
      tIndex = i > maxIndex() ? 0 : i < 0 ? maxIndex() : i;
      const gap = parseFloat(getComputedStyle(tTrack).columnGap || getComputedStyle(tTrack).gap) || 0;
      const step = cards[0].getBoundingClientRect().width + gap;
      tTrack.style.transform = `translateX(${tIndex * step}px)`; /* RTL: حرکت به راست */
      $$("button", dotsWrap).forEach((d, j) => d.classList.toggle("is-active", j === tIndex));
      if (user) restartT();
    };
    const buildDots = () => {
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex(); i++) {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `گروه ${toFa(i + 1)}`);
        dot.addEventListener("click", () => goT(i, true));
        dotsWrap.appendChild(dot);
      }
    };
    const restartT = () => {
      clearInterval(tTimer);
      if (reduceMotion) return;
      if (!document.getElementById("testimonials").classList.contains("u-hidden")) tTimer = setInterval(() => goT(tIndex + 1), 4500);
    };
    $("#testiNext").addEventListener("click", () => goT(tIndex + 1, true));
    $("#testiPrev").addEventListener("click", () => goT(tIndex - 1, true));
    const slider = $("#testiSlider");
    slider.addEventListener("mouseenter", () => clearInterval(tTimer));
    slider.addEventListener("mouseleave", restartT);

    /* سوایپ لمسی */
    let startX = null;
    slider.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) goT(dx < 0 ? tIndex + 1 : tIndex - 1, true); /* RTL: سوایپ چپ = بعدی */
      startX = null;
    }, { passive: true });

    let rT;
    window.addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { buildDots(); goT(Math.min(tIndex, maxIndex())); }, 150);
    });
    buildDots(); goT(0); restartT();
  }

  /* ---------- آکاردئون سوالات (تک‌باز با انیمیشن ارتفاع) ---------- */
  const faqItems = $$(".faq__item");
  const VAR_EASE = "cubic-bezier(.22,.61,.36,1)";
  const animateClose = (item, body) => {
    const anim = body.animate(
      [{ height: body.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 300, easing: "ease-in-out" }
    );
    anim.onfinish = () => { item.open = false; };
  };
  faqItems.forEach((item) => {
    const summary = $("summary", item);
    const body = $(".faq__body", item);
    summary.addEventListener("click", (e) => {
      if (reduceMotion || !body.animate) return; // رفتار پیش‌فرض details
      e.preventDefault();
      if (item.open) {
        animateClose(item, body);
      } else {
        faqItems.forEach((o) => { if (o !== item && o.open) animateClose(o, $(".faq__body", o)); });
        item.open = true;
        const h = body.scrollHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 380, easing: VAR_EASE });
      }
    });
  });

  /* ---------- پخش ویدیو ---------- */
  const video = $("#introVideo");
  const poster = $("#videoPoster");
  const ctaBtn = $("#videoCtaBtn");
  const heroWatch = $("#heroWatchBtn");

  const startVideo = () => {
    poster.classList.add("is-hidden");
    video.setAttribute("controls", "");
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };
  poster.addEventListener("click", startVideo);
  video.addEventListener("ended", () => {
    poster.classList.remove("is-hidden");
    video.removeAttribute("controls");
  });
  [ctaBtn, heroWatch].forEach((btn) => btn && btn.addEventListener("click", () => {
    smoothTo($("#video"), { offset: -40 });
    setTimeout(startVideo, reduceMotion ? 0 : 650);
  }));

  /* ---------- ریویل ماسکی کلمه‌به‌کلمهٔ تیترها ---------- */
  if (!reduceMotion) {
    const splitWords = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = []; let n;
      while ((n = walker.nextNode())) nodes.push(n);
      let i = 0;
      nodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement("span");
          span.className = "wsplit";
          span.innerHTML = `<span class="w" style="--i:${i++}">${part.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`;
          frag.appendChild(span);
        });
        node.parentNode.replaceChild(frag, node);
      });
    };
    $$(".hero__title, .section__title").forEach(splitWords);
  }

  /* ---------- دکمه‌های مغناطیسی ---------- */
  if (finePointer && !reduceMotion) {
    $$(".btn--primary, .btn--lg, .btn--light, .arrbtn").forEach((el) => {
      el.classList.add("magnetic");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 90 + Math.max(r.width, r.height) / 2) {
          el.style.transition = "none";
          el.style.transform = `translate(${(dx * 0.26).toFixed(1)}px, ${(dy * 0.2).toFixed(1)}px)`;
        }
      });
      el.addEventListener("pointerleave", () => { el.style.transition = ""; el.style.transform = ""; });
    });
  }

  /* ---------- توست دکمه‌های فروشگاه ---------- */
  const toast = $("#toast");
  const toastText = $("#toastText");
  let toastTimer = null;
  const showToast = (msg) => {
    toastText.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };
  $$("[data-store]").forEach((a) => a.addEventListener("click", (e) => {
    if (a.getAttribute("href") === "#") {
      e.preventDefault();
      showToast("لینک دانلود فروشگاه به‌زودی فعال می‌شود — هور را دنبال کنید!");
    }
  }));

  /* =========================================================
     سناریوی «چهل‌هفته‌ی روشنایی» — اسکرول-اسکررب، چراغ‌ها، شمارنده
     ========================================================= */
  (() => {
    if (reduceMotion) return; /* پیش‌فرض CSS: همه‌چیز روشن و کامل */

    /* ---- پردهٔ ۵: آسمانِ ۲٬۴۰۰ مادر + شمارنده ---- */
    const testi = $(".testi"), sky = $(".testi__sky"), momsCount = $(".count-moms");
    if (sky) {
      for (let i = 0; i < 44; i++) {
        const s = document.createElement("span"); const sz = 2 + Math.random() * 4.5;
        s.style.cssText = "left:" + (2 + Math.random() * 96).toFixed(1) + "%;top:" + (4 + Math.random() * 78).toFixed(1) + "%;" +
          "width:" + sz.toFixed(1) + "px;height:" + sz.toFixed(1) + "px;" +
          "--sky-d:" + (Math.random() * 1.1).toFixed(2) + "s;--sky-o:" + (.22 + Math.random() * .5).toFixed(2) + ";";
        sky.appendChild(s);
      }
    }
    if (testi) {
      const grp = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const io2 = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        testi.classList.add("is-sky");
        if (momsCount) {
          const T = 1500, t0 = performance.now();
          const step = (t) => {
            const k = Math.min(1, (t - t0) / T), v = Math.round(2400 * (1 - Math.pow(1 - k, 3)));
            momsCount.textContent = k < 1 ? toFa(grp(v)).replace(/,/g, "٬") : "۲٬۴۰۰";
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
        io2.disconnect();
      }), { threshold: .35 });
      io2.observe(testi);
    }

    /* ---- پردهٔ ۳: ریسمان چهل‌هفته ---- */
    const rope = $("#journeyRope");
    if (rope) {
      const ticks = rope.querySelector(".rope__ticks");
      for (let w = 1; w <= 40; w++) { const t = document.createElement("i"); t.style.insetInlineStart = ((w - .5) / 40 * 100).toFixed(2) + "%"; ticks.appendChild(t); }
      const gates = $$(".rope__gate", rope), fracs = [13 / 40, 28 / 40, 1];
      const setP = (p) => {
        rope.style.setProperty("--p", p.toFixed(4));
        gates.forEach((g, i) => g.classList.toggle("on", p >= fracs[i] - .001));
      };
      setP(0);

      const journey = $(".journey");
      const hasST = ("gsap" in window) && ("ScrollTrigger" in window);
      if (hasST) gsap.registerPlugin(ScrollTrigger);
      if (lenis && hasST) lenis.on("scroll", ScrollTrigger.update);

      /* اسکرابِ بومیِ دوطرفه: مسافر رفت‌وبرگشت با اسکرول دارد + لرپِ نرم */
      if (journey) {
        let targetP = 0, curP = 0, rafP = null;
        const tickP = () => {
          curP += (targetP - curP) * .11;
          if (Math.abs(targetP - curP) < .0008) { curP = targetP; rafP = null; setP(curP); return; }
          setP(curP);
          rafP = requestAnimationFrame(tickP);
        };
        const upd = () => {
          const r = journey.getBoundingClientRect(), vh = innerHeight;
          targetP = Math.min(1, Math.max(0, (vh * .75 - r.top) / (r.height + vh * .5)));  /* سفر آرام در کل قدِ بخش */
          if (rafP === null) rafP = requestAnimationFrame(tickP);
        };
        addEventListener("scroll", upd, { passive: true });
        upd();
      }

      /* ---- پردهٔ ۴: اسکرولِ داخلی اسکرین‌شات‌ها ---- */
      const shots = $$(".phone__shot");
      if (hasST) {
        shots.forEach((img) => {
          gsap.set(img, { scale: 1.07 });
          gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none",
            scrollTrigger: { trigger: img.closest("section") || img, scrub: 1, start: "top bottom", end: "bottom top" } });
        });
        $$(".fcard__img").forEach((f) => {
          gsap.fromTo(f, { yPercent: 8 }, { yPercent: -8, ease: "none",
            scrollTrigger: { trigger: f, scrub: 1.2, start: "top bottom", end: "bottom top" } });
        });
      } else if (shots.length) {
        const drift = () => shots.forEach((img) => {
          const host = img.closest("section") || img, r = host.getBoundingClientRect(), vh = innerHeight;
          const k = Math.min(1, Math.max(0, 1 - (r.top / (vh + r.height))));
          img.style.transform = "translateY(" + (-4 + 8 * k).toFixed(2) + "%) scale(1.07)";
        });
        let t2 = false;
        addEventListener("scroll", () => { if (!t2) { t2 = true; requestAnimationFrame(() => { drift(); t2 = false; }); } }, { passive: true });
        drift();
      }

      /* ---- پردهٔ ۷: طاقِ روشنایی ---- */
      const cta = $(".ctaCard");
      if (cta) {
        if (hasST) ScrollTrigger.create({ trigger: cta, start: "top 72%", onEnter: () => cta.classList.add("is-dawn"), onLeaveBack: () => cta.classList.remove("is-dawn") });
        else { const io3 = new IntersectionObserver((es) => es.forEach((e) => cta.classList.toggle("is-dawn", e.isIntersecting)), { threshold: .4 }); io3.observe(cta); }
      }
    }

    /* ---- صحنهٔ رشد v4: ساقه تا ۶۲٪، غنشه از ۳۰٪ روی نوک، گل تا سکشن دانلود کامل می‌شود ---- */
    const gl = $("#growthLayer");
    if (gl) {
      const stem = $(".growth__stem", gl), halo = $(".growth__stemHalo", gl);
      const branches = $$(".growth__branch", gl), bhalo = $$(".growth__branchHalo", gl);
      const leaves = $$(".growth__leaf", gl);
      const bud = $(".growth__bud", gl), glow2 = $(".growth__bloomGlow", gl), pBack = $(".growth__petalsBack", gl), petalsOut = $(".growth__petalsOut", gl), petalsMid = $(".growth__petalsMid", gl), petalsIn = $(".growth__petalsIn", gl), heartC = $(".growth__heartC", gl), spark = $(".growth__spark", gl);
      const clamp01 = (v) => Math.min(1, Math.max(0, v));
      const L = stem.getTotalLength();
      const bLens = branches.map((b) => b.getTotalLength());
      const BWINDOWS = [[.146, .213], [.293, .359], [.405, .462], [.483, .535]];
      const dl = document.getElementById("download");
      [stem, halo].forEach((s) => { s.style.strokeDasharray = L; s.style.strokeDashoffset = L; });
      branches.forEach((b, i) => {
        b.style.strokeDasharray = bLens[i]; b.style.strokeDashoffset = bLens[i];
        if (bhalo[i]) { bhalo[i].style.strokeDasharray = bLens[i]; bhalo[i].style.strokeDashoffset = bLens[i]; }
      });
      gl.classList.add("growth--live");
      /* بعد از آماده‌سازیِ داش‌ها، با apacity اینلاین آشکار می‌کنیم تا فلِش اولِ لود پیش نیاید */
      [stem, halo, ...branches, ...bhalo].forEach((el) => { el.style.opacity = "1"; });

      let gTick = false;
      const gProg = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        let end = max;
        if (dl) end = Math.min(max, Math.max(400, dl.offsetTop + dl.offsetHeight * .55 - innerHeight));
        return end > 0 ? clamp01(scrollY / end) : 1;
      };
      let gFloor = 0, gForced = null;                                /* هولدِ موبایل */
      const gUpd = (pv) => {
        if (typeof pv === "number") gForced = pv;
        let p = gForced !== null ? Math.max(gForced, gProg()) : gProg();
        if (gFloor) p = Math.max(p, gFloor);

        /* ساقه‌ی اصلی تا ۶۲٪ مسیر کامل */
        const stemP = clamp01(p / .62);
        const grow = .028 + stemP * .972;
        const off = (L * (1 - grow)).toFixed(1);
        stem.style.strokeDashoffset = off;
        halo.style.strokeDashoffset = off;

        /* ۴ شاخه در پنجره‌ی خودشان */
        branches.forEach((b, i) => {
          const w = BWINDOWS[i];
          const bp = clamp01((p - w[0]) / (w[1] - w[0]));
          b.style.strokeDashoffset = (bLens[i] * (1 - bp)).toFixed(1);
          if (bhalo[i]) bhalo[i].style.strokeDashoffset = (bLens[i] * (1 - bp)).toFixed(1);
        });

        leaves.forEach((l) => l.classList.toggle("shown", p >= +l.dataset.t));

        /* غنچه از ۳۰٪ سوارِ نوک — بوقووره تا ۴۸٪ — با گشایش گلبرگ محکی کَم‌رنگ */
        if (bud) {
          bud.style.opacity = p < .30 ? "0" : p >= .61 ? String(1 - clamp01((p - .61) / .06)) : "1";
          if (p >= .30) {
            const pt = stem.getPointAtLength(L * (stemP >= 1 ? 1 : grow));
            const s = .35 + clamp01((p - .30) / .18) * .65;
            bud.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ") scale(" + s.toFixed(3) + ")");
          }
        }

        /* گشایش پیوسته تا ~۹۰٪ (خیلی قبل از تهِ صفحه) */
        if (glow2) { const t = clamp01((p - .61) / .12); glow2.style.opacity = (t * .9).toFixed(2); }
        if (pBack) {
          const t = clamp01((p - .595) / .10);
          pBack.style.opacity = t > 0 ? "1" : "0";
          pBack.style.transform = "translate(71px,56px) scale(" + (t * 1.28).toFixed(3) + ")";
        }
        if (petalsOut) {
          const t = clamp01((p - .61) / .12);
          petalsOut.style.opacity = t > 0 ? "1" : "0";
          petalsOut.style.transform = "translate(71px,56px) scale(" + (t * 1.28).toFixed(3) + ") rotate(" + (-30 * (1 - t)).toFixed(1) + "deg)";
        }
        if (petalsMid) {
          const t = clamp01((p - .65) / .11);
          petalsMid.style.opacity = t > 0 ? "1" : "0";
          petalsMid.style.transform = "translate(71px,56px) scale(" + (t * 1.28).toFixed(3) + ") rotate(" + (-36 * (1 - t)).toFixed(1) + "deg)";
        }
        if (petalsIn) {
          const t = clamp01((p - .70) / .11);
          petalsIn.style.opacity = t > 0 ? "1" : "0";
          petalsIn.style.transform = "translate(71px,56px) scale(" + (t * 1.28).toFixed(3) + ") rotate(" + (-42 * (1 - t)).toFixed(1) + "deg)";
        }
        if (heartC) {
          const t = clamp01((p - .84) / .07);
          heartC.style.opacity = t > 0 ? "1" : "0";
          heartC.style.transform = "translate(59px,47.4px) scale(" + (t * 1.15).toFixed(3) + ")";
        }
        if (spark) spark.style.opacity = p >= .88 ? "1" : "0";
      };
      addEventListener("scroll", () => { if (!gTick) { gTick = true; requestAnimationFrame(() => { gUpd(); gTick = false; }); } }, { passive: true });
      addEventListener("resize", gUpd, { passive: true });
      gUpd();

      /* موبایل: جایِ دقیقِ گیاه — از نزدیکِ سان، تا بالای جملهٔ «با ویدیوهای کوتاه…» (اسکرول‌ران مثل وب) */
      const heroTxt = $(".hero__text");
      const plantEl = gl.querySelector(".growth__plant");
      const placeMobilePlant = () => {
        if (!matchMedia("(max-width: 720px)").matches || !heroTxt || !plantEl) return;
        const top = 144;                               /* زیرِ سان — گل هرگز وارد سان نمی‌شود */
        const txtDocTop = heroTxt.getBoundingClientRect().top + scrollY;   /* مختصاتِ سند */
        const h = Math.max(120, Math.min(txtDocTop - top - 12, innerHeight * .6));
        plantEl.style.top = top + "px";
        plantEl.style.height = h.toFixed(0) + "px";
      };
      placeMobilePlant();
      addEventListener("resize", placeMobilePlant, { passive: true });
      addEventListener("load", placeMobilePlant, { once: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeMobilePlant);
      setTimeout(placeMobilePlant, 900);

      /* هولدِ شکوفهٔ موبایل: انرژیِ کشیدنِ اول برود توی انیمیشن (صفحه می‌لنگد)،
         بعد از تکمیل: گل و سان همان بالا می‌مانند و صفحه آزاد اسکرول می‌شود */
      const isMob = matchMedia("(max-width: 720px)").matches;
      if (isMob && !reduceMotion && scrollY < 80) {
        const THRESH = 300;              /* «یکم اسکرول» ≈ ۳۰۰px ورودی */
        const FINAL = .94;
        let scrb = 0, done = false, touchY = null;
        const forcePin = () => { if (!done) window.scrollTo(0, 0); };
        addEventListener("scroll", forcePin, { passive: true });
        if (lenis && lenis.stop) lenis.stop();

        const finishNow = () => {
          if (done) return;
          done = true; scrb = THRESH;
          gFloor = FINAL; gForced = null; gUpd();
          removeEventListener("scroll", forcePin);
          removeEventListener("wheel", gateWheel);
          removeEventListener("touchmove", gateTouch);
          if (lenis && lenis.start) lenis.start();
        };
        const apply = (d) => {
          if (done) return;
          scrb = Math.max(0, Math.min(THRESH, scrb + d));
          gUpd((scrb / THRESH) * FINAL);
          if (scrb >= THRESH) finishNow();
        };
        /* کلیک روی لینک‌های داخلی (مثل دکمهٔ دانلود) گیت را فوراً می‌شکند */
        document.addEventListener("click", (e) => {
          if (done) return;
          const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
          if (a) finishNow();
        }, true);
        function gateWheel(e) { e.preventDefault(); apply(e.deltaY || 0); }
        function gateTouch(e) {
          const y = e.touches[0].clientY;
          if (touchY === null) touchY = y;
          const d = touchY - y; touchY = y;
          if (!done) e.preventDefault();
          apply(d);
        }
        addEventListener("wheel", gateWheel, { passive: false });
        addEventListener("touchmove", gateTouch, { passive: false });
        addEventListener("touchend", () => { touchY = null; }, { passive: true });
      }
    }


  })();
})();
