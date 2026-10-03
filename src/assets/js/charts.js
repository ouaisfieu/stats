// Interaction des graphiques : réticule + infobulle (souris, tactile, clavier).
// Amélioration progressive : sans ce script, graphiques et tableaux restent lisibles.
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var nfCache = {};
  function fmt(v, d) {
    if (v === null || v === undefined || !isFinite(v)) return "–";
    var nf = nfCache[d] || (nfCache[d] = new Intl.NumberFormat("fr-BE", { minimumFractionDigits: d, maximumFractionDigits: d }));
    return nf.format(v).replace("-", "−");
  }
  function unit(u) { return u === "%" ? " %" : u ? " " + u : ""; }
  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function placeTip(box, tip, px, py) {
    var bw = box.clientWidth;
    tip.hidden = false;
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = px + 14;
    if (left + tw > bw) left = px - tw - 14;
    if (left < 0) left = Math.max(0, Math.min(bw - tw, px - tw / 2));
    var top = Math.max(0, py - th - 12);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function initTime(box, cfg) {
    var svg = box.querySelector("svg");
    var hit = svg.querySelector(".hit");
    var hover = svg.querySelector(".hover");
    var cross = svg.querySelector(".cross");
    var tip = box.querySelector(".tip");
    var isBar = cfg.t === "bar";
    var n = cfg.y1 - cfg.y0 + 1;
    var band = cfg.pw / n;
    function xOf(y) { return isBar ? cfg.l + (y - cfg.y0) * band + band / 2 : cfg.l + ((y - cfg.y0) / (cfg.y1 - cfg.y0)) * cfg.pw; }
    function yOf(v) { return cfg.top + cfg.ph - ((v - cfg.lo) / (cfg.hi - cfg.lo)) * cfg.ph; }
    var dots = cfg.s.map(function (s) {
      var c = el("circle", { r: 5, class: "hdot c-" + s.c, visibility: "hidden" });
      if (!isBar) hover.appendChild(c);
      return c;
    });
    var bars = isBar ? svg.querySelectorAll(".bars path") : [];
    var current = null;

    function show(year) {
      if (year < cfg.y0) year = cfg.y0;
      if (year > cfg.y1) year = cfg.y1;
      current = year;
      var x = xOf(year);
      box.classList.add("active");
      if (!isBar) { cross.setAttribute("x1", x); cross.setAttribute("x2", x); }
      var rows = "";
      var any = false;
      cfg.s.forEach(function (s, i) {
        var v = s.v[year];
        if (v === undefined) { dots[i].setAttribute("visibility", "hidden"); return; }
        any = true;
        if (!isBar) { dots[i].setAttribute("cx", x); dots[i].setAttribute("cy", yOf(v)); dots[i].setAttribute("visibility", "visible"); }
        rows += '<span class="row"><span>' + (cfg.s.length > 1 ? '<i class="key c-' + s.c + '"></i>' + esc(s.n) : esc(s.n)) + "</span><span>" + fmt(v, cfg.d) + unit(cfg.u) + "</span></span>";
      });
      if (isBar) {
        for (var b = 0; b < bars.length; b++) bars[b].classList.toggle("dim", Number(bars[b].getAttribute("data-y")) !== year);
      }
      tip.innerHTML = "<b>" + (cfg.pit ? "1er janvier " : "") + year + "</b>" + (any ? rows : '<span class="row"><span>Pas de donnée</span></span>');
      var r = svg.getBoundingClientRect();
      var scale = r.width / cfg.W;
      var ys = cfg.s.map(function (s) { return s.v[year]; }).filter(function (v) { return v !== undefined; });
      var py = ys.length ? Math.min.apply(null, ys.map(yOf)) : cfg.top;
      placeTip(box, tip, x * scale, py * scale);
    }
    function hide() {
      current = null;
      box.classList.remove("active");
      tip.hidden = true;
      dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); });
      for (var b = 0; b < bars.length; b++) bars[b].classList.remove("dim");
    }
    function yearAt(evt) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      if (isBar) return cfg.y0 + Math.floor((p.x - cfg.l) / band);
      return cfg.y0 + Math.round(((p.x - cfg.l) / cfg.pw) * (cfg.y1 - cfg.y0));
    }
    hit.addEventListener("pointermove", function (e) { show(yearAt(e)); });
    hit.addEventListener("pointerdown", function (e) { show(yearAt(e)); });
    hit.addEventListener("pointerleave", hide);
    box.tabIndex = 0;
    box.setAttribute("aria-label", "Graphique interactif : utilisez les flèches gauche et droite pour parcourir les années.");
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        show((current === null ? cfg.y1 : current) + (e.key === "ArrowLeft" ? -1 : 1));
      } else if (e.key === "Home") { e.preventDefault(); show(cfg.y0); }
      else if (e.key === "End") { e.preventDefault(); show(cfg.y1); }
      else if (e.key === "Escape") hide();
    });
    box.addEventListener("focus", function () { if (current === null) show(cfg.y1); });
    box.addEventListener("blur", hide);
  }

  function initHbar(box) {
    box.querySelectorAll(".hrow").forEach(function (g) {
      g.addEventListener("pointerenter", function () { g.classList.add("on"); });
      g.addEventListener("pointerleave", function () { g.classList.remove("on"); });
    });
  }

  document.querySelectorAll(".chart[data-chart]").forEach(function (box) {
    try {
      var cfg = JSON.parse(box.getAttribute("data-chart"));
      if (cfg.t === "hbar") initHbar(box); else initTime(box, cfg);
    } catch (e) { /* le graphique statique reste affiché */ }
  });
})();
