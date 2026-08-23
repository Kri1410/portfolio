  // Interaktiv demo — piksel-motor som farger kun lakken.
  // Du klikker på lakken; motoren finner alle piksler med lignende farge
  // (myke kanter, skygger og refleksjoner bevares) og farger bare dem.
  (function () {
    var canvas = document.getElementById('demoCanvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var kilde = document.getElementById('demoKilde');
    var hint = document.getElementById('demoHint');
    var farger = document.querySelectorAll('#d-farger button');
    var rGlans = document.getElementById('d-glans');
    var rSot = document.getElementById('d-sot');

    // Corvettens frontrute, oppmålt i bildet (prosent av bredde/høyde).
    // Overlapp mot tak/stolper er usynlig — bakgrunnen er gjennomsiktig
    // og sterkt rød lakk beskyttes av fargeeksklusjonen.
    var VINDUER = [
      [[29.1, 11.2], [34.5, 7.5], [42.6, 5.2], [53.4, 7], [58.2, 12.5],
       [61.3, 19.3], [62.4, 23.6], [53.4, 26.6], [44.4, 26.8], [40.2, 24.6],
       [34.3, 16.9]]
    ];

    var orig = null, ut = null;          // originale piksler + arbeidsbuffer
    var H = null, S = null, L = null;    // HSL per piksel
    var M = null;                        // lakkmaske (0–1)
    var W = null;                        // vindusmaske
    var base = { h: 0, s: 0, ok: false };
    var preset = null;

    function rgb2hsl(r, g, b) {
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      var l = (mx + mn) / 2, h = 0, s = 0;
      if (d > 0) {
        s = d / (1 - Math.abs(2 * l - 1) || 1);
        if (mx === r) h = 60 * (((g - b) / d) % 6);
        else if (mx === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
        if (h < 0) h += 360;
      }
      return [h, s, l];
    }
    function hsl2rgb(h, s, l) {
      var c = (1 - Math.abs(2 * l - 1)) * s;
      var x = c * (1 - Math.abs((h / 60) % 2 - 1));
      var m = l - c / 2, r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
      return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
    }
    function glatt(a, b, x) {
      var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }

    // enkel boksutjevning i to retninger — myker opp maskekanter
    function boksUtjevn(felt, r) {
      var w = canvas.width, h = canvas.height;
      var tmp = new Float32Array(felt.length), res = new Float32Array(felt.length);
      var x, y, sum, rad;
      for (y = 0; y < h; y++) {
        rad = y * w; sum = 0;
        for (x = -r; x <= r; x++) sum += felt[rad + Math.min(w - 1, Math.max(0, x))];
        for (x = 0; x < w; x++) {
          tmp[rad + x] = sum / (2 * r + 1);
          sum += felt[rad + Math.min(w - 1, x + r + 1)] - felt[rad + Math.max(0, x - r)];
        }
      }
      for (x = 0; x < w; x++) {
        sum = 0;
        for (y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
        for (y = 0; y < h; y++) {
          res[y * w + x] = sum / (2 * r + 1);
          sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
        }
      }
      return res;
    }

    function iPolygon(px, py, poly, w, h) {
      var inne = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0] / 100 * w, yi = poly[i][1] / 100 * h;
        var xj = poly[j][0] / 100 * w, yj = poly[j][1] / 100 * h;
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inne = !inne;
      }
      return inne;
    }

    function lastBilde(img, medVinduer, etterpaa) {
      var sc = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * sc);
      canvas.height = Math.round(img.naturalHeight * sc);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      orig = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ut = ctx.createImageData(canvas.width, canvas.height);
      var n = canvas.width * canvas.height, d = orig.data;
      H = new Float32Array(n); S = new Float32Array(n);
      L = new Float32Array(n); M = new Float32Array(n);
      for (var i = 0, p = 0; i < n; i++, p += 4) {
        var hsl = rgb2hsl(d[p] / 255, d[p + 1] / 255, d[p + 2] / 255);
        H[i] = hsl[0]; S[i] = hsl[1]; L[i] = hsl[2];
      }
      W = null;
      if (medVinduer) {
        var bw = canvas.width, bh = canvas.height;
        var raa = new Float32Array(n);
        for (var k = 0; k < VINDUER.length; k++) {
          var poly = VINDUER[k], x0 = 100, y0 = 100, x1 = 0, y1 = 0;
          poly.forEach(function (pt) {
            x0 = Math.min(x0, pt[0]); x1 = Math.max(x1, pt[0]);
            y0 = Math.min(y0, pt[1]); y1 = Math.max(y1, pt[1]);
          });
          var px0 = Math.floor(x0 / 100 * bw), px1 = Math.ceil(x1 / 100 * bw);
          var py0 = Math.floor(y0 / 100 * bh), py1 = Math.ceil(y1 / 100 * bh);
          for (var y = py0; y <= py1; y++) for (var x = px0; x <= px1; x++) {
            if (x < 0 || y < 0 || x >= bw || y >= bh) continue;
            if (iPolygon(x, y, poly, bw, bh)) raa[y * bw + x] = 1;
          }
        }
        W = boksUtjevn(raa, 2);
        // sterkt mettet lakk (speilet, panserkanten) skal aldri sotes — men de
        // svakt rødlige dashbord-refleksene inne i glasset skal, så terskelen er høy
        for (i = 0; i < n; i++) {
          if (W[i] > 0) W[i] *= (1 - glatt(0.55, 0.75, S[i]));
        }
      }
      base.ok = false;
      if (etterpaa) etterpaa();
    }

    // gjennomsnittsfarge i et lite felt rundt (px,py) — sirkulært snitt for nyansen
    function velgBase(px, py) {
      var vx = 0, vy = 0, ss = 0, sl = 0, ant = 0;
      for (var dy = -3; dy <= 3; dy++) for (var dx = -3; dx <= 3; dx++) {
        var x = px + dx, y = py + dy;
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
        var i = y * canvas.width + x, rad = H[i] * Math.PI / 180;
        vx += Math.cos(rad) * S[i]; vy += Math.sin(rad) * S[i];
        ss += S[i]; sl += L[i]; ant++;
      }
      var h = Math.atan2(vy, vx) * 180 / Math.PI;
      base.h = h < 0 ? h + 360 : h;
      base.s = ss / ant;
      base.l = sl / ant;
      base.ok = true;
      byggMaske();
    }

    function byggMaske() {
      var n = H.length, graabil = base.s < 0.16;
      for (var i = 0; i < n; i++) {
        var w;
        if (graabil) {
          // grå/sølv bil: nyansen sier lite — velg lite mettede piksler i et
          // lysstyrkevindu rundt punktet det ble klikket på
          w = (1 - glatt(0.18, 0.32, S[i]))
            * glatt(base.l - 0.22, base.l - 0.10, L[i])
            * (1 - glatt(base.l + 0.13, base.l + 0.27, L[i]));
        } else {
          var dh = Math.abs(H[i] - base.h); if (dh > 180) dh = 360 - dh;
          w = (1 - glatt(20, 55, dh)) * glatt(0.10, 0.24, S[i])
            * glatt(0.03, 0.08, L[i]) * (1 - glatt(0.93, 0.99, L[i]));
        }
        M[i] = w;
      }
    }

    var venter = false;
    function tegn() {
      if (venter) return;
      venter = true;
      requestAnimationFrame(function () { venter = false; render(); });
    }
    function render() {
      if (!orig) return;
      var g = +rGlans.value, sot = +rSot.value / 100;
      ut.data.set(orig.data);
      var d = ut.data, n = H.length;
      var aktiv = base.ok && (preset || g > 0);
      for (var i = 0, p = 0; i < n; i++, p += 4) {
        if (d[p + 3] < 10) continue; // gjennomsiktig bakgrunn
        // 1) lakken: farge og forsegling
        if (aktiv) {
          var w = M[i];
          if (w > 0.02) {
            var h = H[i], s = S[i], l = L[i];
            if (preset) {
              if (preset.h != null) h = preset.h;
              if (preset.s != null) s = preset.s * (0.45 + 0.55 * Math.min(1, s / 0.55));
              if (preset.l != null) l = l * preset.l;
            }
            if (g > 0) { l = 0.5 + (l - 0.5) * (1 + g * 0.0022); s = s * (1 + g * 0.003); }
            s = Math.min(1, Math.max(0, s));
            l = Math.min(1, Math.max(0, l));
            var rgb = hsl2rgb(h, s, l);
            d[p]     = d[p]     * (1 - w) + rgb[0] * w;
            d[p + 1] = d[p + 1] * (1 - w) + rgb[1] * w;
            d[p + 2] = d[p + 2] * (1 - w) + rgb[2] * w;
          }
        }
        // 2) solfilm: gjør glasset mørkt, men la refleksene i glasset leve litt
        if (W && sot > 0) {
          var ww = W[i];
          if (ww > 0.02) {
            var hsl3 = rgb2hsl(d[p] / 255, d[p + 1] / 255, d[p + 2] / 255);
            var demp = hsl3[2] > 0.82 ? 0.55 : 0.85;
            var l3 = hsl3[2] * (1 - demp * sot);
            var s3 = hsl3[1] * (1 - 0.5 * sot);
            var rgb3 = hsl2rgb(hsl3[0], s3, l3);
            d[p]     = d[p]     * (1 - ww) + rgb3[0] * ww;
            d[p + 1] = d[p + 1] * (1 - ww) + rgb3[1] * ww;
            d[p + 2] = d[p + 2] * (1 - ww) + rgb3[2] * ww;
          }
        }
      }
      ctx.putImageData(ut, 0, 0);
      [rGlans, rSot].forEach(function (r) {
        r.style.background = 'linear-gradient(90deg, var(--gull) ' + r.value + '%, var(--line) ' + r.value + '%)';
      });
    }

    canvas.addEventListener('click', function (ev) {
      var r = canvas.getBoundingClientRect();
      var x = Math.round((ev.clientX - r.left) / r.width * canvas.width);
      var y = Math.round((ev.clientY - r.top) / r.height * canvas.height);
      velgBase(x, y);
      hint.textContent = 'Fargeområde valgt — klikk igjen for å flytte det';
      tegn();
    });

    function lesPreset(str) {
      if (!str) return null;
      var p = {};
      str.split(',').forEach(function (del) {
        var kv = del.split(':');
        p[kv[0].trim()] = parseFloat(kv[1]);
      });
      return p;
    }
    farger.forEach(function (kn) {
      kn.addEventListener('click', function () {
        farger.forEach(function (a) { a.setAttribute('aria-pressed', 'false'); });
        kn.setAttribute('aria-pressed', 'true');
        preset = lesPreset(kn.dataset.f);
        tegn();
      });
    });
    [rGlans, rSot].forEach(function (r) { r.addEventListener('input', tegn); });

    function startStandardbil() {
      lastBilde(kilde, true, function () {
        // Corvetten er ferdig oppmålt: panseret ligger på ca. (62 %, 54 %)
        velgBase(Math.round(canvas.width * 0.62), Math.round(canvas.height * 0.54));
        hint.textContent = 'Klikk på lakken for å flytte fargeområdet';
        canvas.setAttribute('aria-label', 'Rød Chevrolet Corvette fra hallen hos FolieGutta');
        tegn();
      });
    }
    document.getElementById('d-reset').addEventListener('click', function () {
      rGlans.value = 0; rSot.value = 0;
      preset = null;
      farger.forEach(function (a) { a.setAttribute('aria-pressed', 'false'); });
      farger[0].setAttribute('aria-pressed', 'true');
      startStandardbil();
    });

    if (kilde.complete && kilde.naturalWidth) { startStandardbil(); }
    else { kilde.onload = function () { kilde.onload = null; startStandardbil(); }; }
  })();

  // Fremdriftslinje under toppmenyen
  (function () {
    var linje = document.getElementById('framdrift');
    if (!linje) return;
    var venter = false;
    function oppdater() {
      var maks = document.documentElement.scrollHeight - window.innerHeight;
      linje.style.width = (maks > 0 ? (window.scrollY / maks) * 100 : 0) + '%';
      venter = false;
    }
    window.addEventListener('scroll', function () {
      if (!venter) { venter = true; requestAnimationFrame(oppdater); }
    }, { passive: true });
    oppdater();
  })();

  // Aktiv seksjon markeres i menyen
  (function () {
    var lenker = document.querySelectorAll('.meny a[href^="#"]:not(.knapp)');
    if (!lenker.length || !('IntersectionObserver' in window)) return;
    var kart = {};
    lenker.forEach(function (a) { kart[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && kart[e.target.id]) {
          lenker.forEach(function (a) { a.classList.remove('aktiv'); });
          kart[e.target.id].classList.add('aktiv');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(kart).forEach(function (id) {
      var sek = document.getElementById(id);
      if (sek) io.observe(sek);
    });
  })();

  // Lysboks — klikk på galleribilde for full størrelse
  (function () {
    var boks = document.getElementById('lysboks');
    if (!boks) return;
    var bilde = boks.querySelector('img');
    function lukk() { boks.hidden = true; document.body.style.overflow = ''; }
    document.querySelectorAll('.foto img').forEach(function (img) {
      img.addEventListener('click', function () {
        bilde.src = img.src;
        bilde.alt = img.alt;
        boks.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    });
    boks.addEventListener('click', lukk);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !boks.hidden) lukk();
    });
  })();

  // Statistikk som teller opp ved innlasting
  (function () {
    var tellere = document.querySelectorAll('[data-tell]');
    if (!tellere.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    tellere.forEach(function (el) {
      var maal = +el.dataset.tell;
      var suffiks = el.dataset.suffiks || '';
      var start = null;
      function steg(t) {
        if (!start) start = t;
        var f = Math.min(1, (t - start) / 1200);
        f = 1 - Math.pow(1 - f, 3);
        el.textContent = Math.round(maal * f) + suffiks;
        if (f < 1) requestAnimationFrame(steg);
      }
      requestAnimationFrame(steg);
    });
  })();

  // Delbeskyttelse — soner som lyser opp etter tur
  (function () {
    var knapper = document.querySelectorAll('.sone-knapp');
    if (!knapper.length) return;
    var redusert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idx = 0, timer = null;

    function vis(i) {
      idx = i;
      knapper.forEach(function (k, j) {
        var aktiv = j === i;
        k.classList.toggle('aktiv', aktiv);
        k.setAttribute('aria-expanded', String(aktiv));
        var flate = document.getElementById(k.dataset.sone);
        if (flate) flate.classList.toggle('aktiv', aktiv);
      });
    }
    function start() {
      if (redusert) return;
      clearInterval(timer);
      timer = setInterval(function () { vis((idx + 1) % knapper.length); }, 4000);
    }
    knapper.forEach(function (k, j) {
      k.addEventListener('click', function () { vis(j); start(); });
    });
    vis(0);
    start();
  })();

  // Avsløring ved scroll
  var redusert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!redusert && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('vis'); });
  }

  // Kontaktskjema — åpner e-postutkast (bytt gjerne til Formspree e.l. ved publisering)
  document.getElementById('tilbudsskjema').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = ev.target;
    var emne = 'Tilbudsforespørsel: ' + f.tjeneste.value;
    var kropp = 'Navn: ' + f.navn.value + '\n'
              + 'Telefon: ' + f.telefon.value + '\n'
              + 'Gjelder: ' + f.tjeneste.value + '\n\n'
              + f.melding.value;
    window.location.href = 'mailto:post@foliegutta.no'
      + '?subject=' + encodeURIComponent(emne)
      + '&body=' + encodeURIComponent(kropp);
  });
