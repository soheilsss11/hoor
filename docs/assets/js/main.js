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

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    toTop.classList.toggle("is-visible", y > 700);

    if (reduceMotion) return;

    /* پارالکس اسکرولی صحنهٔ هیرو */
    if (heroStageEl && y < window.innerHeight) heroStageEl.style.translate = `0 ${(y * 0.1).toFixed(1)}px`;
  };
  const heroStageEl = $("#heroStage");
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

  /* ---------- اسلایدر نمایش اپ (showcase) ---------- */
  const scTrack = $("#showcaseTrack");
  if (scTrack) {
    const slides = $$(".showcase__slide", scTrack);
    const dotsWrap = $("#showcaseDots");
    let scIndex = 0, scTimer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `صفحهٔ ${toFa(i + 1)}`);
      dot.addEventListener("click", () => goSc(i, true));
      dotsWrap.appendChild(dot);
    });
    const scDots = $$("button", dotsWrap);

    const goSc = (i, user = false) => {
      scIndex = (i + slides.length) % slides.length;
      const gap = parseFloat(getComputedStyle(scTrack).columnGap || getComputedStyle(scTrack).gap) || 0;
      const slideW = slides[0].getBoundingClientRect().width + gap;
      const containerW = scTrack.parentElement.getBoundingClientRect().width;
      const x = (scIndex * slideW) - (containerW - slideW) / 2;
      scTrack.style.transform = `translateX(${-x}px)`;
      slides.forEach((s, j) => s.classList.toggle("is-current", j === scIndex));
      scDots.forEach((d, j) => d.classList.toggle("is-active", j === scIndex));
      if (user) restartSc();
    };
    const restartSc = () => {
      clearInterval(scTimer);
      if (reduceMotion) return;
      scTimer = setInterval(() => goSc(scIndex + 1), 5200);
    };
    $("#scNext").addEventListener("click", () => goSc(scIndex - 1, true));
    $("#scPrev").addEventListener("click", () => goSc(scIndex + 1, true));
    slides.forEach((s, i) => s.addEventListener("click", () => goSc(i, true)));
    scTrack.parentElement.addEventListener("mouseenter", () => clearInterval(scTimer));
    scTrack.parentElement.addEventListener("mouseleave", restartSc);

    let scResize;
    window.addEventListener("resize", () => {
      clearTimeout(scResize);
      scResize = setTimeout(() => goSc(scIndex), 150);
    });
    goSc(0); restartSc();
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
      tTimer = setInterval(() => goT(tIndex + 1), 4500);
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
})();
