/* ==========================================================================
   Elektriciteitswerken Boon, site-script
   ========================================================================== */

/* ---------- Configuratie: pas hier aan ---------- */
var SITE_CONFIG = {
  // Formulier-endpoint. Bijvoorbeeld Formspree: "https://formspree.io/f/abcdwxyz"
  // of een eigen PHP-script: "/mail.php". Leeg = formulier nog niet gekoppeld.
  formEndpoint: "",

  // Voorbeeldreviews tonen? Zet op false voor de livegang (zie data/reviews.js).
  showPlaceholderReviews: true
};

(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.body.getAttribute("data-root") || "";

  /* ---------- Hulpfuncties ---------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "text") node.textContent = value;
        else if (key === "className") node.className = value;
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  // Tekst met [TE BEVESTIGEN: ...] krijgt een zichtbare markering
  function richText(text) {
    var frag = document.createDocumentFragment();
    String(text).split(/(\[TE BEVESTIGEN[^\]]*\])/).forEach(function (part) {
      if (!part) return;
      if (/^\[TE BEVESTIGEN/.test(part)) frag.appendChild(el("span", { className: "tbc", text: part }));
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }

  function picture(image, sizes) {
    if (!image || !image.name) return el("div", { className: "fill" });
    var base = root + "img/projecten/" + image.name;
    function set(ext) {
      return image.widths.map(function (w) { return base + "-" + w + "." + ext + " " + w + "w"; }).join(", ");
    }
    var largest = image.widths[image.widths.length - 1];
    return el("picture", { className: "fill" }, [
      el("source", { type: "image/avif", srcset: set("avif"), sizes: sizes }),
      el("source", { type: "image/webp", srcset: set("webp"), sizes: sizes }),
      el("img", {
        src: base + "-" + largest + ".jpg", srcset: set("jpg"), sizes: sizes,
        width: image.w, height: image.h, alt: image.alt || "", loading: "lazy", decoding: "async"
      })
    ]);
  }

  function icon(id) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }

  // Toetsenbord voor tablists: pijltjes, Home, End
  function tablistKeys(list, tabs, activate) {
    list.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); tabs[next].focus(); activate(next); }
    });
  }

  /* ---------- Header ---------- */

  var header = document.querySelector(".site-header");
  if (header) {
    var meter = header.querySelector(".power-meter");
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      if (meter) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        meter.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var heroLogo = document.querySelector(".hero-logo");
    if (heroLogo && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        header.classList.toggle("show-brand", !entries[0].isIntersecting);
      }, { rootMargin: "-80px 0px 0px 0px" }).observe(heroLogo);
    } else {
      header.classList.add("show-brand");
    }
  }

  /* ---------- Mobiel menu ---------- */

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menu sluiten" : "Menu openen");
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    if (open) { var first = menu.querySelector("a, button"); if (first) first.focus(); }
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (!open) return;
      if (e.key === "Escape") { setMenu(false); toggle.focus(); }
      if (e.key === "Tab") {
        var f = [document.querySelector(".header-actions .call"), toggle]
          .concat(Array.prototype.slice.call(menu.querySelectorAll("a, button"))).filter(Boolean);
        var firstEl = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) { if (mq.matches) setMenu(false); });
  }

  /* ---------- Diensten: schakelbord ---------- */

  var board = document.querySelector("[data-switchboard]");
  if (board) {
    var tabs = Array.prototype.slice.call(board.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var desktop = window.matchMedia("(min-width: 1024px)");

    var activeIndex = 0;
    var cable = board.querySelector(".switch-cable");
    var cBase = cable ? cable.querySelector(".cable-base") : null, cFlow = cable ? cable.querySelector(".cable-flow") : null, cPlug = cable ? cable.querySelector(".cable-plug") : null;
    var drawCable = function (animate) {
      if (!cable || !desktop.matches) return;
      var br = board.getBoundingClientRect();
      var list = board.querySelector(".switch-list").getBoundingClientRect();
      var btn = tabs[activeIndex].getBoundingClientRect();
      var media = panels[activeIndex].querySelector(".panel-media").getBoundingClientRect();
      if (!media.width) return;
      // De kabel vertrekt onder de schakelaar, loopt langs de lijn onder de actieve rij en gaat naar de foto
      var rock = tabs[activeIndex].querySelector(".rocker").getBoundingClientRect();
      var rx = rock.left + rock.width / 2 - br.left, ry = rock.bottom - br.top;
      var y1 = btn.bottom - br.top - 0.5;
      var x1 = list.right - br.left + 14;
      var x2 = media.left - br.left - 4;
      var y2 = Math.min(Math.max(y1, media.top - br.top + 28), media.bottom - br.top - 28);
      var xm = (x1 + x2) / 2, dy = y2 - y1, c = Math.min(Math.abs(dy) / 2, 26), sg = dy > 0 ? 1 : -1;
      var d = "M" + rx + "," + ry + " V" + (y1 - 8) + " L" + (rx + 8) + "," + y1 + " H" + x1;
      d += Math.abs(dy) < 1 ? " H" + x2 : " H" + (xm - c) + " L" + xm + "," + (y1 + sg * c) + " V" + (y2 - sg * c) + " L" + (xm + c) + "," + y2 + " H" + x2;
      cBase.setAttribute("d", d); cFlow.setAttribute("d", d);
      cPlug.setAttribute("cx", x2); cPlug.setAttribute("cy", y2);
      if (animate && !reduceMotion.matches) {
        var len = cBase.getTotalLength();
        cFlow.style.opacity = "0"; cPlug.style.opacity = "0";
        cBase.style.transition = "none"; cBase.style.strokeDasharray = len; cBase.style.strokeDashoffset = len;
        void cBase.getBoundingClientRect();
        cBase.style.transition = "stroke-dashoffset 360ms cubic-bezier(0.23, 1, 0.32, 1)"; cBase.style.strokeDashoffset = "0";
        clearTimeout(drawCable.t);
        drawCable.t = setTimeout(function () { cFlow.style.opacity = "1"; cPlug.style.opacity = "1"; cBase.style.strokeDasharray = "none"; }, 360);
      }
    };
    var activate = function (index) {
      var changed = index !== activeIndex;
      activeIndex = index;
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle("is-active", on);
      });
      if (changed && !reduceMotion.matches) {
        var pnl = panels[index];
        pnl.classList.remove("is-powering"); void pnl.offsetWidth; pnl.classList.add("is-powering");
        setTimeout(function () { pnl.classList.remove("is-powering"); }, 620);
      }
      drawCable(changed);
    };
    var cableRaf = 0;
    var queueCable = function () { cancelAnimationFrame(cableRaf); cableRaf = requestAnimationFrame(function () { drawCable(false); }); };
    window.addEventListener("scroll", queueCable, { passive: true });
    window.addEventListener("resize", queueCable);
    window.addEventListener("load", queueCable);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueCable);
    queueCable();
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(i); });
      // Op een muis volgt het paneel de cursor: de lijst werkt als schakelaars
      t.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") activate(i); });
    });
    tablistKeys(board.querySelector('[role="tablist"]'), tabs, activate);

    // Op mobiel zijn de panelen een swipebare rij en geen tabpanelen
    var scroller = board.querySelector(".switch-panels");
    var syncRoles = function () {
      panels.forEach(function (p) {
        if (desktop.matches) { p.setAttribute("role", "tabpanel"); p.removeAttribute("aria-label"); }
        else { p.removeAttribute("role"); }
      });
      // Op mobiel is de rij scrollbaar: bereikbaar met het toetsenbord
      if (scroller) {
        if (desktop.matches) { scroller.removeAttribute("tabindex"); scroller.removeAttribute("role"); scroller.removeAttribute("aria-label"); }
        else { scroller.tabIndex = 0; scroller.setAttribute("role", "region"); scroller.setAttribute("aria-label", "Diensten, scroll opzij voor meer"); }
      }
    };
    syncRoles();
    desktop.addEventListener("change", syncRoles);
  }

  /* ---------- Projecten met filter ---------- */

  var projectList = document.getElementById("project-list");
  var filterBar = document.getElementById("project-filter");
  var statusEl = document.getElementById("project-status");

  if (projectList && window.BOON_PROJECTS) {
    var categories = window.BOON_CATEGORIES || [];
    var labelFor = {};
    categories.forEach(function (c) { labelFor[c.id] = c.label; });
    var projects = window.BOON_PROJECTS.slice().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });

    projectList.textContent = "";
    projects.forEach(function (p) {
      var featured = !!p.featured;
      var sizes = featured ? "(min-width: 1100px) 58vw, 100vw" : "(min-width: 1100px) 40vw, (min-width: 768px) 50vw, 100vw";
      var tags = [p.location].concat((p.categories || []).map(function (c) { return labelFor[c] || c; })).filter(Boolean);
      var titleNode = p.caseUrl ? el("a", { href: root + p.caseUrl }, [p.title]) : document.createTextNode(p.title);

      var more = null;
      if (p.caseUrl) { more = el("span", { className: "project-more", "aria-hidden": "true" }, ["Lees de case"]); more.appendChild(icon("i-arrow")); }

      projectList.appendChild(el("li", {
        className: "project" + (featured ? " is-featured" : "") + (p.caseUrl ? " has-link" : ""),
        "data-categories": (p.categories || []).join(" ")
      }, [
        el("div", { className: "project-media" }, [picture(p.image, sizes)]),
        el("div", { className: "project-body" }, [
          el("ul", { className: "project-tags", "aria-label": "Locatie en categorie" }, tags.map(function (t) { return el("li", null, [richText(t)]); })),
          el("h3", null, [titleNode]),
          el("p", { className: "project-summary" }, [richText(p.summary)]),
          more
        ])
      ]));
    });

    var items = Array.prototype.slice.call(projectList.querySelectorAll(".project"));
    var empty = document.getElementById("project-empty");
    var countFor = function (cat) {
      return cat === "alle" ? items.length : items.filter(function (it) { return it.getAttribute("data-categories").split(" ").indexOf(cat) > -1; }).length;
    };

    var applyFilter = function (cat, announce) {
      var shown = [];
      items.forEach(function (it) {
        var match = cat === "alle" || it.getAttribute("data-categories").split(" ").indexOf(cat) > -1;
        it.hidden = !match;
        if (match) shown.push(it);
      });
      projectList.classList.toggle("is-filtered", cat !== "alle");
      if (empty) empty.hidden = shown.length > 0;
      if (window.gsap && !reduceMotion.matches && announce) {
        window.gsap.fromTo(shown, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out", clearProps: "transform,opacity" });
      }
      if (statusEl && announce) {
        var label = cat === "alle" ? "alle categorieën" : (labelFor[cat] || cat);
        statusEl.textContent = shown.length + (shown.length === 1 ? " project" : " projecten") + " in " + label + ".";
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };

    if (filterBar) {
      filterBar.textContent = "";
      [{ id: "alle", label: "Alle" }].concat(categories).forEach(function (opt) {
        var btn = el("button", { type: "button", "aria-pressed": opt.id === "alle" ? "true" : "false", "data-filter": opt.id }, [
          el("span", { className: "toggle", "aria-hidden": "true" }),
          opt.label,
          el("span", { className: "count", "aria-hidden": "true", text: String(countFor(opt.id)) })
        ]);
        btn.addEventListener("click", function () {
          filterBar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          btn.setAttribute("aria-pressed", "true");
          applyFilter(opt.id, true);
        });
        filterBar.appendChild(btn);
      });
    }
    applyFilter("alle", false);

    // Licht aan per project: bij hover op desktop, in het midden van het scherm op touch
    var flicker = function (it) {
      if (reduceMotion.matches) return;
      it.classList.remove("is-flickering"); void it.offsetWidth; it.classList.add("is-flickering");
      setTimeout(function () { it.classList.remove("is-flickering"); }, 560);
    };
    var light = function (it, on) {
      if (on && !it.classList.contains("is-lit")) { it.classList.add("is-lit"); flicker(it); }
      if (!on) it.classList.remove("is-lit");
    };
    if (reduceMotion.matches) {
      items.forEach(function (it) { it.classList.add("is-lit"); });
    } else if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      items.forEach(function (it) {
        it.addEventListener("mouseenter", function () { light(it, true); });
        it.addEventListener("mouseleave", function () { light(it, false); });
        it.addEventListener("focusin", function () { light(it, true); });
        it.addEventListener("focusout", function () { light(it, false); });
      });
    } else if ("IntersectionObserver" in window) {
      var lio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { light(e.target, e.isIntersecting); });
      }, { rootMargin: "-30% 0px -30% 0px" });
      items.forEach(function (it) { lio.observe(it); });
    } else {
      items.forEach(function (it) { it.classList.add("is-lit"); });
    }
  }

  /* ---------- Reviews: één grote quote, wisselen via tabs ---------- */

  var reviewSection = document.getElementById("reviews");
  var reviewList = document.getElementById("review-list");
  var quoteTabs = document.getElementById("quote-tabs");
  if (reviewSection && reviewList && window.BOON_REVIEWS) {
    var reviews = window.BOON_REVIEWS.filter(function (r) { return !r.placeholder || SITE_CONFIG.showPlaceholderReviews; });
    if (!reviews.length) {
      reviewSection.hidden = true;
    } else {
      reviewList.textContent = "";
      if (quoteTabs) quoteTabs.textContent = "";
      var qTabs = [], qPanels = [];
      reviews.forEach(function (r, i) {
        var id = "review-" + i;
        var multi = reviews.length > 1;
        var panel = el("div", { className: "quote-panel", id: id, role: multi ? "tabpanel" : null, "aria-labelledby": multi ? id + "-tab" : null, hidden: i > 0 }, [
          el("figure", null, [
            el("blockquote", null, [el("p", null, [richText("“" + r.quote + "”")])]),
            el("figcaption", null, [
              el("strong", { text: r.company }),
              el("span", null, [richText(r.role + (r.project ? ", " + r.project : ""))]),
              r.placeholder ? el("span", { className: "review-flag", text: "Voorbeeldtekst, wacht op goedkeuring klant" }) : null
            ])
          ])
        ]);
        reviewList.appendChild(panel);
        qPanels.push(panel);
        if (quoteTabs && reviews.length > 1) {
          var tab = el("button", { type: "button", role: "tab", id: id + "-tab", "aria-controls": id, "aria-selected": i === 0 ? "true" : "false", tabindex: i === 0 ? "0" : "-1" }, [
            el("span", { className: "dot", "aria-hidden": "true" }),
            el("span", { className: "ch", "aria-hidden": "true", text: "CH" + (i + 1) }),
            r.company
          ]);
          quoteTabs.appendChild(tab);
          qTabs.push(tab);
        }
      });
      var showQuote = function (index) {
        qTabs.forEach(function (t, i) { t.setAttribute("aria-selected", String(i === index)); t.tabIndex = i === index ? 0 : -1; });
        qPanels.forEach(function (p, i) { p.hidden = i !== index; });
        document.dispatchEvent(new CustomEvent("boon:channel", { detail: index }));
      };
      qTabs.forEach(function (t, i) { t.addEventListener("click", function () { showQuote(i); }); });
      if (qTabs.length) tablistKeys(quoteTabs, qTabs, showQuote);
    }
  }


  /* ---------- Reviews: oscilloscoop ---------- */
  // Een meetscherm: een rode bundel tekent het signaal, met nagloei.
  // Wisselen van review = ander kanaal, het signaal stemt zich opnieuw af.

  var scope = document.querySelector("[data-scope]");
  if (scope) {
    var canvas = scope.querySelector(".scope-canvas");
    var ctx = canvas.getContext("2d");
    var readout = scope.querySelector("[data-scope-ch]");
    var channels = [
      { amp: 0.15, freq: 2.2, harm: 0.38 },
      { amp: 0.11, freq: 3.6, harm: 0.16 },
      { amp: 0.17, freq: 1.6, harm: 0.55 }
    ];
    var cur = { amp: channels[0].amp, freq: channels[0].freq, harm: channels[0].harm };
    var target = channels[0];
    var W = 0, H = 0, dpr = 1, px = -1e5, running = false, raf = 0;

    var resize = function () {
      var r = scope.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(performance.now());
    };
    var yAt = function (x, t, phaseShift) {
      var u = x / W, ph = t * 0.0011 + (phaseShift || 0);
      var v = Math.sin(u * cur.freq * Math.PI * 2 - ph * 2) + cur.harm * Math.sin(u * cur.freq * 3 * Math.PI * 2 - ph * 3.3);
      var boost = 1 + 0.9 * Math.exp(-((x - px) * (x - px)) / (2 * 90 * 90));
      return H * 0.36 - v * cur.amp * H * boost;
    };
    var trace = function (t, from, to, phaseShift) {
      ctx.beginPath();
      for (var x = from; x <= to; x += 3) {
        var y = yAt(x, t, phaseShift);
        if (x === from) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    var draw = function (t) {
      if (!W) return;
      cur.amp += (target.amp - cur.amp) * 0.06;
      cur.freq += (target.freq - cur.freq) * 0.06;
      cur.harm += (target.harm - cur.harm) * 0.06;
      ctx.clearRect(0, 0, W, H);
      // tweede kanaal, flauw
      ctx.lineWidth = 1.2; ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(243, 241, 237, 0.08)";
      trace(t, 0, W, 1.7); ctx.stroke();
      // nagloei van de hele bundel
      ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(255, 97, 89, 0.28)";
      trace(t, 0, W, 0); ctx.stroke();
      // de heldere bundel die over het scherm loopt
      var span = W * 1.3, head = reduceMotion.matches ? W : ((t * 0.00032) % 1) * span, tail = W * 0.45;
      var g = ctx.createLinearGradient(head - tail, 0, head, 0);
      g.addColorStop(0, "rgba(255, 97, 89, 0)"); g.addColorStop(1, "rgba(255, 140, 120, 1)");
      ctx.lineWidth = 2.6; ctx.strokeStyle = g; ctx.shadowColor = "rgba(255, 70, 60, 0.9)"; ctx.shadowBlur = 16;
      trace(t, Math.max(0, head - tail), Math.min(W, head), 0); ctx.stroke();
      if (head > 0 && head < W) {
        ctx.beginPath(); ctx.fillStyle = "#fff4ec"; ctx.shadowBlur = 22;
        ctx.arc(head, yAt(head, t, 0), 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    };
    var loop = function (t) { draw(t); raf = requestAnimationFrame(loop); };
    var start = function () { if (!running && !reduceMotion.matches) { running = true; raf = requestAnimationFrame(loop); } };
    var stop = function () { running = false; cancelAnimationFrame(raf); };

    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(scope); else window.addEventListener("resize", resize);
    resize();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) start(); else stop(); }).observe(scope);
    } else start();
    scope.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") px = e.clientX - scope.getBoundingClientRect().left; });
    scope.addEventListener("pointerleave", function () { px = -1e5; });
    document.addEventListener("boon:channel", function (e) {
      target = channels[e.detail % channels.length];
      if (readout) readout.textContent = "CH" + (e.detail + 1);
      if (!running) { cur.amp = target.amp; cur.freq = target.freq; cur.harm = target.harm; draw(performance.now()); }
    });
  }

  /* ---------- Verdeelbord: hendel omhoog bij aantikken ---------- */
  document.querySelectorAll(".breaker").forEach(function (b) {
    b.addEventListener("pointerdown", function () { b.classList.add("is-flipped"); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
      b.addEventListener(ev, function () { setTimeout(function () { b.classList.remove("is-flipped"); }, 350); });
    });
  });


  /* ---------- ISS-cijfers als 7-segment LED-displays ---------- */
  var SEGMAP = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", "A": "abcefg" };
  var buildSeg = function (str) {
    var ns = "http://www.w3.org/2000/svg", W = 56, Hh = 100, t = 11, g = 2, adv = 68;
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "seg"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    svg.setAttribute("viewBox", "-6 -2 " + (str.length * adv - (adv - W) + 14) + " " + (Hh + 4));
    var hseg = function (yc) { var x0 = t / 2 + g, x1 = W - t / 2 - g; return [[x0, yc], [x0 + t / 2, yc - t / 2], [x1 - t / 2, yc - t / 2], [x1, yc], [x1 - t / 2, yc + t / 2], [x0 + t / 2, yc + t / 2]]; };
    var vseg = function (xc, y0, y1) { return [[xc, y0], [xc + t / 2, y0 + t / 2], [xc + t / 2, y1 - t / 2], [xc, y1], [xc - t / 2, y1 - t / 2], [xc - t / 2, y0 + t / 2]]; };
    var mid = Hh / 2, L = t / 2, R = W - t / 2;
    var geo = { a: hseg(t / 2), g: hseg(mid), d: hseg(Hh - t / 2), f: vseg(L, t / 2 + g, mid - g), b: vseg(R, t / 2 + g, mid - g), e: vseg(L, mid + g, Hh - t / 2 - g), c: vseg(R, mid + g, Hh - t / 2 - g) };
    str.split("").forEach(function (ch, i) {
      var grp = document.createElementNS(ns, "g");
      grp.setAttribute("transform", "translate(" + (i * adv + 7) + " 0) skewX(-7)");
      "abcdefg".split("").forEach(function (k) {
        var poly = document.createElementNS(ns, "polygon");
        poly.setAttribute("points", geo[k].map(function (pt) { return pt[0] + "," + pt[1]; }).join(" "));
        poly.setAttribute("class", "s");
        if ((SEGMAP[ch] || "").indexOf(k) > -1) poly.setAttribute("data-on", "");
        grp.appendChild(poly);
      });
      svg.appendChild(grp);
    });
    return svg;
  };
  var segDisplays = [];
  document.querySelectorAll(".stat-value").forEach(function (sv) {
    var small = sv.querySelector("small");
    var first = sv.firstChild;
    var num = first && first.nodeType === 3 ? first.nodeValue.trim() : sv.textContent.trim();
    if (!/^[0-9A]+$/.test(num)) return;
    var svg = buildSeg(num);
    sv.textContent = "";
    sv.appendChild(el("span", { className: "visually-hidden", text: num + (small ? " " + small.textContent : "") }));
    sv.appendChild(svg);
    if (small) { small.setAttribute("aria-hidden", "true"); sv.appendChild(small); }
    sv.classList.add("has-seg");
    segDisplays.push(sv);
  });
  var segFinal = function (sv) { sv.querySelectorAll(".s").forEach(function (p) { p.classList.toggle("on", p.hasAttribute("data-on")); }); };
  var segPowerOn = function (sv) {
    // lamptest: alle segmenten even aan, daarna springen de juiste segmenten aan
    var all = Array.prototype.slice.call(sv.querySelectorAll(".s"));
    all.forEach(function (p) { p.classList.add("on"); });
    setTimeout(function () {
      all.forEach(function (p) { p.classList.remove("on"); });
      var targets = all.filter(function (p) { return p.hasAttribute("data-on"); }).sort(function () { return Math.random() - 0.5; });
      targets.forEach(function (p, i) { setTimeout(function () { p.classList.add("on"); }, 120 + i * 22); });
    }, 260);
  };
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    segDisplays.forEach(segFinal);
  } else {
    // Aan zodra een display (bijna) in beeld komt of al voorbij is: ook bij snel swipen
    var pending = segDisplays.slice();
    var checkSeg = function () {
      pending = pending.filter(function (sv) {
        if (sv.getBoundingClientRect().top < window.innerHeight * 0.88) { segPowerOn(sv); return false; }
        return true;
      });
      if (!pending.length) window.removeEventListener("scroll", onSegScroll);
    };
    var segTick = false;
    var onSegScroll = function () { if (!segTick) { segTick = true; requestAnimationFrame(function () { segTick = false; checkSeg(); }); } };
    window.addEventListener("scroll", onSegScroll, { passive: true });
    checkSeg();
  }

  /* ---------- Beweging (GSAP) ---------- */
  // Elke animatie heeft een reden: de lichten gaan aan (hero), de stroom loopt
  // door de fasen (aanpak), inhoud komt in volgorde binnen (reveal).

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var processWrap = document.querySelector("[data-process]");
  var steps = processWrap ? Array.prototype.slice.call(processWrap.querySelectorAll(".step")) : [];

  if (!gsap || !ScrollTrigger || reduceMotion.matches) {
    // Zonder beweging: alles aan, de lijn volledig
    steps.forEach(function (s) { s.classList.add("is-on"); });
    document.querySelectorAll("[data-era]").forEach(function (e) { e.classList.add("is-lit"); });
  } else {
    gsap.registerPlugin(ScrollTrigger);
    var ease = "power3.out";

    // ScrollTrigger springt bij het meten even naar boven; met scroll-behavior: smooth
    // gebeurt dat niet meteen en kloppen alle posities niet meer (zwart gat bij de tijdlijn).
    // Daarom staat smooth scroll uit en scrollen ankerlinks hier zelf zacht.
    document.documentElement.style.scrollBehavior = "auto";
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link || e.defaultPrevented) return;
      var id = link.getAttribute("href").slice(1);
      var target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", "#" + id);
    });

    // 1. Hero: foto komt van donker naar licht, tekst volgt
    var heroMedia = document.querySelector("[data-hero-media]");
    var heroBits = document.querySelectorAll("[data-hero-in]");
    if (heroMedia) {
      // Een zwarte laag boven de foto dooft uit: de lichten gaan aan.
      // De foto zelf wordt niet geanimeerd, zodat hij meteen als geladen telt.
      // De lichten in de foto springen aan, van achter in de zaal naar voor.
      // Foto en lichtpunten staan in data-lights op de hero (zie index.html):
      // { "size": [breedte, hoogte], "vp": [x, y], "spots": [[x, y, breedte, hoogte], ...] }
      // in pixels van de originele foto. Zonder data-lights dooft enkel de zwarte laag uit.
      var heroImg = heroMedia.querySelector("img");
      var lights = {};
      try { lights = JSON.parse(heroMedia.getAttribute("data-lights") || "{}"); } catch (err) { lights = {}; }
      var IW = (lights.size || [])[0] || heroImg.getAttribute("width") || 1000;
      var IH = (lights.size || [])[1] || heroImg.getAttribute("height") || 750;
      var VP = lights.vp || [IW / 2, IH / 2];
      var PANELS = lights.spots || [];
      var mapPt = function (nx, ny) {
        var r = heroMedia.getBoundingClientRect();
        var sc = Math.max(r.width / IW, r.height / IH);
        var pos = (getComputedStyle(heroImg).objectPosition || "50% 50%").split(" ");
        var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || pos[0]) / 100;
        return { x: (r.width - IW * sc) * px + nx * sc, y: (r.height - IH * sc) * py + ny * sc, s: sc, w: r.width, h: r.height };
      };
      var vp = mapPt(VP[0], VP[1]);
      var dim = el("span", { className: "hero-dim", "aria-hidden": "true" });
      var mask = "radial-gradient(circle at " + vp.x + "px " + vp.y + "px, transparent var(--r), #000 calc(var(--r) + 260px))";
      dim.style.webkitMaskImage = mask; dim.style.maskImage = mask; dim.style.setProperty("--r", "0px");
      var glowWrap = el("span", { className: "hero-glows", "aria-hidden": "true" });
      var glows = PANELS.slice().sort(function (a, b) {
        return Math.hypot(a[0] - VP[0], a[1] - VP[1]) - Math.hypot(b[0] - VP[0], b[1] - VP[1]);
      }).map(function (pnl) {
        var m = mapPt(pnl[0], pnl[1]);
        var g = el("span", { className: "hero-glow" });
        g.style.left = m.x + "px"; g.style.top = m.y + "px";
        g.style.width = Math.max(30, pnl[2] * m.s * 2.4) + "px"; g.style.height = Math.max(14, pnl[3] * m.s * 5) + "px";
        glowWrap.appendChild(g);
        return g;
      });
      heroMedia.appendChild(dim);
      heroMedia.appendChild(glowWrap);
      var far = Math.max(Math.hypot(vp.x, vp.y), Math.hypot(vp.w - vp.x, vp.y), Math.hypot(vp.x, vp.h - vp.y), Math.hypot(vp.w - vp.x, vp.h - vp.y));
      var reach = { r: 0 };
      var h1 = document.getElementById("hero-title") || heroMedia.parentNode.querySelector("h1");
      var tl = gsap.timeline({ defaults: { ease: ease }, onComplete: function () { dim.remove(); glowWrap.remove(); } });
      tl.set(dim, { opacity: 0.9 }, 0);
      glows.forEach(function (g, i) {
        var d = 0.15 + i * 0.055;
        tl.set(g, { opacity: 0.95 }, d).set(g, { opacity: 0.2 }, d + 0.05).set(g, { opacity: 1 }, d + 0.1)
          .to(g, { opacity: 0, duration: 0.9, ease: "power2.out" }, d + 0.45);
      });
      tl.to(reach, { r: far + 60, duration: 1.5, ease: "power2.in", onUpdate: function () { dim.style.setProperty("--r", reach.r + "px"); } }, 0.25)
        .set(h1, { opacity: 0.12 }, 0).set(h1, { opacity: 0.85 }, 0.32).set(h1, { opacity: 0.25 }, 0.38)
        .set(h1, { opacity: 1 }, 0.46).set(h1, { opacity: 0.55 }, 0.6).set(h1, { opacity: 1 }, 0.66)
        .fromTo(heroBits, { y: 20 }, { y: 0, duration: 0.9, stagger: 0.08, clearProps: "transform" }, 0.1);
      // Lichte parallax bij het wegscrollen
      gsap.to(heroMedia, { yPercent: 12, ease: "none", scrollTrigger: { trigger: heroMedia.parentNode, start: "top top", end: "bottom top", scrub: true } });
    }

    // 2. Titels en blokken komen binnen
    gsap.utils.toArray("[data-reveal]").forEach(function (node) {
      gsap.fromTo(node, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.9, ease: ease, clearProps: "transform",
        scrollTrigger: { trigger: node, start: "top 88%", once: true }
      });
    });

    // 3. Bento: tegels openen als een paneel (clip van onder naar boven)
    ScrollTrigger.batch("[data-tile]", {
      start: "top 90%", once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power4.out", stagger: 0.08, clearProps: "clipPath" });
      }
    });

    // 4. Aanpak: de stroom loopt door de fasen, gekoppeld aan het scrollen
    if (processWrap) {
      var fill = processWrap.querySelector(".process-fill");
      var mm = gsap.matchMedia();
      mm.add({ desk: "(min-width: 1024px)", mob: "(max-width: 1023px)" }, function (ctx) {
        var axis = ctx.conditions.desk ? "scaleX" : "scaleY";
        var from = {}; from[axis] = 0;
        var to = { ease: "none", scrollTrigger: {
          trigger: processWrap, start: ctx.conditions.desk ? "top 75%" : "top 70%", end: ctx.conditions.desk ? "bottom 55%" : "bottom 60%", scrub: 0.6,
          onUpdate: function (self) {
            steps.forEach(function (s, i) { s.classList.toggle("is-on", self.progress >= (i / (steps.length - 1)) * 0.98 || self.progress > 0.99); });
          }
        } };
        to[axis] = 1;
        gsap.fromTo(fill, from, to);
        return function () { steps.forEach(function (s) { s.classList.remove("is-on"); }); };
      });
    }


    // 7. Over ons: de sectie staat vast, de tijdlijn schuift zijwaarts en de stroom volgt
    var circuitSection = document.querySelector("[data-circuit]");
    if (circuitSection) {
      var eras = Array.prototype.slice.call(circuitSection.querySelectorAll("[data-era]"));
      var cmm = gsap.matchMedia();
      cmm.add("(min-width: 1024px)", function () {
        circuitSection.classList.add("circuit-on");
        var pinEl = circuitSection.querySelector(".circuit-pin");
        var track = circuitSection.querySelector(".circuit-track");
        var svg = circuitSection.querySelector(".circuit-svg");
        var base = svg.querySelector(".trace-base"), live = svg.querySelector(".trace-live"), spark = svg.querySelector(".trace-spark");
        var samples = [], total = 0, ledX = [];

        var build = function () {
          var tr = track.getBoundingClientRect();
          var pts = eras.map(function (era) {
            var r = era.querySelector(".led").getBoundingClientRect();
            return { x: r.left - tr.left + r.width / 2, y: r.top - tr.top + r.height / 2 };
          });
          ledX = pts.map(function (p) { return p.x; });
          var hint = circuitSection.querySelector(".circuit-hint").getBoundingClientRect();
          var sx = hint.right - tr.left + 14, sy = hint.top - tr.top + hint.height / 2;
          var d = "M" + sx + "," + sy;
          var prev = { x: sx, y: sy };
          var introRight = circuitSection.querySelector(".circuit-intro").getBoundingClientRect().right - tr.left + 48;
          pts.forEach(function (p, i) {
            // printbaan met bochten van 45 graden, net voor het volgende jaartal zodat de lijn nooit door tekst loopt
            var dy = p.y - prev.y, c = Math.min(Math.abs(dy) / 2, 48), sg = dy > 0 ? 1 : -1;
            var mid = i === 0 ? Math.max(introRight, p.x - 140) : p.x - 70;
            if (Math.abs(dy) < 1) d += " H" + p.x;
            else d += " H" + (mid - c) + " L" + mid + "," + (prev.y + sg * c) + " V" + (p.y - sg * c) + " L" + (mid + c) + "," + p.y + " H" + p.x;
            prev = p;
          });
          d += " H" + (track.scrollWidth - 40);
          svg.setAttribute("width", track.scrollWidth); svg.setAttribute("height", track.offsetHeight);
          base.setAttribute("d", d); live.setAttribute("d", d);
          total = live.getTotalLength();
          live.style.strokeDasharray = total; live.style.strokeDashoffset = total;
          samples = [];
          for (var i = 0; i <= 300; i++) { var pt = live.getPointAtLength(total * i / 300); samples.push({ l: total * i / 300, x: pt.x, y: pt.y }); }
        };
        var update = function () {
          if (!samples.length) return;
          var x = -gsap.getProperty(track, "x") + window.innerWidth * 0.6;
          var s = samples[0];
          for (var i = 0; i < samples.length && samples[i].x <= x; i++) s = samples[i];
          live.style.strokeDashoffset = total - s.l;
          spark.setAttribute("cx", s.x); spark.setAttribute("cy", s.y);
          eras.forEach(function (era, i) { era.classList.toggle("is-lit", ledX[i] <= x); });
        };

        build();
        var tween = gsap.to(track, {
          x: function () { return -(track.scrollWidth - window.innerWidth); },
          ease: "none",
          onUpdate: update,
          scrollTrigger: {
            trigger: pinEl, start: "top top", pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
            end: function () { return "+=" + (track.scrollWidth - window.innerWidth); },
            onRefresh: function () { gsap.set(track, { x: 0 }); build(); update(); }
          }
        });
        update();
        return function () {
          tween.kill();
          circuitSection.classList.remove("circuit-on");
          eras.forEach(function (e) { e.classList.remove("is-lit"); });
          gsap.set(track, { clearProps: "transform" });
        };
      });
      cmm.add("(max-width: 1023px)", function () {
        var triggers = eras.map(function (era) {
          return ScrollTrigger.create({ trigger: era, start: "top 72%", onEnter: function () { era.classList.add("is-lit"); }, onLeaveBack: function () { era.classList.remove("is-lit"); } });
        });
        return function () { triggers.forEach(function (t) { t.kill(); }); };
      });
    }

    // 5. Jaartallen schuiven één voor één binnen
    ScrollTrigger.batch("[data-year-item]", {
      start: "top 88%", once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.9, ease: ease, stagger: 0.12, clearProps: "transform" });
      }
    });

    // 6. Projecttegels
    ScrollTrigger.batch(".project", {
      start: "top 90%", once: true,
      onEnter: function (batch) {
        gsap.fromTo(batch, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9, ease: ease, stagger: 0.1, clearProps: "transform" });
      }
    });

    // Triggers in paginavolgorde verversen (de vastgezette tijdlijn verschuift alles eronder)
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Offerteformulier in drie stappen ---------- */

  var form = document.getElementById("quote-form");
  if (form) {
    var statusBox = document.getElementById("form-status");
    var stepStatus = document.getElementById("step-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var formSteps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
    var indicators = Array.prototype.slice.call(form.querySelectorAll(".steps li"));
    var current = 0;
    var messages = {
      type: "Kies het soort project.",
      naam: "Vul uw naam in.",
      email: "Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.be.",
      telefoon: "Vul een telefoonnummer in waarop wij u kunnen bereiken.",
      bericht: "Beschrijf uw project kort, minstens 10 tekens.",
      privacy: "Geef toestemming zodat wij uw gegevens mogen gebruiken voor deze aanvraag."
    };

    var errorFor = function (input) {
      if (input.type === "radio") return document.getElementById("f-type-err");
      var f = input.closest(".field");
      return f ? f.querySelector(".field-error") : null;
    };
    var markFor = function (input) {
      return input.type === "radio" ? input.closest(".choice-grid") : input.closest(".field");
    };

    var validate = function (input) {
      var value = (input.value || "").trim(), valid = true;
      if (input.type === "radio") valid = !!form.querySelector('input[name="' + input.name + '"]:checked');
      else if (input.type === "checkbox") valid = !input.required || input.checked;
      else if (input.required && !value) valid = false;
      else if (input.type === "email" && value) valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      else if (input.type === "tel" && value) valid = value.replace(/[^\d+]/g, "").length >= 9;
      else if (input.name === "bericht" && value) valid = value.length >= 10;
      var mark = markFor(input), err = errorFor(input);
      if (mark) { if (valid) mark.removeAttribute("data-invalid"); else mark.setAttribute("data-invalid", ""); }
      if (input.type === "radio") form.querySelectorAll('input[name="' + input.name + '"]').forEach(function (r) { r.setAttribute("aria-invalid", valid ? "false" : "true"); });
      else input.setAttribute("aria-invalid", valid ? "false" : "true");
      if (err) err.textContent = valid ? "" : (messages[input.name] || "Controleer dit veld.");
      return valid;
    };

    var fieldsIn = function (step) {
      var seen = {};
      return Array.prototype.slice.call(step.querySelectorAll("input, select, textarea")).filter(function (i) {
        if (!i.name || i.name === "_gotcha") return false;
        if (i.type === "radio") { if (seen[i.name]) return false; seen[i.name] = true; }
        return true;
      });
    };
    var validateStep = function (i) {
      var firstInvalid = null;
      fieldsIn(formSteps[i]).forEach(function (input) { if (!validate(input) && !firstInvalid) firstInvalid = input; });
      return firstInvalid;
    };

    var show = function (i, focus) {
      current = i;
      formSteps.forEach(function (s, k) { s.hidden = k !== i; });
      indicators.forEach(function (li, k) { li.classList.toggle("is-active", k === i); li.classList.toggle("is-done", k < i); });
      var title = formSteps[i].querySelector(".step-title");
      if (stepStatus) stepStatus.textContent = title ? title.textContent : "";
      if (focus) {
        var entering = formSteps[i];
        entering.classList.remove("is-entering"); void entering.offsetWidth; entering.classList.add("is-entering");
        setTimeout(function () { entering.classList.remove("is-entering"); }, 420);
        var top = form.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.4) form.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
        if (title) title.focus({ preventScroll: true });
      }
    };
    show(0, false);

    form.addEventListener("click", function (e) {
      if (e.target.closest("[data-next]")) {
        var bad = validateStep(current);
        if (bad) { bad.focus(); return; }
        show(Math.min(current + 1, formSteps.length - 1), true);
      }
      if (e.target.closest("[data-prev]")) show(Math.max(current - 1, 0), true);
    });
    // Enter in een tekstveld gaat naar de volgende stap in plaats van te versturen
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox" && current < formSteps.length - 1) {
        e.preventDefault();
        var next = formSteps[current].querySelector("[data-next]");
        if (next) next.click();
      }
    });

    form.querySelectorAll("input, textarea").forEach(function (input) {
      if (!input.name || input.name === "_gotcha") return;
      input.addEventListener("blur", function () { if (input.type !== "radio" && input.value) validate(input); });
      input.addEventListener("input", function () { var m = markFor(input); if (m && m.hasAttribute("data-invalid")) validate(input); });
      input.addEventListener("change", function () { if (input.type === "checkbox" || input.type === "radio") validate(input); });
    });

    var setStatus = function (kind, title, text) {
      statusBox.className = "form-status is-" + kind;
      statusBox.textContent = "";
      statusBox.appendChild(el("strong", { text: title }));
      statusBox.appendChild(document.createTextNode(text));
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusBox.className = "form-status";
      statusBox.textContent = "";
      for (var i = 0; i < formSteps.length; i++) {
        var bad = validateStep(i);
        if (bad) { if (i !== current) show(i, true); bad.focus(); return; }
      }

      var hp = form.querySelector('[name="_gotcha"]');
      if (hp && hp.value) { setStatus("success", "Bedankt.", " Uw aanvraag is verstuurd."); form.reset(); return; }

      if (!SITE_CONFIG.formEndpoint) {
        setStatus("error", "Het formulier is nog niet gekoppeld.", " Bel ons op 052 44 73 66 of mail naar info@elecboon.be. Uw ingevulde gegevens blijven staan.");
        console.warn("Boon: SITE_CONFIG.formEndpoint is leeg. Vul het endpoint in bovenaan js/main.js.");
        statusBox.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      var label = submitBtn.querySelector(".label");
      var original = label ? label.textContent : "";
      if (label) label.textContent = "Bezig met versturen";

      fetch(SITE_CONFIG.formEndpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          setStatus("success", "Bedankt, uw aanvraag is goed ontvangen.", " Wij nemen zo snel mogelijk contact met u op. Dringend? Bel 052 44 73 66.");
          form.reset();
          form.querySelectorAll("[aria-invalid]").forEach(function (i) { i.removeAttribute("aria-invalid"); });
          indicators.forEach(function (li) { li.classList.remove("is-active"); li.classList.add("is-done"); });
        })
        .catch(function () {
          setStatus("error", "Versturen is niet gelukt.", " Probeer het opnieuw of bel ons op 052 44 73 66. Uw ingevulde gegevens blijven staan.");
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          if (label) label.textContent = original;
          statusBox.focus();
        });
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
})();
