/* ============================================================
   Phonetics Labs, engine
   Shared by every lab and by both builds.

   Inputs the page must define before this script runs:
     window.LAB_MODE   "scorm" | "site"
     window.LAB_ITEMS  the item bank (see lab_<n>/src/items.json)
     window.LAB_AUDIO  array of audio slugs present in this build
     window.LAB_META   { course, lab, title, home }

   Contract with the lab:
     one scored attempt per item, first answer counts
     no retries, no penalties, explanation always shown
     progress saves continuously, submission is explicit
   ============================================================ */
(function (w, d) {
  "use strict";

  var MODE = w.LAB_MODE === "scorm" ? "scorm" : "site";
  var BANK = w.LAB_ITEMS;
  var META = w.LAB_META || {};
  var HAVE = {};
  (w.LAB_AUDIO || []).forEach(function (s) { HAVE[s] = 1; });

  var UNIT = (BANK.unit && BANK.unit.one) || "Trail";
  var REDUCED = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     IPA tie bar
     Affricates and diphthongs are conventionally written with a
     tie bar: /t͡ʃ/, /ɑ͡ɪ/. Authoring it into every string would mean
     carrying a combining character through the item bank, the
     audio manifest and the ElevenLabs requests, where it does not
     belong. So the plain two-character form is stored everywhere
     and the mark is inserted at render time, in one pass over the
     text nodes of whatever was just drawn.

     The mark is U+0361 COMBINING DOUBLE INVERTED BREVE. It has
     zero advance width, so nothing reflows. It needs a
     proportional font to centre correctly, which is why IPA is
     set in --ipa rather than the monospace stack.
     ============================================================ */
  var TIE_MARK = "\u0361";
  var TIED = ["t\u0283", "d\u0292", "e\u026A", "o\u028A",
              "\u0251\u026A", "\u0251\u028A", "\u0254\u026A"];
  var TIE_RE = new RegExp("(" + TIED.join("|") + ")", "g");

  function tieText(str) {
    return str.replace(TIE_RE, function (m) { return m[0] + TIE_MARK + m[1]; });
  }

  function tieIPA(root) {
    if (!root || w.LAB_TIE === false) return;
    var walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      var v = t.nodeValue;
      if (!v || v.indexOf(TIE_MARK) >= 0) return;   // already tied, leave it
      var out = tieText(v);
      if (out !== v) t.nodeValue = out;
    });
  }

  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function el(tag, cls, html) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ============================================================
     Flat screen list
     ============================================================ */
  var LEGS = BANK.legs;
  var PER = LEGS[0].items.length;          // kept for older callers; trails may differ in length
  var TOTAL = LEGS.reduce(function (n, l) { return n + l.items.length; }, 0);

  /* Items are numbered 0..TOTAL-1 across the trails. Trails need not be the same
     length (Lab 8: 15, 10 and 5), so position is worked out from each trail's
     offset rather than from a fixed trail length. */
  var OFF = [];
  LEGS.reduce(function (o, l) { OFF.push(o); return o + l.items.length; }, 0);
  function tOf(li, i) { return OFF[li] + i; }
  function liOf(t) { for (var li = LEGS.length - 1; li > 0; li--) if (t >= OFF[li]) return li; return 0; }
  function iOf(t) { return t - OFF[liOf(t)]; }

  var SCREENS = [{ k: "intro" }];
  LEGS.forEach(function (leg, li) {
    SCREENS.push({ k: "concept", leg: li });
    leg.items.forEach(function (_, i) { SCREENS.push({ k: "item", leg: li, i: i, t: tOf(li, i) }); });
    SCREENS.push({ k: "checkpoint", leg: li });
  });
  SCREENS.push({ k: "finish" });

  function itemOf(sc) { return LEGS[sc.leg].items[sc.i]; }
  function legOf(sc) { return sc.leg == null ? null : LEGS[sc.leg]; }

  /* ============================================================
     State
     ============================================================ */
  var S = {
    at: 0,                                   // index into SCREENS
    given: new Array(TOTAL).fill(null),      // raw answer per item, null while unanswered
    fx: true,                                // effect sounds
    submitted: false,
    pending: null                            // selected but not yet checked
  };

  function keyOf(it, v) {
    return it.type === "boolean" ? (v ? "true" : "false") : String(v);
  }

  /* Lab 9: transcriptions with stress marks (it.judge === "stress"). There are
     too many ways to be nearly right to list them, so these items are judged
     by rule rather than looked up:
       - the sounds must match, symbol for symbol, except where the item allows
         a choice (it.vary: segment index -> the other symbols that count, an
         unstressed vowel written [ə] or [ɪ]);
       - every mark belongs to the syllable whose vowel comes next after it;
       - the main stress (pri, ˈ) on the wrong syllable, two of them, none at
         all, or a mark that belongs to no syllable: no gem;
       - the main stress right but a secondary stress (sec, ˌ) missing, extra
         or moved, or a mark on the right syllable but not at its start (before
         its first consonant; it.mark_ok lists other starts that count, by
         syllable): half a gem;
       - everything right: the gem. A one-syllable word needs no mark, and a
         main-stress mark at its start counts too; a secondary mark on a syllable
         where the dictionary gives one as optional (it.sec_ok) counts either way.
     it.starts gives the segment index at which each syllable begins. */
  var MARKS = { pri: 2, sec: 1 };
  var VOWELS = {};
  LEGS.forEach(function (leg) {
    (leg.tiles || []).forEach(function (tl) { if (tl.cat === "v") VOWELS[tl.slug] = true; });
  });
  function splitMarks(key) {
    var segs = [], marks = [];
    String(key).split(".").forEach(function (s) {
      if (MARKS[s] != null) marks.push({ lv: MARKS[s], pos: segs.length });
      else if (s) segs.push(s);
    });
    return { segs: segs, marks: marks };
  }
  var VERDICTS = {};
  function verdictOf(it, given) {
    if (given == null || it.judge !== "stress") return null;
    var ck = it.id + "|" + given;
    if (VERDICTS[ck]) return VERDICTS[ck];
    var K = splitMarks(it.answer), G = splitMarks(given), vary = it.vary || {};
    var v = { credit: 0, kinds: [], missing: [], extra: [], misplaced: [], misLv: {}, main: -1, givenMain: -1 };
    var secOk = it.sec_ok || [];
    // the key's syllables: one per vowel
    var vpos = [];
    K.segs.forEach(function (s, i) { if (VOWELS[s]) vpos.push(i); });
    var nSyl = vpos.length;
    function sylOf(pos, P) { for (var k = 0; k < P.length; k++) if (P[k] >= pos) return k; return -1; }
    var keyAt = {};
    K.marks.forEach(function (m) { keyAt[sylOf(m.pos, vpos)] = m; });
    for (var k0 in keyAt) if (keyAt[k0].lv === 2) v.main = +k0;
    // the student's sounds, with any allowed choice put back to the key's, so
    // the reveal sets real differences only against the answer
    var same = G.segs.length === K.segs.length;
    var segs = G.segs.map(function (s, i) {
      return same && s !== K.segs[i] && vary[i] && vary[i].indexOf(s) >= 0 ? K.segs[i] : s;
    });
    v.segKey = segs.join(".");
    var soundsOK = v.segKey === K.segs.join(".");
    // the student's marks, on their own syllables (by their own vowels)
    var gpos = [];
    G.segs.forEach(function (s, i) { if (VOWELS[s]) gpos.push(i); });
    var givAt = {}, odd = false;
    G.marks.forEach(function (m) {
      var k = sylOf(m.pos, gpos);
      if (k < 0 || givAt[k]) odd = true;
      else givAt[k] = m;
    });
    // the reference the reveal lines the answer up against: the key's marks
    // and sounds, with the student's allowed choices where they made them
    var ref = [];
    var mk = {};
    K.marks.forEach(function (m) { mk[m.pos] = m; });
    K.segs.forEach(function (s, i) {
      if (mk[i]) ref.push(mk[i].lv === 2 ? "pri" : "sec");
      ref.push(same && G.segs[i] !== s && vary[i] && vary[i].indexOf(G.segs[i]) >= 0 ? G.segs[i] : s);
    });
    v.ref = ref;
    var mains = Object.keys(givAt).filter(function (k) { return givAt[k].lv === 2; }).map(Number);
    v.givenMain = mains.length === 1 ? mains[0] : -1;
    var starts = it.starts || [0], ok = it.mark_ok || {}, k;
    if (!soundsOK) {
      v.kinds.push("sounds");
      // when only sounds were swapped, not added or dropped, the marks can still be
      // judged against the key: say so if every one of them is right
      if (same && !odd && mains.length === 1 && mains[0] === v.main) {
        var allRight = true;
        for (k = 0; k < nSyl; k++) {
          var want = keyAt[k] ? keyAt[k].lv : 0, got = givAt[k], gl = got ? got.lv : 0;
          if (gl !== want && !(want === 0 && gl === 1 && secOk.indexOf(k) >= 0)) allRight = false;
          if (got && !(got.pos === starts[k] || (ok[k] || []).indexOf(got.pos) >= 0)) allRight = false;
        }
        if (allRight) v.kinds.push("stress_ok");
      }
      return (VERDICTS[ck] = v);
    }
    if (odd) { v.kinds.push("marks_odd"); return (VERDICTS[ck] = v); }
    if (nSyl > 1 || v.main >= 0) {
      if (!G.marks.length) { v.kinds.push("no_marks"); return (VERDICTS[ck] = v); }
      if (mains.length === 0) { v.kinds.push("no_main"); return (VERDICTS[ck] = v); }
      if (mains.length > 1) { v.kinds.push("two_mains"); return (VERDICTS[ck] = v); }
      if (mains[0] !== v.main) { v.kinds.push("main"); return (VERDICTS[ck] = v); }
    } else if (mains.length > 1) {
      v.kinds.push("two_mains"); return (VERDICTS[ck] = v);
    }
    // the main stress is right (or the word has one syllable): now the lighter beats
    for (k = 0; k < nSyl; k++) {
      var kl = keyAt[k] ? keyAt[k].lv : (nSyl === 1 ? 2 : 0), g = givAt[k];
      if (kl === 1 && !(g && g.lv === 1)) v.missing.push(k);
      if (g && g.lv === 1 && kl !== 1 && secOk.indexOf(k) < 0) { v.extra.push(k); continue; }
      // a mark that should not be there at all is not also told where it should go
      if (g && !(g.pos === starts[k] || (ok[k] || []).indexOf(g.pos) >= 0)) { v.misplaced.push(k); v.misLv[k] = g.lv; }
    }
    if (v.missing.length) v.kinds.push("sec_missing");
    if (v.extra.length) v.kinds.push("sec_extra");
    if (v.misplaced.length) v.kinds.push("mark_place");
    v.credit = v.kinds.length ? ALT_CREDIT : 1;
    return (VERDICTS[ck] = v);
  }
  function verdict(t) {
    if (S.given[t] == null) return null;
    return verdictOf(LEGS[liOf(t)].items[iOf(t)], String(S.given[t]));
  }

  /* The answer this course teaches. An item may list further answers that
     are equally right (it.also, Lab 3: /w/ as lips, or lips + tongue back);
     any of them earns the whole gem. */
  function isCorrect(t) {
    if (S.given[t] == null) return false;
    var li = liOf(t), i = iOf(t), it = LEGS[li].items[i];
    if (S.given[t] === it.answer) return true;
    if (it.also && it.also.indexOf(keyOf(it, S.given[t])) >= 0) return true;
    var v = verdict(t);
    return !!(v && v.credit === 1);
  }

  /* A defensible alternative analysis: not the course answer, but not a
     mistake either. Earns the gem, and is marked differently on the path. */
  function isAlternate(t) {
    if (S.given[t] == null || isCorrect(t)) return false;
    var li = liOf(t), i = iOf(t), it = LEGS[li].items[i];
    if (it.accept && it.accept[keyOf(it, S.given[t])]) return true;
    var v = verdict(t);
    return !!(v && v.credit > 0 && v.credit < 1);
  }

  /* What earns something, and therefore what counts toward the grade.
     An exact answer is a whole gem. A near miss on an item that offers one is
     half. Anything else is nothing. */
  var ALT_CREDIT = (BANK.grading && BANK.grading.alt_credit) || 0.5;

  function isCredited(t) { return isCorrect(t) || isAlternate(t); }
  function creditOf(t) { return isCorrect(t) ? 1 : isAlternate(t) ? ALT_CREDIT : 0; }

  function gems() {
    var n = 0;
    for (var t = 0; t < TOTAL; t++) n += creditOf(t);
    return Math.round(n * 100) / 100;
  }

  /* Halves are rounded up before the grade bands are applied, so 19.5 clears a
     threshold of 20. The student always sees the true total; only the band uses
     the rounded figure. */
  function graded(g) { return Math.ceil(g - 1e-9); }

  /* "12" or "12.5", never "12.50". */
  function fmtGems(n) {
    return (Math.round(n * 2) / 2).toString();
  }
  function answered() {
    var n = 0;
    for (var t = 0; t < TOTAL; t++) if (S.given[t] != null) n++;
    return n;
  }
  function legGems(li) {
    var n = 0;
    for (var i = 0; i < LEGS[li].items.length; i++) n += creditOf(tOf(li, i));
    return Math.round(n * 100) / 100;
  }
  function legAlternates(li) {
    var n = 0;
    for (var i = 0; i < LEGS[li].items.length; i++) if (isAlternate(tOf(li, i))) n++;
    return n;
  }
  function alternates() {
    var n = 0;
    for (var t = 0; t < TOTAL; t++) if (isAlternate(t)) n++;
    return n;
  }
  /* A bank may grade on completion instead (the Phonological Processes Lab): everyone who
     submits gets the full score, and the gems are feedback only. */
  var COMPLETION = !!(BANK.grading && BANK.grading.mode === "completion");

  function scoreOf(g) {
    var G = BANK.grading, e = graded(g);
    if (COMPLETION) return G.full_score;
    if (e >= G.full_threshold) return G.full_score;
    if (e >= 1) return G.partial_score;
    return G.zero_score;
  }
  function pointsOf(g) {
    var G = BANK.grading, e = graded(g);
    if (COMPLETION) return G.full_points;
    if (e >= G.full_threshold) return G.full_points;
    if (e >= 1) return G.partial_points;
    return 0;
  }

  /* ============================================================
     Audio
     ============================================================ */
  var AUDIO = {
    PREROLL: 300,          // a beat before playback, so a clip never feels rushed
    _cache: {},
    _timer: null,
    _cur: null,
    _btn: null,

    has: function (slug) { return !!HAVE[slug]; },

    /* The clip for a transcription symbol, or "" when this build has no recording of it.
       The item bank stores /ʃ/, the file is called ipa_sh.mp3. */
    forIPA: function (ipa) {
      var slug = (w.LAB_IPA_SLUG || {})[ipa];
      return slug && HAVE["ipa_" + slug] ? "ipa_" + slug : "";
    },

    _node: function (slug) {
      if (!this._cache[slug]) {
        var a = new Audio("audio/" + slug + ".mp3");
        a.preload = "none";
        this._cache[slug] = a;
      }
      return this._cache[slug];
    },

    stop: function () {
      clearTimeout(this._timer);
      if (this._cur) { try { this._cur.pause(); this._cur.currentTime = 0; } catch (e) {} }
      if (this._btn) { this._btn.classList.remove("arm", "playing"); this._btn = null; }
      this._cur = null;
    },

    /* rate < 1 plays slowed down with the pitch kept (the Phonological Processes Lab's
       slow button); a button asks for it with data-rate. */
    play: function (slug, btn, done, rate) {
      if (!this.has(slug)) { if (done) done(); return; }
      this.stop();
      var self = this;
      this._btn = btn || null;
      if (btn) btn.classList.add("arm");
      this._timer = setTimeout(function () {
        var a = self._node(slug);
        self._cur = a;
        if (btn) { btn.classList.remove("arm"); btn.classList.add("playing"); }
        a.currentTime = 0;
        a.preservesPitch = a.mozPreservesPitch = a.webkitPreservesPitch = true;
        a.playbackRate = rate || 1;
        a.onended = function () {
          if (btn) btn.classList.remove("playing");
          self._cur = null;
          if (done) done();
        };
        var p = a.play();
        if (p && p.catch) p.catch(function () {
          if (btn) btn.classList.remove("arm", "playing");
          if (done) done();
        });
      }, this.PREROLL);
    },

    /* Speaker control markup. Returns "" when the clip is not in this build. */
    btn: function (slug, label, cls) {
      if (!this.has(slug)) return "";
      return '<button type="button" class="spk ' + (cls || "") + '" data-play="' + slug + '" ' +
        'aria-label="Play ' + esc(label || slug) + '">' + w.ART.speaker() +
        (label ? "<span>" + esc(label) + "</span>" : "") + "</button>";
    }
  };

  /* Effect sounds, synthesized so the package carries no extra media. */
  var SFX = {
    ctx: null,
    _ctx: function () {
      if (!this.ctx) {
        var C = w.AudioContext || w.webkitAudioContext;
        if (!C) return null;
        try { this.ctx = new C(); } catch (e) { return null; }
      }
      if (this.ctx.state === "suspended") { try { this.ctx.resume(); } catch (e) {} }
      return this.ctx;
    },
    tone: function (freqs, dur, vol) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      var t0 = c.currentTime;
      freqs.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "sine";
        o.frequency.value = f;
        var st = t0 + i * (dur * 0.55);
        g.gain.setValueAtTime(0, st);
        g.gain.linearRampToValueAtTime(vol, st + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
        o.connect(g); g.connect(c.destination);
        o.start(st); o.stop(st + dur + 0.02);
      });
    },
    _noise: function (dur) {
      var c = this.ctx;
      var len = Math.max(1, Math.floor(c.sampleRate * dur));
      var buf = c.createBuffer(1, len, c.sampleRate);
      var ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      return buf;
    },

    /* A firework, synthesized: a soft pop of filtered noise, then a scatter
       of tiny high crackles. size scales loudness, depth and crackle count. */
    firework: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0);

      var src = c.createBufferSource();
      src.buffer = this._noise(0.2);
      var f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(Math.min(2400, 1300 * size), t0);
      f.frequency.exponentialRampToValueAtTime(220, t0 + 0.16);
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.min(0.26, 0.15 * size), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.19);
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start(t0); src.stop(t0 + 0.22);

      var nCr = Math.round(6 * size);
      for (var i = 0; i < nCr; i++) {
        var tt = t0 + 0.06 + Math.random() * 0.3 * size;
        var o = c.createOscillator(), og = c.createGain();
        o.type = "triangle";
        o.frequency.value = 1800 + Math.random() * 2600;
        og.gain.setValueAtTime(0.0001, tt);
        og.gain.exponentialRampToValueAtTime(0.03, tt + 0.006);
        og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.05);
        o.connect(og); og.connect(c.destination);
        o.start(tt); o.stop(tt + 0.06);
      }
    },

    /* Balloons, synthesized (Lab 3, window.LAB_FX = "balloons"): a soft
       rising whoosh as the bunch lifts off, a bright two-note ding on top,
       and for the bigger sizes a couple of pops. size scales all of it. */
    balloons: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0);

      // the lift: band-passed noise sweeping upward
      var wh = c.createBufferSource();
      wh.buffer = this._noise(0.6);
      var bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 2.2;
      bp.frequency.setValueAtTime(320, t0);
      bp.frequency.exponentialRampToValueAtTime(2200, t0 + 0.45);
      var wg = c.createGain();
      wg.gain.setValueAtTime(0.0001, t0);
      wg.gain.exponentialRampToValueAtTime(Math.min(0.1, 0.07 * size), t0 + 0.08);
      wg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      wh.connect(bp); bp.connect(wg); wg.connect(c.destination);
      wh.start(t0); wh.stop(t0 + 0.6);

      // the ding: two bright notes a fourth apart
      var notes = [880, 1175];
      for (var i = 0; i < notes.length; i++) {
        var tt = t0 + 0.12 + i * 0.13;
        var o = c.createOscillator(), og = c.createGain();
        o.type = "sine";
        o.frequency.value = notes[i];
        og.gain.setValueAtTime(0.0001, tt);
        og.gain.exponentialRampToValueAtTime(0.06, tt + 0.01);
        og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.32);
        o.connect(og); og.connect(c.destination);
        o.start(tt); o.stop(tt + 0.34);
      }

      // pops, for the finale sizes only
      if (size > 1.3) {
        for (var k = 0; k < 2; k++) {
          var pt = t0 + 0.5 + k * 0.23;
          var pop = c.createBufferSource();
          pop.buffer = this._noise(0.05);
          var pg = c.createGain();
          pg.gain.setValueAtTime(0.0001, pt);
          pg.gain.exponentialRampToValueAtTime(0.18, pt + 0.004);
          pg.gain.exponentialRampToValueAtTime(0.0001, pt + 0.05);
          pop.connect(pg); pg.connect(c.destination);
          pop.start(pt); pop.stop(pt + 0.06);
        }
      }
    },

    /* Confetti cannon, synthesized (Lab 4, window.LAB_FX = "confetti"): the
       soft thump of the cannon, a quick rising three-note flourish, and the
       rustle of paper coming back down. size scales all of it. */
    confetti: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0);

      // the thump: a short sine dropping in pitch
      var th = c.createOscillator(), tg = c.createGain();
      th.type = "sine";
      th.frequency.setValueAtTime(190, t0);
      th.frequency.exponentialRampToValueAtTime(70, t0 + 0.12);
      tg.gain.setValueAtTime(0.0001, t0);
      tg.gain.exponentialRampToValueAtTime(Math.min(0.2, 0.13 * size), t0 + 0.008);
      tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      th.connect(tg); tg.connect(c.destination);
      th.start(t0); th.stop(t0 + 0.18);

      // the flourish: three bright notes going up
      var notes = [784, 988, 1319];
      for (var i = 0; i < notes.length; i++) {
        var tt = t0 + 0.05 + i * 0.075;
        var o = c.createOscillator(), og = c.createGain();
        o.type = "triangle";
        o.frequency.value = notes[i];
        og.gain.setValueAtTime(0.0001, tt);
        og.gain.exponentialRampToValueAtTime(0.055, tt + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.26);
        o.connect(og); og.connect(c.destination);
        o.start(tt); o.stop(tt + 0.28);
      }

      // the rustle: high-passed noise that fades as the paper settles
      var len = Math.min(1.4, 0.7 * size);
      var ru = c.createBufferSource();
      ru.buffer = this._noise(len);
      var hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 5200;
      var rg = c.createGain();
      rg.gain.setValueAtTime(0.0001, t0 + 0.1);
      rg.gain.exponentialRampToValueAtTime(Math.min(0.05, 0.03 * size), t0 + 0.22);
      rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1 + len * 0.9);
      ru.connect(hp); hp.connect(rg); rg.connect(c.destination);
      ru.start(t0 + 0.1); ru.stop(t0 + 0.1 + len);
    },

    /* The dragon, synthesized (Lab 5, window.LAB_FX = "dragon"): the rush of
       air as it flies past, a quick run up the pentatonic scale on bright
       bells, and for the bigger sizes a soft gong underneath. */
    dragon: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0);

      // the fly-by: band-passed noise swelling and passing
      var wh = c.createBufferSource();
      wh.buffer = this._noise(0.7);
      var bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(500, t0);
      bp.frequency.exponentialRampToValueAtTime(1800, t0 + 0.35);
      bp.frequency.exponentialRampToValueAtTime(700, t0 + 0.65);
      var wg = c.createGain();
      wg.gain.setValueAtTime(0.0001, t0);
      wg.gain.exponentialRampToValueAtTime(Math.min(0.07, 0.05 * size), t0 + 0.25);
      wg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.68);
      wh.connect(bp); bp.connect(wg); wg.connect(c.destination);
      wh.start(t0); wh.stop(t0 + 0.7);

      // the bells: a pentatonic run, C D E G A
      var notes = size > 1.3 ? [1047, 1175, 1319, 1568, 1760, 2093] : [1047, 1319, 1568, 1760];
      for (var i = 0; i < notes.length; i++) {
        var tt = t0 + 0.04 + i * 0.07;
        var o = c.createOscillator(), og = c.createGain();
        o.type = "triangle";
        o.frequency.value = notes[i];
        og.gain.setValueAtTime(0.0001, tt);
        og.gain.exponentialRampToValueAtTime(0.045, tt + 0.006);
        og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.42);
        o.connect(og); og.connect(c.destination);
        o.start(tt); o.stop(tt + 0.44);
      }

      // the gong, for the finale sizes: a low tone with two inharmonic partials
      if (size > 1.3) {
        [[98, 0.12], [270, 0.035], [529, 0.02]].forEach(function (pp) {
          var go = c.createOscillator(), gg = c.createGain();
          go.type = "sine";
          go.frequency.setValueAtTime(pp[0] * 1.02, t0);
          go.frequency.exponentialRampToValueAtTime(pp[0], t0 + 0.4);
          gg.gain.setValueAtTime(0.0001, t0);
          gg.gain.exponentialRampToValueAtTime(pp[1], t0 + 0.02);
          gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
          go.connect(gg); gg.connect(c.destination);
          go.start(t0); go.stop(t0 + 2.3);
        });
      }
    },

    /* The snake, synthesized (Lab 6, window.LAB_FX = "snake"): a soft hiss as
       it sets off. Each apple it eats plays its own chomp (chomp, below),
       called from the animation at the moment of the bite. */
    snake: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0);
      var hs = c.createBufferSource();
      hs.buffer = this._noise(0.5);
      var hp = c.createBiquadFilter();
      hp.type = "bandpass";
      hp.Q.value = 2.2;
      hp.frequency.setValueAtTime(4200, t0);
      hp.frequency.linearRampToValueAtTime(5600, t0 + 0.4);
      var hg = c.createGain();
      hg.gain.setValueAtTime(0.0001, t0);
      hg.gain.exponentialRampToValueAtTime(Math.min(0.05, 0.032 * size), t0 + 0.08);
      hg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.46);
      hs.connect(hp); hp.connect(hg); hg.connect(c.destination);
      hs.start(t0); hs.stop(t0 + 0.5);
    },
    /* An 8-bit "nom": two quick square-wave notes, a fifth apart. Successive
       apples climb a pentatonic scale, the way an arcade score does. */
    chomp: function (k) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      var scale = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
      var f = scale[Math.min(scale.length - 1, k || 0)], t0 = c.currentTime;
      [[f, 0], [f * 1.5, 0.055]].forEach(function (n) {
        var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
        o.type = "square";
        o.frequency.value = n[0];
        lp.type = "lowpass";
        lp.frequency.value = 3200;
        g.gain.setValueAtTime(0.0001, t0 + n[1]);
        g.gain.exponentialRampToValueAtTime(0.03, t0 + n[1] + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + 0.07);
        o.connect(lp); lp.connect(g); g.connect(c.destination);
        o.start(t0 + n[1]); o.stop(t0 + n[1] + 0.08);
      });
    },

    /* Bats from a jack-o'-lantern, synthesized (Lab 7, window.LAB_FX = "bats"):
       the soft whoomp of the candle catching, a flutter of wings (short
       band-passed noise bursts), a few tiny squeaks, and a two-note tag a
       minor third apart. The finale sizes get more wings and squeaks and a
       little minor arpeggio instead of the tag. */
    bats: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0), big = size > 1.3;

      // the candle catching: a short low sine, dropping
      var th = c.createOscillator(), tg = c.createGain();
      th.type = "sine";
      th.frequency.setValueAtTime(150, t0);
      th.frequency.exponentialRampToValueAtTime(78, t0 + 0.2);
      tg.gain.setValueAtTime(0.0001, t0);
      tg.gain.exponentialRampToValueAtTime(Math.min(0.16, 0.1 * size), t0 + 0.012);
      tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      th.connect(tg); tg.connect(c.destination);
      th.start(t0); th.stop(t0 + 0.26);

      // the wings: a run of soft flaps
      var nFl = big ? 12 : 7;
      for (var i = 0; i < nFl; i++) {
        var ft = t0 + 0.1 + i * 0.052 + Math.random() * 0.012;
        var fl = c.createBufferSource();
        fl.buffer = this._noise(0.04);
        var bp = c.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 1.1;
        bp.frequency.value = 900 + Math.random() * 700;
        var fg = c.createGain();
        var pk = Math.min(0.06, 0.04 * size) * (1 - i / (nFl + 2));
        fg.gain.setValueAtTime(0.0001, ft);
        fg.gain.exponentialRampToValueAtTime(Math.max(0.0002, pk), ft + 0.006);
        fg.gain.exponentialRampToValueAtTime(0.0001, ft + 0.038);
        fl.connect(bp); bp.connect(fg); fg.connect(c.destination);
        fl.start(ft); fl.stop(ft + 0.045);
      }

      // the squeaks: tiny high chirps, sweeping up
      var nSq = big ? 4 : 2;
      for (var k = 0; k < nSq; k++) {
        var qt = t0 + 0.2 + k * 0.12 + Math.random() * 0.04;
        var sq = c.createOscillator(), sg = c.createGain();
        sq.type = "sine";
        sq.frequency.setValueAtTime(3000 + Math.random() * 500, qt);
        sq.frequency.exponentialRampToValueAtTime(4300 + Math.random() * 600, qt + 0.045);
        sg.gain.setValueAtTime(0.0001, qt);
        sg.gain.exponentialRampToValueAtTime(0.022, qt + 0.006);
        sg.gain.exponentialRampToValueAtTime(0.0001, qt + 0.06);
        sq.connect(sg); sg.connect(c.destination);
        sq.start(qt); sq.stop(qt + 0.07);
      }

      // the tag: spooky, but friendly
      var notes = big ? [440, 523, 659, 880] : [659, 784];
      for (var n = 0; n < notes.length; n++) {
        var nt = t0 + 0.06 + n * 0.1;
        var o = c.createOscillator(), og = c.createGain();
        o.type = "triangle";
        o.frequency.value = notes[n];
        og.gain.setValueAtTime(0.0001, nt);
        og.gain.exponentialRampToValueAtTime(0.045, nt + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0001, nt + 0.4);
        o.connect(og); og.connect(c.destination);
        o.start(nt); o.stop(nt + 0.42);
      }
    },

    /* Ghosts, synthesized (Lab 8, window.LAB_FX = "ghosts"): a soft, wobbling
       "ooo", two sine voices an octave apart gliding up and back down under a
       slow vibrato, and a faint shimmer of three high notes. */
    ghosts: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0), dur = 0.78;
      var lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1700;
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.min(0.08, 0.055 * size), t0 + 0.1);
      g.gain.setValueAtTime(Math.min(0.08, 0.055 * size), t0 + dur - 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      lp.connect(g); g.connect(c.destination);
      var vib = c.createOscillator(), vd = c.createGain();
      vib.frequency.value = 5.2;
      vd.gain.value = 9;
      vib.connect(vd);
      [[1, 0.6], [0.5, 0.4]].forEach(function (v) {
        var o = c.createOscillator(), og = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(330 * v[0], t0);
        o.frequency.exponentialRampToValueAtTime(494 * v[0], t0 + 0.32);
        o.frequency.exponentialRampToValueAtTime(370 * v[0], t0 + dur);
        vd.connect(o.frequency);
        og.gain.value = v[1];
        o.connect(og); og.connect(lp);
        o.start(t0); o.stop(t0 + dur + 0.05);
      });
      vib.start(t0); vib.stop(t0 + dur + 0.05);
      [1319, 1568, 1976].forEach(function (f, i) {
        var tt = t0 + 0.12 + i * 0.09, o = c.createOscillator(), og = c.createGain();
        o.type = "triangle";
        o.frequency.value = f;
        og.gain.setValueAtTime(0.0001, tt);
        og.gain.exponentialRampToValueAtTime(0.018, tt + 0.01);
        og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.35);
        o.connect(og); og.connect(c.destination);
        o.start(tt); o.stop(tt + 0.37);
      });
    },
    /* The skeletons' dance tune, an original little riff on a synthesized
       xylophone: each note a sine with a fast decay and a dry knock on top, in
       A minor, ending on a held A with a rattle. */
    bones: function (when) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      var t0 = c.currentTime + (when || 0), self = this;
      var tune = [[440, 1], [523, 1], [659, 1], [880, 1], [831, 1], [659, 1], [494, 1], [659, 1],
                  [440, 1], [523, 1], [659, 1], [784, 1], [698, 1], [587, 1], [523, 1], [440, 3]];
      var at = t0;
      tune.forEach(function (n) {
        var o = c.createOscillator(), og = c.createGain();
        o.type = "sine";
        o.frequency.value = n[0] * 2;
        og.gain.setValueAtTime(0.0001, at);
        og.gain.exponentialRampToValueAtTime(0.07, at + 0.004);
        og.gain.exponentialRampToValueAtTime(0.0001, at + 0.18 * Math.min(2, n[1]));
        o.connect(og); og.connect(c.destination);
        o.start(at); o.stop(at + 0.4);
        var k = c.createBufferSource();
        k.buffer = self._noise(0.02);
        var bp = c.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 6;
        bp.frequency.value = 2600;
        var kg = c.createGain();
        kg.gain.setValueAtTime(0.0001, at);
        kg.gain.exponentialRampToValueAtTime(0.05, at + 0.002);
        kg.gain.exponentialRampToValueAtTime(0.0001, at + 0.02);
        k.connect(bp); bp.connect(kg); kg.connect(c.destination);
        k.start(at); k.stop(at + 0.03);
        at += 0.13 * n[1];
      });
      // the rattle under the last note
      for (var r = 0; r < 7; r++) {
        var rt = at - 0.36 + r * 0.045, rb = c.createBufferSource(), rf = c.createBiquadFilter(), rg = c.createGain();
        rb.buffer = this._noise(0.02);
        rf.type = "bandpass"; rf.Q.value = 5; rf.frequency.value = 1800 + (r % 3) * 500;
        rg.gain.setValueAtTime(0.0001, rt);
        rg.gain.exponentialRampToValueAtTime(0.035, rt + 0.002);
        rg.gain.exponentialRampToValueAtTime(0.0001, rt + 0.02);
        rb.connect(rf); rf.connect(rg); rg.connect(c.destination);
        rb.start(rt); rb.stop(rt + 0.03);
      }
    },

    /* Peach blossom, synthesized (Lab 9, window.LAB_FX = "peach"): plucked
       notes in a pentatonic scale, like a zither, each with a slight bend into
       pitch, and a soft pop for the peach. */
    _pluck: function (c, at, f, vol, dec) {
      var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
      o.type = "triangle"; o2.type = "sine";
      o.frequency.setValueAtTime(f * 1.012, at);
      o.frequency.exponentialRampToValueAtTime(f, at + 0.05);
      o2.frequency.value = f * 2;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dec);
      g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(c.destination);
      o.start(at); o2.start(at); o.stop(at + dec + 0.02); o2.stop(at + dec + 0.02);
    },
    peach: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0), self = this;
      var notes = size > 1.3 ? [587, 659, 740, 880, 988] : [587, 740, 880];
      notes.forEach(function (f, i) { self._pluck(c, t0 + i * 0.075, f, 0.06, 0.45); });
      // the peach: a little rising pop
      var pt = t0 + 0.05, o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(380, pt);
      o.frequency.exponentialRampToValueAtTime(920, pt + 0.07);
      g.gain.setValueAtTime(0.0001, pt);
      g.gain.exponentialRampToValueAtTime(0.07, pt + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, pt + 0.12);
      o.connect(g); g.connect(c.destination);
      o.start(pt); o.stop(pt + 0.14);
    },
    /* The peach tree's growth, timed to the drawing (FX "tree"): the seed lands
       with a plip, the sprout comes up on two notes, the branches grow to a
       rising run of plucks, the blossoms open with high plinks, and the peaches
       ripen on a warm chord. */
    tree: function (when) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      var t0 = c.currentTime + (when || 0), self = this, i;
      var land = t0 + 0.45, o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(1300, land);
      o.frequency.exponentialRampToValueAtTime(520, land + 0.08);
      g.gain.setValueAtTime(0.0001, land);
      g.gain.exponentialRampToValueAtTime(0.07, land + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, land + 0.14);
      o.connect(g); g.connect(c.destination);
      o.start(land); o.stop(land + 0.16);
      this._pluck(c, t0 + 0.75, 440, 0.05, 0.5);
      this._pluck(c, t0 + 0.95, 587, 0.05, 0.6);
      var run = [294, 330, 370, 440, 494, 587, 659, 740, 880, 988, 1175, 1319];
      for (i = 0; i < run.length; i++) this._pluck(c, t0 + 1.25 + i * 0.2, run[i], 0.05, 0.55);
      var pent = [1175, 1319, 1480, 1760, 1976, 2349];
      for (i = 0; i < 10; i++) this._pluck(c, t0 + 3.65 + i * 0.11 + Math.random() * 0.04, pent[(i * 3) % pent.length], 0.028, 0.3);
      var ch = t0 + 4.85;
      [294, 370, 440, 587, 740].forEach(function (f, k) {
        var po = c.createOscillator(), pg = c.createGain();
        po.type = "triangle";
        po.frequency.value = f;
        pg.gain.setValueAtTime(0.0001, ch);
        pg.gain.exponentialRampToValueAtTime(0.035, ch + 0.12);
        pg.gain.exponentialRampToValueAtTime(0.0001, ch + 2.2);
        po.connect(pg); pg.connect(c.destination);
        po.start(ch); po.stop(ch + 2.3);
        self._pluck(c, ch + 0.05 + k * 0.09, f * 2, 0.04, 0.6);
      });
    },

    /* The egg and the chick, synthesized (Lab 10, window.LAB_FX = "egg"): a
       crack of the shell (short bright clicks of noise) and a "cheep cheep",
       two quick sine chirps that rise and fall. */
    _click: function (c, at, freq, vol) {
      var b = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      b.buffer = this._noise(0.03);
      f.type = "bandpass"; f.Q.value = 3; f.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
      b.connect(f); f.connect(g); g.connect(c.destination);
      b.start(at); b.stop(at + 0.04);
    },
    _cheep: function (c, at, vol) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(2600, at);
      o.frequency.exponentialRampToValueAtTime(3700, at + 0.035);
      o.frequency.exponentialRampToValueAtTime(2500, at + 0.09);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
      o.connect(g); g.connect(c.destination);
      o.start(at); o.stop(at + 0.12);
    },
    egg: function (when, size) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      size = size || 1;
      var t0 = c.currentTime + (when || 0);
      this._click(c, t0 + 0.28, 3200, 0.09);
      this._click(c, t0 + 0.36, 2600, 0.08);
      this._click(c, t0 + 0.46, 3600, 0.1);
      this._cheep(c, t0 + 0.6, 0.05);
      this._cheep(c, t0 + 0.74, 0.045);
      if (size > 1.3) this._cheep(c, t0 + 0.9, 0.04);
    },
    /* The bicycle bell: two metallic strikes, a high partial over an
       inharmonic one, each ringing out. */
    _bell: function (c, at) {
      [0, 0.16].forEach(function (d) {
        [[2640, 0.06], [4130, 0.03], [6050, 0.015]].forEach(function (p) {
          var o = c.createOscillator(), g = c.createGain();
          o.type = "sine";
          o.frequency.value = p[0];
          g.gain.setValueAtTime(0.0001, at + d);
          g.gain.exponentialRampToValueAtTime(p[1], at + d + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, at + d + 0.5);
          o.connect(g); g.connect(c.destination);
          o.start(at + d); o.stop(at + d + 0.52);
        });
      });
    },
    /* The finale, timed to the drawing (FX "hatch"): knocks as the big egg
       rocks, cracks, a pop as the top flies off, a cluck, the bell as the
       bicycle arrives, a boing for the hop, the freewheel ticking as the
       chicken rides off, and the bell once more on the way. */
    hatchRide: function (when) {
      if (!S.fx) return;
      var c = this._ctx();
      if (!c) return;
      var t0 = c.currentTime + (when || 0), self = this, i;
      [0.45, 0.72, 0.98].forEach(function (k) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(220, t0 + k);
        o.frequency.exponentialRampToValueAtTime(120, t0 + k + 0.08);
        g.gain.setValueAtTime(0.0001, t0 + k);
        g.gain.exponentialRampToValueAtTime(0.09, t0 + k + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + k + 0.1);
        o.connect(g); g.connect(c.destination);
        o.start(t0 + k); o.stop(t0 + k + 0.12);
      });
      [0.9, 1.06, 1.2, 1.28].forEach(function (k, j) { self._click(c, t0 + k, 2400 + j * 500, 0.11); });
      var pt = t0 + 1.36, po = c.createOscillator(), pg = c.createGain();
      po.type = "sine";
      po.frequency.setValueAtTime(300, pt);
      po.frequency.exponentialRampToValueAtTime(1100, pt + 0.09);
      pg.gain.setValueAtTime(0.0001, pt);
      pg.gain.exponentialRampToValueAtTime(0.1, pt + 0.01);
      pg.gain.exponentialRampToValueAtTime(0.0001, pt + 0.16);
      po.connect(pg); pg.connect(c.destination);
      po.start(pt); po.stop(pt + 0.18);
      // the cluck: a buzzy note through a vowel-like filter, twice
      [1.6, 1.82].forEach(function (k, j) {
        var o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), at = t0 + k;
        o.type = "sawtooth";
        o.frequency.setValueAtTime(460 + j * 60, at);
        o.frequency.exponentialRampToValueAtTime(720 + j * 60, at + 0.05);
        o.frequency.exponentialRampToValueAtTime(420, at + 0.15);
        f.type = "bandpass"; f.Q.value = 4; f.frequency.value = 1300;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.07, at + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.17);
        o.connect(f); f.connect(g); g.connect(c.destination);
        o.start(at); o.stop(at + 0.19);
      });
      this._bell(c, t0 + 2.56);
      var bt = t0 + 2.7, bo = c.createOscillator(), bg = c.createGain();
      bo.type = "triangle";
      bo.frequency.setValueAtTime(260, bt);
      bo.frequency.exponentialRampToValueAtTime(620, bt + 0.12);
      bo.frequency.exponentialRampToValueAtTime(380, bt + 0.3);
      bg.gain.setValueAtTime(0.0001, bt);
      bg.gain.exponentialRampToValueAtTime(0.06, bt + 0.02);
      bg.gain.exponentialRampToValueAtTime(0.0001, bt + 0.32);
      bo.connect(bg); bg.connect(c.destination);
      bo.start(bt); bo.stop(bt + 0.34);
      for (i = 0; i < 52; i++) this._click(c, t0 + 3.1 + i * 0.065, 5200, 0.018);
      this._bell(c, t0 + 4.6);
    },

    _hit: function (when, size) {
      if (w.LAB_FX === "egg") this.egg(when, size);
      else if (w.LAB_FX === "peach") this.peach(when, size);
      else if (w.LAB_FX === "ghosts") this.ghosts(when, size);
      else if (w.LAB_FX === "bats") this.bats(when, size);
      else if (w.LAB_FX === "balloons") this.balloons(when, size);
      else if (w.LAB_FX === "confetti") this.confetti(when, size);
      else if (w.LAB_FX === "dragon") this.dragon(when, size);
      else if (w.LAB_FX === "snake") this.snake(when, size);
      else this.firework(when, size);
    },
    good: function () { this._hit(0, 1); },
    bad: function () { this.tone([311, 262], 0.2, 0.055); },
    cheer: function () { this._hit(0, 1.25); this._hit(0.4, 1.05); },
    finale: function () {
      if (w.LAB_FX === "egg") { this.hatchRide(0); return; }
      if (w.LAB_FX === "peach") { this.tree(0); return; }
      if (w.LAB_FX === "ghosts") { this.bones(0.35); this.ghosts(0, 1.4); this.ghosts(2.6, 1.2); return; }
      this._hit(0, 1.6); this._hit(0.55, 1.4); this._hit(1.1, 1.5);
    }
  };

  /* ============================================================
     Effects: confetti and the gem that flies to the tally
     ============================================================ */
  var FX = {
    layer: null,

    /* Correct answers are celebrated with a firework: a shell of sparks with
       short trails and a ring flash, in a colour theme picked at random for
       every burst. All shells share one particle system and one draw loop, so
       the finale can fire several that overlap. */
    THEMES: [
      ["#FFD170", "#F0A92E", "#FFF3C9", "#E8843D"],
      ["#7BE0F0", "#1FB6D4", "#5B62D6", "#BFF1FA"],
      ["#F06292", "#D4529A", "#FFB3C9", "#FFE3EC"],
      ["#9C8AD6", "#5B62D6", "#C6C9F2", "#FFD170"],
      ["#EF6461", "#FF8A65", "#FFD54F", "#FFF59D"],
      ["#4FC3F7", "#90D8FA", "#FFFFFF", "#B39DDB"]
    ],

    _ps: [], _rings: [], _running: false,

    _host: function () {
      var host = this.layer || (this.layer = (function () {
        var c = el("canvas", "confetti");
        d.body.appendChild(c);
        return c;
      })());
      if (!this._running) { host.width = innerWidth; host.height = innerHeight; }
      return host;
    },

    /* One shell at a point. o: {count, scale, life, rainbow, spread} */
    _fire: function (ox, oy, o) {
      o = o || {};
      if (w.LAB_FX === "balloons") return this._release(ox, oy, o);
      if (w.LAB_FX === "confetti") return this._cannon(ox, oy, o);
      if (w.LAB_FX === "dragon") return this._dragon(ox, oy, o);
      if (w.LAB_FX === "snake") return this._snake(ox, oy, o);
      if (w.LAB_FX === "bats") return this._bats(ox, oy, o);
      if (w.LAB_FX === "ghosts") return this._ghosts(ox, oy, o);
      if (w.LAB_FX === "peach") return this._peach(ox, oy, o);
      if (w.LAB_FX === "egg") return this._egg(ox, oy, o);
      var n = o.count || 64;
      var cols = o.rainbow ? null : this.THEMES[Math.floor(Math.random() * this.THEMES.length)];
      var scale = o.scale || 1, life = o.life || 1;
      for (var i = 0; i < n; i++) {
        var a = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.12;
        var sp = (2.2 + Math.random() * 5.6) * scale;
        this._ps.push({
          x: ox, y: oy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2 * scale,
          w: (1.6 + Math.random() * 1.8) * Math.sqrt(scale),
          c: cols ? cols[i % cols.length]
            : "hsl(" + Math.round((i * 360) / n) + ",90%,62%)",
          tw: Math.random() * 6.28,
          life: (0.85 + Math.random() * 0.35) * life,
          decay: 0.016 / life
        });
      }
      this._rings.push({ x: ox, y: oy, r: 2, life: 1, c: cols ? cols[0] : "#FFFFFF",
        sp: 7.5 * scale });
      this._run();
    },

    /* A bunch of balloons (Lab 3, window.LAB_FX = "balloons") let go at the
       point: they rise out of the top of the screen, swaying, each on its
       own string. spread is how wide, in px, the bunch starts. */
    LATEX: ["#E23D5B", "#FF8FA3", "#FFD170", "#F0A92E", "#5B62D6", "#7BE0F0",
            "#4CAF7A", "#F06292", "#9C8AD6"],
    _release: function (ox, oy, o) {
      var n = o.count || 7, scale = o.scale || 1, life = o.life || 1;
      var spread = o.spread == null ? 90 : o.spread;
      for (var i = 0; i < n; i++) {
        this._ps.push({
          kind: "balloon",
          x: ox + (Math.random() - 0.5) * spread, y: oy + Math.random() * 30 * scale,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(1.6 + Math.random() * 1.6) * scale,
          r: (11 + Math.random() * 8) * Math.sqrt(scale),
          c: o.rainbow ? "hsl(" + Math.round((i * 360) / n) + ",85%,62%)"
            : this.LATEX[(i + Math.floor(Math.random() * 3)) % this.LATEX.length],
          tw: Math.random() * 6.28, sway: 0.05 + Math.random() * 0.04,
          delay: Math.random() * 14 * scale,
          life: (1.6 + Math.random() * 0.6) * life,
          decay: 0.006 / life
        });
      }
      this._run();
    },

    /* A confetti cannon (Lab 4, window.LAB_FX = "confetti") fired at the
       point: paper squares, strips and a few curls are shot upward in a fan,
       slow against the air, then tumble back down and off the bottom of the
       screen. aim is the centre of the fan in radians (default straight up),
       fan its half-width. */
    PAPER: ["#F2752B", "#FFB066", "#3E9A68", "#FFD170", "#5B62D6", "#F06292",
            "#7BE0F0", "#9C8AD6", "#E23D5B"],
    _cannon: function (ox, oy, o) {
      var n = o.count || 46, scale = o.scale || 1, life = o.life || 1;
      var aim = o.aim == null ? -Math.PI / 2 : o.aim, fan = o.fan == null ? 0.75 : o.fan;
      for (var i = 0; i < n; i++) {
        var a = aim + (Math.random() - 0.5) * 2 * fan;
        var sp = (7 + Math.random() * 9) * scale;
        var shape = i % 7 === 0 ? "curl" : (i % 3 === 0 ? "strip" : "square");
        this._ps.push({
          kind: "paper", shape: shape,
          x: ox, y: oy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          s: (5 + Math.random() * 4) * Math.sqrt(scale),
          c: o.rainbow ? "hsl(" + Math.round((i * 360) / n) + ",85%,60%)"
            : this.PAPER[Math.floor(Math.random() * this.PAPER.length)],
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
          tw: Math.random() * 6.28, flip: 0.12 + Math.random() * 0.16,
          life: (1.05 + Math.random() * 0.4) * life,
          decay: 0.009 / life
        });
      }
      this._run();
    },

    /* A Chinese dragon (Lab 5, window.LAB_FX = "dragon") chasing its pearl.
       o.path, when given, is the head's route as a function of time in
       frames; left out, the dragon rises from the point in a lazy S and
       leaves off the top of the screen. The body follows the head's own
       trail, so it undulates the way a dragon-dance dragon does. */
    DRAGON_COATS: [
      { body: "#D8342E", dark: "#9E1F1F", belly: "#F8D56B", fin: "#F39C1E", mane: "#F6B73C" },
      { body: "#2F9E7A", dark: "#1C6B52", belly: "#D4F0DE", fin: "#F2C94C", mane: "#8FD8B6" },
      { body: "#3C6ED6", dark: "#23489A", belly: "#CFE0FF", fin: "#FFD166", mane: "#9CC0FF" }
    ],
    _dragon: function (ox, oy, o) {
      var scale = o.scale || 1, life = (o.life || 1) * 150;
      var coat = o.coat != null ? this.DRAGON_COATS[o.coat] :
        this.DRAGON_COATS[Math.floor(Math.random() * this.DRAGON_COATS.length)];
      var side = o.side || (ox < innerWidth / 2 ? 1 : -1);
      var path = o.path || function (t) {
        return [ox + side * t * 2.3 + side * 30 * Math.sin(t * 0.1),
                oy + 34 - t * 6.0 + 9 * Math.sin(t * 0.07)];
      };
      var d = { kind: "dragon", t: 0, path: path, lead: o.lead == null ? 13 : o.lead, scale: scale,
        coat: coat, n: 24, gap: 2, hist: [], life: life, max: life, pearl: o.pearl !== false };
      // pre-roll the trail so the body is already stretched out behind the head
      for (var k = d.n * d.gap; k > 0; k--) d.hist.push(path(-k));
      this._ps.push(d);
      this._run();
    },

    _drawDragon: function (ctx, d) {
      var a = Math.max(0, Math.min(1, d.life / 30, d.t / 8));
      var H = d.hist, n = d.n, g = d.gap, sc = d.scale, C = d.coat;
      var head = H[H.length - 1];
      function at(k) { return H[Math.max(0, H.length - 1 - k * g)]; }
      ctx.save();
      ctx.globalAlpha = a;

      // the pearl it is chasing, with a flicker of flame round it
      if (d.pearl) {
        var pp = d.path(d.t + d.lead), pr = 7.5 * sc;
        var glow = ctx.createRadialGradient(pp[0], pp[1], 0, pp[0], pp[1], pr * 3);
        glow.addColorStop(0, "rgba(255,236,170,.75)"); glow.addColorStop(1, "rgba(255,236,170,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(pp[0], pp[1], pr * 3, 0, 6.29); ctx.fill();
        for (var f = 0; f < 5; f++) {
          var fa = d.t * 0.2 + f * 1.26, fl = pr * (1.5 + 0.35 * Math.sin(d.t * 0.5 + f));
          ctx.fillStyle = f % 2 ? "rgba(255,150,40,.8)" : "rgba(255,200,60,.8)";
          ctx.beginPath();
          ctx.moveTo(pp[0] + Math.cos(fa - 0.35) * pr * 0.8, pp[1] + Math.sin(fa - 0.35) * pr * 0.8);
          ctx.quadraticCurveTo(pp[0] + Math.cos(fa) * fl * 1.1, pp[1] + Math.sin(fa) * fl * 1.1,
            pp[0] + Math.cos(fa + 0.35) * pr * 0.8, pp[1] + Math.sin(fa + 0.35) * pr * 0.8);
          ctx.fill();
        }
        var pg = ctx.createRadialGradient(pp[0] - pr * 0.35, pp[1] - pr * 0.35, pr * 0.1, pp[0], pp[1], pr);
        pg.addColorStop(0, "#FFFFFF"); pg.addColorStop(0.55, "#F3ECFA"); pg.addColorStop(1, "#C9B3E2");
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(pp[0], pp[1], pr, 0, 6.29); ctx.fill();
      }

      // tail tuft
      var tl = at(n), tl2 = at(n - 2), tang = Math.atan2(tl[1] - tl2[1], tl[0] - tl2[0]);
      ctx.fillStyle = C.mane;
      for (var q = -1; q <= 1; q++) {
        var qa = tang + q * 0.45;
        ctx.beginPath();
        ctx.moveTo(tl[0], tl[1]);
        ctx.quadraticCurveTo(tl[0] + Math.cos(qa) * 12 * sc + Math.sin(d.t * 0.3 + q) * 3, tl[1] + Math.sin(qa) * 12 * sc,
          tl[0] + Math.cos(qa + 0.2) * 20 * sc, tl[1] + Math.sin(qa + 0.2) * 20 * sc);
        ctx.quadraticCurveTo(tl[0] + Math.cos(qa + 0.3) * 8 * sc, tl[1] + Math.sin(qa + 0.3) * 8 * sc, tl[0], tl[1]);
        ctx.fill();
      }

      // body, tail to neck: scales as overlapping discs, a belly stripe, a crest of fins
      for (var k = n; k >= 1; k--) {
        var p = at(k), q2 = at(k - 1);
        var ang = Math.atan2(q2[1] - p[1], q2[0] - p[0]);
        var taper = Math.pow(1 - k / (n + 3), 0.55);
        var r = (2.2 + 8.5 * taper) * sc;
        var nx = -Math.sin(ang), ny = Math.cos(ang);          // the belly side
        if (k % 2 === 0) {
          ctx.fillStyle = C.fin;
          ctx.beginPath();
          ctx.moveTo(p[0] - nx * r * 0.7 - Math.cos(ang) * r * 0.6, p[1] - ny * r * 0.7 - Math.sin(ang) * r * 0.6);
          ctx.lineTo(p[0] - nx * r * 1.75, p[1] - ny * r * 1.75);
          ctx.lineTo(p[0] - nx * r * 0.7 + Math.cos(ang) * r * 0.6, p[1] - ny * r * 0.7 + Math.sin(ang) * r * 0.6);
          ctx.fill();
        }
        ctx.fillStyle = k % 2 ? C.body : C.dark;
        ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.29); ctx.fill();
        ctx.fillStyle = C.belly;
        ctx.beginPath(); ctx.arc(p[0] + nx * r * 0.45, p[1] + ny * r * 0.45, r * 0.5, 0, 6.29); ctx.fill();
        if (k === 7 || k === 16) {                         // legs with little claws
          ctx.strokeStyle = C.dark; ctx.lineWidth = 2.4 * sc; ctx.lineCap = "round";
          var lx = p[0] + nx * r * 1.9 - Math.cos(ang) * r * 0.8, ly = p[1] + ny * r * 1.9 - Math.sin(ang) * r * 0.8;
          ctx.beginPath(); ctx.moveTo(p[0] + nx * r * 0.6, p[1] + ny * r * 0.6); ctx.lineTo(lx, ly); ctx.stroke();
          ctx.lineWidth = 1.4 * sc;
          for (var cl = -1; cl <= 1; cl++) {
            ctx.beginPath(); ctx.moveTo(lx, ly);
            ctx.lineTo(lx + Math.cos(ang + Math.PI + cl * 0.5) * 4 * sc, ly + Math.sin(ang + Math.PI + cl * 0.5) * 4 * sc);
            ctx.stroke();
          }
        }
      }

      // head, pointing along its heading
      var nk = at(1), hang = Math.atan2(head[1] - nk[1], head[0] - nk[0]);
      ctx.translate(head[0], head[1]);
      ctx.rotate(hang);
      if (Math.cos(hang) < 0) ctx.scale(1, -1);             // keep the dragon the right way up
      var s = sc;
      // mane behind the head
      ctx.fillStyle = C.mane;
      for (var m = 0; m < 4; m++) {
        ctx.beginPath();
        ctx.moveTo(-4 * s, -6 * s + m * 3 * s);
        ctx.quadraticCurveTo(-16 * s, -12 * s + m * 5 * s + Math.sin(d.t * 0.3 + m) * 2, -20 * s, -4 * s + m * 6 * s);
        ctx.lineTo(-6 * s, 2 * s + m * 2 * s);
        ctx.fill();
      }
      // horns
      ctx.strokeStyle = C.fin; ctx.lineWidth = 2.2 * s; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(2 * s, -8 * s); ctx.quadraticCurveTo(-4 * s, -18 * s, -12 * s, -19 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5 * s, -8 * s); ctx.quadraticCurveTo(2 * s, -17 * s, -5 * s, -21 * s); ctx.stroke();
      // skull and snout
      ctx.fillStyle = C.body;
      ctx.beginPath(); ctx.ellipse(2 * s, 0, 11 * s, 9 * s, 0, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.ellipse(13 * s, -1 * s, 9 * s, 5.5 * s, 0, 0, 6.29); ctx.fill();
      // open jaw
      ctx.fillStyle = C.dark;
      ctx.beginPath(); ctx.moveTo(6 * s, 3 * s); ctx.lineTo(21 * s, 3.5 * s); ctx.lineTo(18 * s, 7.5 * s);
      ctx.lineTo(6 * s, 7 * s); ctx.fill();
      ctx.fillStyle = C.belly;
      ctx.beginPath(); ctx.ellipse(11 * s, 6 * s, 7 * s, 2.2 * s, 0, 0, 6.29); ctx.fill();
      // nostril, eye, brow
      ctx.fillStyle = C.dark;
      ctx.beginPath(); ctx.arc(20 * s, -3 * s, 1.2 * s, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath(); ctx.arc(6 * s, -3.5 * s, 3.1 * s, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#23262D";
      ctx.beginPath(); ctx.arc(6.8 * s, -3.5 * s, 1.7 * s, 0, 6.29); ctx.fill();
      ctx.strokeStyle = C.fin; ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.moveTo(2 * s, -7 * s); ctx.quadraticCurveTo(7 * s, -9.5 * s, 12 * s, -6.5 * s); ctx.stroke();
      // whiskers, trailing and waving
      ctx.strokeStyle = C.mane; ctx.lineWidth = 1.3 * s;
      for (var wv = -1; wv <= 1; wv += 2) {
        ctx.beginPath(); ctx.moveTo(18 * s, wv * 1.5 * s);
        ctx.bezierCurveTo(10 * s, wv * 10 * s + Math.sin(d.t * 0.25) * 4 * s,
          -2 * s, wv * 4 * s - Math.sin(d.t * 0.25 + 1) * 5 * s, -14 * s, wv * 11 * s + Math.sin(d.t * 0.2) * 5 * s);
        ctx.stroke();
      }
      ctx.restore();
    },

    /* The game Snake (Lab 6, window.LAB_FX = "snake"). A snake on a grid
       slithers out of the point, turns at right angles to reach each apple
       that pops up near it, grows with every bite, then slides off the
       screen. o.apples, when given, places the apples and o.start the first
       cell (both in page px); o.exit names the way out ("up", "left", "right"). The
       body follows the head's own route cell by cell, drawn between cells so
       it glides rather than jumps. */
    SNAKE_COATS: [
      { body: "#4C7DF0", dark: "#2F57C6", belly: "#C9D9FF" },
      { body: "#43A85E", dark: "#2B7D43", belly: "#D2F1DB" },
      { body: "#9A68DC", dark: "#6B3FB2", belly: "#E6D6FB" }
    ],
    _snake: function (ox, oy, o) {
      var cell = Math.round(18 * Math.sqrt(o.scale || 1));
      var W = Math.floor(innerWidth / cell), H = Math.floor(innerHeight / cell);
      var gx = function (x) { return Math.round(x / cell); }, gy = gx;
      var start = o.start ? [gx(o.start[0]), gy(o.start[1])] : [gx(ox), gy(oy)];
      var pts = [];
      if (o.apples) {
        pts = o.apples.map(function (p) { return [gx(p[0]), gy(p[1])]; });
      } else {
        // scatter a few apples above and around the point, on screen, spaced apart
        var n = o.count || 3, tries = 0;
        var last = start;
        while (pts.length < n && tries++ < 200) {
          var c = [start[0] + Math.round((Math.random() - 0.5) * 22), start[1] - 3 - Math.round(Math.random() * 13)];
          c[0] = Math.max(2, Math.min(W - 3, c[0])); c[1] = Math.max(2, Math.min(H - 3, c[1]));
          var far = Math.abs(c[0] - last[0]) + Math.abs(c[1] - last[1]) >= 5;
          var free = pts.every(function (q) { return q[0] !== c[0] || q[1] !== c[1]; });
          if (far && free) { pts.push(c); last = c; }
        }
      }
      // the route, one grid step at a time, turning at right angles
      var route = [start.slice()], at = start.slice();
      function walk(tx, ty, xFirst) {
        function stepX() { while (at[0] !== tx) { at[0] += at[0] < tx ? 1 : -1; route.push(at.slice()); } }
        function stepY() { while (at[1] !== ty) { at[1] += at[1] < ty ? 1 : -1; route.push(at.slice()); } }
        if (xFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
      }
      var flip = Math.random() < 0.5;
      pts.forEach(function (p, k) { walk(p[0], p[1], (k % 2 === 0) === flip); });
      var len0 = o.len || 4, grow = o.grow || 2, total = len0 + grow * pts.length + 2;
      var exit = o.exit || "up";
      if (exit === "up") walk(at[0], -total - 2, false);
      else if (exit === "left") walk(-total - 2, at[1], true);
      else walk(W + total + 2, at[1], true);
      var apples = pts.map(function (p, k) {
        return { x: p[0], y: p[1], born: k * (o.stagger == null ? 4 : o.stagger), eaten: false };
      });
      var coat = o.coat != null ? this.SNAKE_COATS[o.coat] :
        this.SNAKE_COATS[Math.floor(Math.random() * this.SNAKE_COATS.length)];
      this._ps.push({ kind: "snake", route: route, pos: 0, speed: o.speed || 0.42, len: len0, grow: grow,
        apples: apples, cell: cell, coat: coat, t: 0, eaten: 0, wait: o.wait || 0 });
      this._run();
    },

    _drawApple: function (ctx, x, y, r, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "rgba(0,0,0,.12)";
      ctx.beginPath(); ctx.ellipse(0, r * 0.95, r * 0.8, r * 0.22, 0, 0, 6.29); ctx.fill();
      var g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
      g.addColorStop(0, "#FF8A73"); g.addColorStop(0.6, "#E0392B"); g.addColorStop(1, "#A8241A");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.62);
      ctx.bezierCurveTo(-r * 0.5, -r * 1.05, -r * 1.12, -r * 0.6, -r * 1.02, r * 0.05);
      ctx.bezierCurveTo(-r * 0.92, r * 0.72, -r * 0.42, r * 1.02, 0, r * 0.88);
      ctx.bezierCurveTo(r * 0.42, r * 1.02, r * 0.92, r * 0.72, r * 1.02, r * 0.05);
      ctx.bezierCurveTo(r * 1.12, -r * 0.6, r * 0.5, -r * 1.05, 0, -r * 0.62);
      ctx.fill();
      ctx.strokeStyle = "#7A4A22"; ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, -r * 0.58); ctx.quadraticCurveTo(r * 0.04, -r * 0.95, r * 0.22, -r * 1.2); ctx.stroke();
      ctx.fillStyle = "#3E9A68";
      ctx.beginPath();
      ctx.moveTo(r * 0.16, -r * 0.98);
      ctx.quadraticCurveTo(r * 0.5, -r * 1.55 + Math.sin(t * 0.12) * r * 0.06, r * 0.98, -r * 1.25);
      ctx.quadraticCurveTo(r * 0.6, -r * 0.82, r * 0.16, -r * 0.98);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.2, r * 0.16, r * 0.3, 0.35, 0, 6.29); ctx.fill();
      ctx.restore();
    },

    _drawSnake: function (ctx, p) {
      var R = p.route, cs = p.cell, C = p.coat;
      var i = Math.floor(p.pos), f = p.pos - i;
      function at(k) {           // where segment k (0 = head) is drawn: between two route cells
        var a = Math.max(0, i - k), b = Math.max(0, Math.min(R.length - 1, i - k + 1));
        var fa = i - k + 1 <= 0 ? 0 : f;
        return [(R[a][0] + (R[b][0] - R[a][0]) * fa + 0.5) * cs - cs / 2,
                (R[a][1] + (R[b][1] - R[a][1]) * fa + 0.5) * cs - cs / 2];
      }
      var n = Math.round(p.len);
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.t / 6);
      // body, tail first so the head sits on top; it tapers a little toward the tail
      for (var k = n; k >= 1; k--) {
        var q = at(k), s = cs * (0.86 - 0.22 * (k / (n + 1)));
        ctx.fillStyle = k % 3 === 0 ? C.dark : C.body;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(q[0] - s / 2, q[1] - s / 2, s, s, s * 0.32);
        else ctx.rect(q[0] - s / 2, q[1] - s / 2, s, s);
        ctx.fill();
        ctx.fillStyle = C.belly;
        ctx.globalAlpha = Math.min(1, p.t / 6) * 0.5;
        ctx.beginPath(); ctx.arc(q[0] - s * 0.16, q[1] - s * 0.16, s * 0.14, 0, 6.29); ctx.fill();
        ctx.globalAlpha = Math.min(1, p.t / 6);
      }
      // the head, looking the way it is going
      var h = at(0), nx = R[Math.min(R.length - 1, i + 1)], cu = R[i];
      var dx = nx[0] - cu[0], dy = nx[1] - cu[1];
      if (!dx && !dy) dy = -1;
      var hs = cs * 1.02;
      ctx.translate(h[0], h[1]);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = C.body;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-hs / 2, -hs / 2, hs, hs, [hs * 0.25, hs * 0.5, hs * 0.5, hs * 0.25]);
      else ctx.rect(-hs / 2, -hs / 2, hs, hs);
      ctx.fill();
      // the tongue flicks every so often
      if (p.t % 34 < 9) {
        ctx.strokeStyle = "#E23D5B"; ctx.lineWidth = Math.max(1.4, cs * 0.1); ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(hs * 0.45, 0); ctx.lineTo(hs * 0.85, 0);
        ctx.lineTo(hs * 1.02, -hs * 0.14); ctx.moveTo(hs * 0.85, 0); ctx.lineTo(hs * 1.02, hs * 0.14);
        ctx.stroke();
      }
      [-1, 1].forEach(function (sd) {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.arc(hs * 0.14, sd * hs * 0.22, hs * 0.16, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#23262D";
        ctx.beginPath(); ctx.arc(hs * 0.2, sd * hs * 0.22, hs * 0.085, 0, 6.29); ctx.fill();
      });
      ctx.restore();
    },

    /* Bats from a jack-o'-lantern (Lab 7, window.LAB_FX = "bats"). A pumpkin
       pops up at the point, its carved face lights, and the bats flap out of it
       one after another, fluttering upward in jittery paths until they leave
       the top of the screen. o.count bats; o.aim is the centre of their fan in
       radians (default straight up), o.fan its half-width; o.lscale sizes the
       lantern and o.hold keeps it lit longer; o.delay holds the first bat;
       o.speed scales how fast they leave. */
    BAT_COATS: [
      { body: "#3A2D52", wing: "#52407A", eye: "#FFD35C" },
      { body: "#2C2C3C", wing: "#45455E", eye: "#FFE08A" },
      { body: "#5A3F8C", wing: "#7356AA", eye: "#FFD35C" }
    ],
    _bats: function (ox, oy, o) {
      var n = o.count || 6, scale = o.scale || 1, life = o.life || 1;
      var aim = o.aim == null ? -Math.PI / 2 : o.aim, fan = o.fan == null ? 1.0 : o.fan;
      var lead = o.delay == null ? 10 : o.delay, stagger = o.stagger == null ? 3 : o.stagger;
      if (o.lantern !== false) {
        this._ps.push({ kind: "lantern", x: ox, y: oy, t: 0, s: (o.lscale || 1) * Math.sqrt(scale),
          life: lead + n * stagger + 46 + (o.hold || 0) });
      }
      for (var i = 0; i < n; i++) {
        var a = aim + (Math.random() - 0.5) * 2 * fan;
        var sp = (2.4 + Math.random() * 2.2) * scale * (o.speed || 1);
        this._ps.push({
          kind: "bat", x: ox + (Math.random() - 0.5) * 8, y: oy - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          s: (0.8 + Math.random() * 0.45) * Math.sqrt(scale), ph: Math.random() * 6.28,
          rate: 0.5 + Math.random() * 0.22, seed: Math.random() * 100,
          coat: this.BAT_COATS[(i + Math.floor(Math.random() * 3)) % this.BAT_COATS.length],
          delay: lead + i * stagger + Math.random() * 2, t: 0, life: 1, decay: 0.0035 / life,
          climb: 0.03 * (o.speed || 1)
        });
      }
      this._run();
    },

    _drawBat: function (ctx, b) {
      var u = 9.5 * b.s, f = Math.sin(b.ph);           // f: -1 wings down, 1 wings up
      var C = b.coat;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, b.t / 5, b.life * 3));
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.max(-0.45, Math.min(0.45, b.vx * 0.09)));
      // wings: a leading edge out to the tip, a scalloped trailing edge back
      ctx.fillStyle = C.wing;
      [-1, 1].forEach(function (sd) {
        var span = u * (2.5 - 0.45 * Math.abs(f)), tipY = -u * 1.15 * f - u * 0.15;
        ctx.beginPath();
        ctx.moveTo(sd * u * 0.3, -u * 0.35);
        ctx.quadraticCurveTo(sd * span * 0.5, tipY - u * 0.55, sd * span, tipY);
        ctx.quadraticCurveTo(sd * span * 0.95, tipY * 0.45 + u * 0.35, sd * span * 0.74, tipY * 0.45 + u * 0.5);
        ctx.quadraticCurveTo(sd * span * 0.64, tipY * 0.3 + u * 0.2, sd * span * 0.47, tipY * 0.25 + u * 0.55);
        ctx.quadraticCurveTo(sd * span * 0.36, tipY * 0.1 + u * 0.25, sd * u * 0.3, u * 0.4);
        ctx.closePath();
        ctx.fill();
      });
      // body, head and ears
      ctx.fillStyle = C.body;
      ctx.beginPath(); ctx.ellipse(0, u * 0.08, u * 0.5, u * 0.68, 0, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -u * 0.55, u * 0.46, 0, 6.29); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-u * 0.42, -u * 0.66); ctx.lineTo(-u * 0.36, -u * 1.22); ctx.lineTo(-u * 0.08, -u * 0.88);
      ctx.moveTo(u * 0.42, -u * 0.66); ctx.lineTo(u * 0.36, -u * 1.22); ctx.lineTo(u * 0.08, -u * 0.88);
      ctx.fill();
      // eyes and two tiny fangs
      [-1, 1].forEach(function (sd) {
        ctx.fillStyle = C.eye;
        ctx.beginPath(); ctx.arc(sd * u * 0.18, -u * 0.6, u * 0.13, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#23262D";
        ctx.beginPath(); ctx.arc(sd * u * 0.18, -u * 0.58, u * 0.065, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.moveTo(sd * u * 0.04, -u * 0.36); ctx.lineTo(sd * u * 0.16, -u * 0.36); ctx.lineTo(sd * u * 0.1, -u * 0.22);
        ctx.fill();
      });
      ctx.restore();
    },

    /* The jack-o'-lantern: pops up, its face lights and flickers, then it
       fades once its bats are out. */
    _drawLantern: function (ctx, p) {
      var pop = Math.min(1, p.t / 9);
      var sc = p.s * (pop < 1 ? 0.3 + pop * 0.85 : 1 + 0.025 * Math.sin(p.t * 0.25));
      var r = 20 * sc, lit = Math.max(0, Math.min(1, (p.t - 7) / 8));
      var flick = 0.8 + 0.2 * Math.sin(p.t * 0.9) * Math.sin(p.t * 0.37 + 1);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 18, p.t / 4));
      ctx.translate(p.x, p.y);
      if (lit > 0) {
        var g = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.8);
        g.addColorStop(0, "rgba(255,196,80," + (0.5 * lit * flick).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,196,80,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r * 2.8, 0, 6.29); ctx.fill();
      }
      // five lobes, darkest at the sides, each with a thin darker edge so the
      // pumpkin stands out on an orange button
      ctx.strokeStyle = "#A84E06"; ctx.lineWidth = Math.max(1, r * 0.06);
      [[-0.62, 0.5, "#D9650A"], [0.62, 0.5, "#D9650A"], [-0.32, 0.6, "#EE7C14"], [0.32, 0.6, "#EE7C14"],
       [0, 0.56, "#F59A2E"]].forEach(function (l) {
        ctx.fillStyle = l[2];
        ctx.beginPath(); ctx.ellipse(l[0] * r, r * 0.05, l[1] * r, r * 0.86, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      // stem
      ctx.fillStyle = "#6A5A24";
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, -r * 0.72); ctx.lineTo(-r * 0.08, -r * 1.12); ctx.lineTo(r * 0.16, -r * 1.16);
      ctx.lineTo(r * 0.12, -r * 0.72); ctx.fill();
      // the face: carved dark, then lit from inside
      function face() {
        ctx.beginPath();
        ctx.moveTo(-r * 0.52, -r * 0.08); ctx.lineTo(-r * 0.32, -r * 0.42); ctx.lineTo(-r * 0.14, -r * 0.08);
        ctx.moveTo(r * 0.52, -r * 0.08); ctx.lineTo(r * 0.32, -r * 0.42); ctx.lineTo(r * 0.14, -r * 0.08);
        ctx.moveTo(-r * 0.09, r * 0.12); ctx.lineTo(0, -r * 0.02); ctx.lineTo(r * 0.09, r * 0.12);
        ctx.moveTo(-r * 0.6, r * 0.24);
        ctx.quadraticCurveTo(0, r * 0.82, r * 0.6, r * 0.24);
        ctx.lineTo(r * 0.38, r * 0.34); ctx.lineTo(r * 0.27, r * 0.24); ctx.lineTo(r * 0.12, r * 0.38);
        ctx.lineTo(0, r * 0.26); ctx.lineTo(-r * 0.12, r * 0.38); ctx.lineTo(-r * 0.27, r * 0.24);
        ctx.lineTo(-r * 0.38, r * 0.34); ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#4A2408"; face();
      if (lit > 0) {
        ctx.globalAlpha *= lit * flick;
        ctx.fillStyle = "#FFD35C"; face();
      }
      ctx.restore();
    },

    /* The harvest moon behind the finale's flock: it rises a little as it
       fades in, holds, and fades out. */
    _drawMoon: function (ctx, p) {
      var a = Math.max(0, Math.min(1, p.t / 30, p.life / 40));
      var ease = 1 - Math.pow(1 - Math.min(1, p.t / 45), 3);
      var y = p.y + 50 * (1 - ease), R = p.r;
      ctx.save();
      ctx.globalAlpha = a;
      var halo = ctx.createRadialGradient(p.x, y, R * 0.8, p.x, y, R * 2.2);
      halo.addColorStop(0, "rgba(255,232,150,.45)"); halo.addColorStop(1, "rgba(255,232,150,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(p.x, y, R * 2.2, 0, 6.29); ctx.fill();
      var g = ctx.createRadialGradient(p.x - R * 0.3, y - R * 0.3, R * 0.1, p.x, y, R);
      g.addColorStop(0, "#FFF8D6"); g.addColorStop(1, "#FFD978");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, y, R, 0, 6.29); ctx.fill();
      ctx.fillStyle = "rgba(214,170,70,.28)";
      [[-0.32, -0.18, 0.2], [0.28, 0.22, 0.14], [0.12, -0.42, 0.1], [-0.12, 0.42, 0.09]].forEach(function (k) {
        ctx.beginPath(); ctx.arc(p.x + k[0] * R, y + k[1] * R, k[2] * R, 0, 6.29); ctx.fill();
      });
      ctx.restore();
    },

    /* Ghosts (Lab 8, window.LAB_FX = "ghosts"). Two or three friendly ghosts
       rise out of the point, swaying, their hems rippling, and fade near the
       top; the first one says "boo!". o.count ghosts; o.orbit, when given
       ({cx, cy, R}), sends them circling that point instead (the finale), then
       up and away. */
    _ghosts: function (ox, oy, o) {
      var n = o.count || 3, scale = o.scale || 1, life = (o.life || 1) * 150;
      for (var i = 0; i < n; i++) {
        var g = {
          kind: "ghost", t: 0, x: ox + (i - (n - 1) / 2) * 30 * scale + (Math.random() - 0.5) * 10,
          y: oy - 8, vy: -(1.1 + Math.random() * 0.6) * scale, r: (13 + Math.random() * 5) * Math.sqrt(scale),
          ph: Math.random() * 6.28, sway: 0.7 + Math.random() * 0.6, delay: i * 7 + (o.delay || 0),
          life: life, max: life, boo: i === 0 && o.boo !== false, tint: i % 3
        };
        if (o.orbit) {
          g.orbit = o.orbit;
          g.ang = (i / n) * Math.PI * 2;
          g.delay = (o.delay || 0) + i * 3;
          g.boo = i === 0;
        }
        this._ps.push(g);
      }
      this._run();
    },
    GHOST_TINT: ["#FFFFFF", "#F3F0FF", "#EEF7FF"],
    _drawGhost: function (ctx, g) {
      var r = g.r, a = Math.max(0, Math.min(1, g.t / 8, g.life / 30));
      var hem = 1.35 * r, tilt = Math.sin(g.t * 0.08 + g.ph) * 0.12;
      ctx.save();
      ctx.globalAlpha = a * 0.96;
      ctx.translate(g.x, g.y);
      ctx.rotate(tilt);
      // soft glow
      var gl = ctx.createRadialGradient(0, r * 0.3, r * 0.4, 0, r * 0.3, r * 2.2);
      gl.addColorStop(0, "rgba(190,200,255,.35)"); gl.addColorStop(1, "rgba(190,200,255,0)");
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, r * 0.3, r * 2.2, 0, 6.29); ctx.fill();
      // body: a round head, straight sides, a hem of three rippling scallops
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.arc(0, 0, r, Math.PI, 0);
      ctx.lineTo(r, hem);
      var k, xs = [r, r / 3, -r / 3, -r];
      for (k = 0; k < 3; k++) {
        var x0 = xs[k], x1 = xs[k + 1], mid = (x0 + x1) / 2;
        var dip = r * (0.32 + 0.1 * Math.sin(g.t * 0.22 + k * 1.7 + g.ph));
        ctx.quadraticCurveTo(mid, hem + dip, x1, hem);
      }
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.fillStyle = this.GHOST_TINT[g.tint];
      ctx.fill();
      ctx.strokeStyle = "#8A93B8";
      ctx.lineWidth = Math.max(1.2, r * 0.09);
      ctx.stroke();
      // eyes that blink now and then, rosy cheeks, a little round mouth
      var blink = (g.t + g.ph * 20) % 90 < 5 ? 0.15 : 1;
      ctx.fillStyle = "#2B2740";
      [-1, 1].forEach(function (sd) {
        ctx.beginPath(); ctx.ellipse(sd * r * 0.36, -r * 0.08, r * 0.13, r * 0.19 * blink, 0, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = "rgba(255,140,170,.45)";
      [-1, 1].forEach(function (sd) {
        ctx.beginPath(); ctx.ellipse(sd * r * 0.58, r * 0.2, r * 0.13, r * 0.08, 0, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = "#2B2740";
      ctx.beginPath(); ctx.ellipse(0, r * 0.32, r * 0.1, r * 0.13 + r * 0.04 * Math.sin(g.t * 0.3), 0, 0, 6.29); ctx.fill();
      ctx.restore();
      // "boo!" for a moment, beside the first ghost
      if (g.boo && g.t > 10 && g.t < 70) {
        var ba = Math.min(1, (g.t - 10) / 8, (70 - g.t) / 10) * a;
        ctx.save();
        ctx.globalAlpha = ba;
        ctx.font = "800 " + Math.round(r * 0.95) + 'px -apple-system,"Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = "#5B4FA8";
        ctx.textAlign = "left";
        ctx.fillText("boo!", g.x + r * 1.1, g.y - r * 0.7);
        ctx.restore();
      }
    },

    /* A cartoon skeleton for the finale, dancing: it bobs, swings its arms,
       kicks, tilts its skull and chatters its jaw. Built from rounded bones,
       ivory with a dark outline so it reads on the light page. p.x is where
       it stands, p.base the floor line, p.s its size; it rises from below the
       floor, dances, and sinks back. */
    _drawSkeleton: function (ctx, p) {
      var s = p.s, t = p.t, ph = p.ph;
      function ease(u) { u = Math.max(0, Math.min(1, u)); return 1 - Math.pow(1 - u, 3); }
      var lift = ease(t / 40) * ease(p.life / 35);      // up out of the floor, and back down at the end
      var beat = t * 0.19 + ph;
      var bob = Math.abs(Math.sin(beat)) * 9 * s;
      var BONE = "#FBF8EF", LINE = "#4A4458";
      ctx.save();
      ctx.translate(p.x, p.base + (1 - lift) * 230 * s - bob);
      ctx.globalAlpha = Math.max(0, Math.min(1, lift * 1.5));
      function bone(x1, y1, x2, y2, wdt) {
        ctx.lineCap = "round";
        ctx.strokeStyle = LINE; ctx.lineWidth = (wdt + 3.2) * s;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = BONE; ctx.lineWidth = wdt * s;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        [[x1, y1], [x2, y2]].forEach(function (q) {
          ctx.fillStyle = BONE; ctx.strokeStyle = LINE; ctx.lineWidth = 1.6 * s;
          ctx.beginPath(); ctx.arc(q[0], q[1], wdt * 0.62 * s, 0, 6.29); ctx.fill(); ctx.stroke();
        });
      }
      function limb(x, y, a1, l1, a2, l2, wdt) {     // two bones from a joint, angles from straight down
        var ex = x + Math.sin(a1) * l1 * s, ey = y + Math.cos(a1) * l1 * s;
        var hx = ex + Math.sin(a1 + a2) * l2 * s, hy = ey + Math.cos(a1 + a2) * l2 * s;
        bone(x, y, ex, ey, wdt); bone(ex, ey, hx, hy, wdt * 0.85);
        return [hx, hy];
      }
      var swing = Math.sin(beat * 2), kick = Math.sin(beat * 2 + 1.2);
      // legs (drawn first, behind the pelvis)
      [-1, 1].forEach(function (sd) {
        var k = sd < 0 ? kick : -kick;
        var f = limb(sd * 10 * s, -4 * s, sd * 0.12 + k * 0.45, 42, -Math.max(0, k) * 0.9, 40, 7);
        ctx.fillStyle = BONE; ctx.strokeStyle = LINE; ctx.lineWidth = 1.8 * s;
        ctx.beginPath(); ctx.ellipse(f[0] + sd * 6 * s, f[1] + 2 * s, 9 * s, 4.5 * s, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      // pelvis
      ctx.fillStyle = BONE; ctx.strokeStyle = LINE; ctx.lineWidth = 2 * s;
      [-1, 1].forEach(function (sd) {
        ctx.beginPath(); ctx.ellipse(sd * 9 * s, -8 * s, 11 * s, 9 * s, sd * 0.4, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      // spine, vertebra by vertebra
      for (var v = 0; v < 7; v++) {
        var vy = (-20 - v * 12) * s, vx = Math.sin(beat + v * 0.25) * 2.2 * s;
        ctx.beginPath(); ctx.ellipse(vx, vy, 5.5 * s, 4.4 * s, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      }
      // ribs, three pairs
      ctx.lineCap = "round";
      [[-82, 26], [-70, 29], [-58, 24]].forEach(function (rb) {
        [-1, 1].forEach(function (sd) {
          var y = rb[0] * s, wd = rb[1] * s;
          ctx.strokeStyle = LINE; ctx.lineWidth = 6.4 * s;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(sd * wd, y - 4 * s, sd * wd * 0.82, y + 9 * s); ctx.stroke();
          ctx.strokeStyle = BONE; ctx.lineWidth = 3.4 * s;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(sd * wd, y - 4 * s, sd * wd * 0.82, y + 9 * s); ctx.stroke();
        });
      });
      // arms: up and down in turn, elbows bent
      [-1, 1].forEach(function (sd) {
        var up = sd < 0 ? swing : -swing;
        var hnd = limb(sd * 22 * s, -90 * s, sd * (0.5 + 1.6 * (up * 0.5 + 0.5)), 34, sd * 0.7, 30, 6);
        ctx.fillStyle = BONE; ctx.strokeStyle = LINE; ctx.lineWidth = 1.6 * s;
        ctx.beginPath(); ctx.arc(hnd[0], hnd[1], 5.5 * s, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      // collarbone
      bone(-22 * s, -91 * s, 22 * s, -91 * s, 5);
      // skull, tilting with the beat, the jaw chattering
      ctx.save();
      ctx.translate(Math.sin(beat) * 3 * s, -122 * s);
      ctx.rotate(Math.sin(beat) * 0.18);
      var jaw = (Math.sin(t * 0.7 + ph) > 0 ? 1 : 0) * 5 * s;
      ctx.fillStyle = BONE; ctx.strokeStyle = LINE; ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-11 * s, 12 * s + jaw, 22 * s, 10 * s, 4 * s); else ctx.rect(-11 * s, 12 * s + jaw, 22 * s, 10 * s);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 20 * s, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.fillStyle = BONE; ctx.beginPath(); ctx.ellipse(0, 12 * s, 13 * s, 6 * s, 0, 0, 6.29); ctx.fill();
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.4 * s;
      for (var tth = -2; tth <= 2; tth++) {
        ctx.beginPath(); ctx.moveTo(tth * 4 * s, 13 * s); ctx.lineTo(tth * 4 * s, 18 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tth * 4 * s, 13 * s + jaw + 3 * s); ctx.lineTo(tth * 4 * s, 17 * s + jaw + 3 * s); ctx.stroke();
      }
      ctx.fillStyle = "#2B2740";
      [-1, 1].forEach(function (sd) {
        ctx.beginPath(); ctx.ellipse(sd * 7.5 * s, -2 * s, 5.6 * s, 6.6 * s, sd * -0.2, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = "#FFE08A";
      [-1, 1].forEach(function (sd) {
        ctx.beginPath(); ctx.arc(sd * 7.5 * s + 1.4 * s, -3 * s, 1.6 * s, 0, 6.29); ctx.fill();
      });
      ctx.fillStyle = "#2B2740";
      ctx.beginPath(); ctx.moveTo(0, 4 * s); ctx.lineTo(-3 * s, 9 * s); ctx.lineTo(3 * s, 9 * s); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.restore();
    },

    /* Peach blossom (Lab 9, window.LAB_FX = "peach"). A correct answer sends a
       peach bouncing up out of the point in a puff of blossom: five-petalled
       flowers fly out, spin and fade, and loose petals flutter down. o.count
       blossoms; o.peach false leaves the peach out. */
    _peach: function (ox, oy, o) {
      var n = o.count || 5, scale = o.scale || 1, life = o.life || 1, i;
      for (i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.3, sp = (2.6 + Math.random() * 2.2) * scale;
        this._ps.push({ kind: "blossom", x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          r: (6.5 + Math.random() * 2.5) * Math.sqrt(scale), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.12,
          t: 0, life: 62 * life, max: 62 * life });
      }
      for (i = 0; i < (o.petals || 9); i++) {
        this._ps.push({ kind: "petal", x: ox + (Math.random() - 0.5) * 20, y: oy, vx: (Math.random() - 0.5) * 5 * scale,
          vy: -(2 + Math.random() * 3.5) * scale, s: (3.6 + Math.random() * 2.2) * Math.sqrt(scale),
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.1, fl: Math.random() * 6.28,
          t: 0, life: 120 * life, max: 120 * life, delay: Math.random() * 6 });
      }
      if (o.peach !== false) {
        this._ps.push({ kind: "peachf", x: ox, y: oy, vx: (Math.random() - 0.5) * 1.4, vy: -6.6 * Math.sqrt(scale),
          r: 13 * Math.sqrt(scale), rot: 0, vr: (Math.random() - 0.5) * 0.05, t: 0, life: 78 * life, max: 78 * life });
      }
      this._run();
    },
    BLOSSOM: ["#FFC9D8", "#FFB3C9", "#FFD6E2"],
    _drawBlossom: function (ctx, x, y, r, rot, alpha, k) {
      if (r <= 0.3) return;
      ctx.save();
      ctx.globalAlpha *= alpha;                       // inside the tree, its fade still applies
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = this.BLOSSOM[(k || 0) % 3];
      ctx.strokeStyle = "rgba(214,84,124,.55)";
      ctx.lineWidth = Math.max(0.6, r * 0.08);
      for (var i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate(i * 1.2566);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-r * 0.62, -r * 0.35, -r * 0.5, -r * 1.05, -r * 0.1, -r * 1.02);
        ctx.lineTo(0, -r * 0.88);                       // the notch at the petal's tip
        ctx.lineTo(r * 0.1, -r * 1.02);
        ctx.bezierCurveTo(r * 0.5, -r * 1.05, r * 0.62, -r * 0.35, 0, 0);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "#E8577F";
      ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#FFD45C";
      for (var j = 0; j < 5; j++) {
        var a = j * 1.2566 + 0.63;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.07 + 0.4, 0, 6.29); ctx.fill();
      }
      ctx.restore();
    },
    _drawPetal: function (ctx, p) {
      var a = Math.max(0, Math.min(1, p.t / 6, p.life / 30));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.fl), 1);                     // the flutter: the petal turns edge-on and back
      ctx.fillStyle = "#FFBACB";
      ctx.beginPath();
      ctx.moveTo(0, p.s);
      ctx.bezierCurveTo(-p.s * 0.9, p.s * 0.3, -p.s * 0.6, -p.s, 0, -p.s * 0.75);
      ctx.bezierCurveTo(p.s * 0.6, -p.s, p.s * 0.9, p.s * 0.3, 0, p.s);
      ctx.fill();
      ctx.restore();
    },
    /* The peach, drawn from the gem's own outline so the two always match. */
    _peachPaths: null,
    _drawPeach: function (ctx, x, y, r, rot, alpha) {
      if (r <= 0.3 || !w.Path2D) return;
      var P = this._peachPaths || (this._peachPaths = {
        body: new Path2D("M18 8.2 C15.8 6.2 9.6 5.6 7 10.4 C5 14.4 6 20.6 10.4 24.4 C12.6 26.3 15.4 27.4 18 27.6 " +
          "C20.6 27.4 23.4 26.3 25.6 24.4 C30 20.6 31 14.4 29 10.4 C26.4 5.6 20.2 6.2 18 8.2 Z"),
        blush: new Path2D("M18 8.2 C20.2 6.2 26.4 5.6 29 10.4 C31 14.4 30 20.6 25.6 24.4 C23.4 26.3 20.6 27.4 18 27.6 " +
          "C22.6 23.2 23.4 13.6 18 8.2 Z"),
        crease: new Path2D("M18 8.6 C15.4 12.4 15.2 19.2 17.4 26.6"),
        stem: new Path2D("M18 8.8 C17.8 6.8 18.2 5 19.2 3.6"),
        leaf: new Path2D("M18.8 5.4 C20.4 2.2 25.2 1.2 28.2 2.6 C26.4 6 22 7.4 18.8 5.4 Z")
      });
      var s = r / 11;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      ctx.translate(-18, -17);
      var g = ctx.createLinearGradient(0, 6, 0, 28);
      g.addColorStop(0, "#FFD3A6"); g.addColorStop(1, "#F7946B");
      ctx.fillStyle = g; ctx.fill(P.body);
      ctx.fillStyle = "rgba(210,71,90,.34)"; ctx.fill(P.blush);
      ctx.strokeStyle = "rgba(178,58,70,.55)"; ctx.lineWidth = 1; ctx.lineCap = "round"; ctx.stroke(P.crease);
      ctx.strokeStyle = "rgba(178,58,70,.5)"; ctx.lineWidth = 0.9; ctx.stroke(P.body);
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.beginPath(); ctx.ellipse(11.8, 13.2, 2.2, 3.8, 0.38, 0, 6.29); ctx.fill();
      ctx.strokeStyle = "#7A4A22"; ctx.lineWidth = 1.5; ctx.stroke(P.stem);
      ctx.fillStyle = "#4FA060"; ctx.fill(P.leaf);
      ctx.restore();
    },

    /* The finale: a peach tree grows on the bottom edge of the screen. A peach
       stone drops onto a mound of earth, a sprout comes up and opens its first
       two leaves, the trunk and branches grow out, leaves unfurl, blossom opens
       at the tips, and the blossoms turn into peaches while petals drift down;
       then the tree fades. The shape is built once, from a fixed seed, so it is
       the same tree every time. u is one hundredth of its size. */
    _buildTree: function (cx, gy, u) {
      var seed = 9;
      function rnd() {                                  // mulberry32
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
      var T = { branches: [], leaves: [], tips: [], cx: cx, gy: gy, u: u };
      function grow(x, y, ang, len, wid, depth, t0) {
        ang = Math.max(-Math.PI + 0.3, Math.min(-0.3, ang));
        var x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
        var bend = (rnd() - 0.5) * 0.28 * len;
        var b = { x0: x, y0: y, x1: x1, y1: y1, cx: (x + x1) / 2 + Math.cos(ang + 1.5708) * bend,
          cy: (y + y1) / 2 + Math.sin(ang + 1.5708) * bend, w0: wid, w1: wid * 0.66, depth: depth,
          t0: t0, t1: t0 + 24 + 8 * (4 - depth), ang: ang };
        T.branches.push(b);
        if (depth >= 2) {
          for (var l = 0; l < 3; l++) {
            var f = 0.35 + l * 0.27 + rnd() * 0.08, side = l % 2 ? 1 : -1;
            T.leaves.push({ b: b, f: f, ang: ang + side * (0.75 + rnd() * 0.4), len: (4.4 + rnd() * 1.8) * u,
              t: b.t0 + (b.t1 - b.t0) * f + 8 + rnd() * 26, k: Math.floor(rnd() * 2) });
          }
        }
        if (depth >= 4) { T.tips.push({ x: x1, y: y1, ang: ang, t: b.t1 }); return; }
        var kids = depth === 0 ? 3 : rnd() < 0.55 ? 2 : 3;
        var fan = depth === 0 ? 0.62 : 0.5 + rnd() * 0.16;
        for (var j = 0; j < kids; j++) {
          var ca = ang + (j - (kids - 1) / 2) * fan + (rnd() - 0.5) * 0.18;
          grow(x1, y1, ca, len * (0.7 + rnd() * 0.16), wid * 0.64, depth + 1, b.t1 - 6);
        }
        if (depth === 1 || depth === 2) T.tips.push({ x: x1, y: y1, ang: ang, t: b.t1, inner: true });
      }
      grow(cx, gy, -Math.PI / 2 + 0.04, 30 * u, 6.2 * u, 0, 78);
      // blossom at every outer tip and at some forks; about half of them set fruit
      T.flowers = T.tips.filter(function (tp) { return !tp.inner || rnd() < 0.5; }).map(function (tp, i) {
        return { x: tp.x + Math.cos(tp.ang) * 0.8 * u, y: tp.y + Math.sin(tp.ang) * 0.8 * u,
          r: (2.5 + rnd() * 0.9) * u, rot: rnd() * 6.28, t: 222 + rnd() * 70, k: i,
          fruit: rnd() < 0.5, tf: 298 + rnd() * 46 };
      });
      return T;
    },
    _drawTree: function (ctx, p) {
      var T = p.tree, t = p.t, u = T.u, cx = T.cx, gy = T.gy, self = this;
      var fade = Math.max(0, Math.min(1, (p.max - t) / 40, t / 6));
      function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
      ctx.save();
      ctx.globalAlpha = fade;
      // the mound of earth, with a few blades of grass
      ctx.fillStyle = "#9C6B43";
      ctx.beginPath(); ctx.ellipse(cx, gy + 2.2 * u, 17 * u, 4.4 * u, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#7E5434";
      ctx.beginPath(); ctx.ellipse(cx, gy + 2.2 * u, 17 * u, 1.6 * u, 0, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = "#6BAA4F"; ctx.lineWidth = Math.max(1, 0.5 * u); ctx.lineCap = "round";
      [-13, -11.6, -8, 9, 11.2, 14].forEach(function (gx, i) {
        var hgt = (2 + (i % 3) * 0.8) * u;
        ctx.beginPath(); ctx.moveTo(cx + gx * u, gy + 0.6 * u);
        ctx.quadraticCurveTo(cx + (gx + (i % 2 ? 0.8 : -0.8)) * u, gy - hgt * 0.5, cx + (gx + (i % 2 ? 1.4 : -1.4)) * u, gy - hgt);
        ctx.stroke();
      });
      // the peach stone falls and settles into the earth
      if (t < 60) {
        var drop = ease(t / 28), sy = gy - 34 * u + (34 * u - 1.4 * u) * drop * drop;
        ctx.save();
        ctx.globalAlpha = fade * Math.min(1, (60 - t) / 16);
        ctx.translate(cx, sy);
        ctx.rotate(0.5 - drop * 0.4);
        ctx.fillStyle = "#A8693D";
        ctx.beginPath(); ctx.ellipse(0, 0, 1.5 * u, 2.1 * u, 0, 0, 6.29); ctx.fill();
        ctx.strokeStyle = "#6E3F1E"; ctx.lineWidth = Math.max(0.8, 0.25 * u);
        ctx.beginPath(); ctx.moveTo(-0.6 * u, -1.4 * u); ctx.quadraticCurveTo(0.4 * u, 0, -0.5 * u, 1.4 * u); ctx.stroke();
        ctx.restore();
      }
      // the sprout: a green stem and its first two leaves, overtaken by the trunk
      if (t > 26 && t < 112) {
        var sg = ease((t - 28) / 40), sa = Math.min(1, (112 - t) / 24);
        var tipx = cx + 0.8 * u, tipy = gy - 9 * u * sg;
        ctx.save();
        ctx.globalAlpha = fade * sa;
        ctx.strokeStyle = "#5DA046"; ctx.lineWidth = Math.max(1.2, 0.8 * u);
        ctx.beginPath(); ctx.moveTo(cx, gy); ctx.quadraticCurveTo(cx - 0.8 * u, gy - 4.5 * u * sg, tipx, tipy); ctx.stroke();
        var lo = ease((t - 52) / 20);
        if (lo > 0) {
          ctx.fillStyle = "#79BE5C";
          [-1, 1].forEach(function (sd) {
            ctx.save();
            ctx.translate(tipx, tipy);
            ctx.rotate(sd * (0.5 + 0.7 * lo) - Math.PI / 2);
            ctx.beginPath(); ctx.ellipse(2.2 * u * lo, 0, 2.3 * u * lo, 1.1 * u * lo, 0, 0, 6.29); ctx.fill();
            ctx.restore();
          });
        }
        ctx.restore();
      }
      // the trunk and branches, each growing out from its fork
      function qpt(b, f) {
        var a = 1 - f;
        return [a * a * b.x0 + 2 * a * f * b.cx + f * f * b.x1, a * a * b.y0 + 2 * a * f * b.cy + f * f * b.y1];
      }
      // each branch is one tapering shape along its curve, rounded at the tip, with a
      // streak of light bark down one side
      T.branches.forEach(function (b) {
        var g = (t - b.t0) / (b.t1 - b.t0);
        if (g <= 0) return;
        var f = ease(Math.min(1, g)), n = 10, L = [], R = [], M = [], k;
        for (k = 0; k <= n; k++) {
          var q = f * k / n, a = 1 - q;
          var px = a * a * b.x0 + 2 * a * q * b.cx + q * q * b.x1, py = a * a * b.y0 + 2 * a * q * b.cy + q * q * b.y1;
          var tx = 2 * a * (b.cx - b.x0) + 2 * q * (b.x1 - b.cx), ty = 2 * a * (b.cy - b.y0) + 2 * q * (b.y1 - b.cy);
          var tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, hw = (b.w0 + (b.w1 - b.w0) * q) / 2;
          L.push([px + nx * hw, py + ny * hw]); R.push([px - nx * hw, py - ny * hw]); M.push([px, py, hw, nx, ny]);
        }
        var end = M[n], a0 = Math.atan2(end[4], end[3]);
        ctx.fillStyle = "#6E4A2C";
        ctx.beginPath();
        ctx.moveTo(L[0][0], L[0][1]);
        for (k = 1; k <= n; k++) ctx.lineTo(L[k][0], L[k][1]);
        ctx.arc(end[0], end[1], end[2], a0, a0 - Math.PI, true);
        for (k = n; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath(); ctx.arc(M[0][0], M[0][1], M[0][2], 0, 6.29); ctx.fill();
        if (M[0][2] > 1.1) {
          ctx.strokeStyle = "rgba(168,124,80,.6)"; ctx.lineCap = "round";
          ctx.beginPath();
          for (k = 0; k <= n; k++) {
            var hx = M[k][0] - M[k][3] * M[k][2] * 0.38, hy = M[k][1] - M[k][4] * M[k][2] * 0.38;
            if (k) ctx.lineTo(hx, hy); else ctx.moveTo(hx, hy);
          }
          ctx.lineWidth = Math.max(0.8, M[0][2] * 0.4);
          ctx.stroke();
        }
      });
      // leaves, unfurling along the younger branches and stirring a little
      T.leaves.forEach(function (lf, i) {
        var g = ease((t - lf.t) / 16);
        if (g <= 0) return;
        var at = qpt(lf.b, lf.f), len = lf.len * g, sway = Math.sin(t * 0.05 + i) * 0.08;
        ctx.save();
        ctx.translate(at[0], at[1]);
        ctx.rotate(lf.ang + sway);
        ctx.fillStyle = lf.k ? "#5FA444" : "#7BBE5A";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
        ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(47,110,52,.5)"; ctx.lineWidth = Math.max(0.5, 0.18 * u);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.85, 0); ctx.stroke();
        ctx.restore();
      });
      // blossom opens; on half the flowers it gives way to a peach
      T.flowers.forEach(function (fl) {
        var o = (t - fl.t) / 12;
        if (o <= 0) return;
        var pop = o < 1 ? Math.sin(o * 1.9) / Math.sin(1.9) : 1;         // a little overshoot as it opens
        var ripe = fl.fruit ? ease((t - fl.tf) / 22) : 0;
        if (ripe < 1) self._drawBlossom(ctx, fl.x, fl.y, fl.r * pop * (1 - ripe), fl.rot, 1 - ripe * 0.6, fl.k);
        if (ripe > 0) {
          var swing = Math.sin(t * 0.06 + fl.k) * 0.12;
          self._drawPeach(ctx, fl.x, fl.y + 2.6 * u * ripe, 3.3 * u * (0.4 + 0.6 * ripe), swing, 1);
        }
      });
      ctx.restore();
    },

    /* Eggs (Lab 10, window.LAB_FX = "egg"). A correct answer sets a little
       cream egg at the point: it wobbles, cracks, the top pops off and a
       yellow chick pops up, cheeps twice (SFX.egg) and fades, with a few
       fluffs of down. o.scale sizes it. */
    _egg: function (ox, oy, o) {
      var scale = o.scale || 1;
      this._ps.push({ kind: "hatchling", x: ox, y: oy - 8 * scale, s: 1.35 * scale, t: 0, max: 92 * (o.life || 1),
        dir: Math.random() < 0.5 ? -1 : 1, E: this._eggSpec(12.5, 15.5, false, 0.12) });
      this._run();
    },
    /* An egg's measurements: rx, ry its half width and height; the crack is a
       zigzag across it at frac of the way from the middle to the top; pivot is
       the middle of the cap that comes off. */
    _eggSpec: function (rx, ry, gold, frac) {
      var yc = -ry * frac, zig = [], n = 8, i;
      for (i = 0; i <= n; i++) zig.push([-rx * 1.15 + 2.3 * rx * i / n, yc + (i % 2 ? -1 : 1) * ry * 0.09]);
      return { rx: rx, ry: ry, yc: yc, zig: zig, pivot: (yc - ry) / 2, lw: gold ? 1.5 : 1.3, gold: gold,
        fill: gold ? ["#FFF4C9", "#FFE48A", "#EDB422", "#A87108"] : ["#FFFFFF", "#FFF6E4", "#F2DDB6", "#D2B07C"],
        line: gold ? "#9A6406" : "#B08A55" };
    },
    _eggPath: function (ctx, rx, ry, keep) {           // narrower at the top; keep adds to the current path
      if (!keep) ctx.beginPath();
      for (var i = 0; i <= 48; i++) {
        var th = i / 48 * 6.2832, c = Math.cos(th), x = rx * Math.sin(th) * (1 - 0.1 * c), y = -ry * c;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
    },
    /* The egg whole (crack 0-1 draws that much of the crack) or one part of it:
       "top" (the cap) or "bottom" (the cup), cut along the zigzag. */
    _drawShell: function (ctx, E, part, crack) {
      var rx = E.rx, ry = E.ry, z = E.zig, m = z.length >> 1, i;
      ctx.save();
      if (part !== "whole") {
        var edge = part === "top" ? -ry * 2 : ry * 2;
        ctx.beginPath();
        ctx.moveTo(z[0][0], edge);
        for (i = 0; i < z.length; i++) ctx.lineTo(z[i][0], z[i][1]);
        ctx.lineTo(z[z.length - 1][0], edge);
        ctx.closePath();
        ctx.clip();
      }
      this._eggPath(ctx, rx, ry);
      var g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, rx * 0.1, 0, 0, ry * 1.15);
      E.fill.forEach(function (c, j) { g.addColorStop(j / (E.fill.length - 1), c); });
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = E.lw; ctx.strokeStyle = E.line; ctx.lineJoin = "round"; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath(); ctx.ellipse(-rx * 0.42, -ry * 0.4, rx * 0.15, ry * 0.23, 0.35, 0, 6.29); ctx.fill();
      var reach = part === "whole" ? Math.round((crack || 0) * m) : m;
      if (reach > 0) {
        this._eggPath(ctx, rx, ry); ctx.clip();
        ctx.beginPath();
        for (i = m - reach; i <= m + reach; i++) {
          if (i === m - reach) ctx.moveTo(z[i][0], z[i][1]); else ctx.lineTo(z[i][0], z[i][1]);
        }
        ctx.lineWidth = E.lw * (part === "whole" ? 1.1 : 1.8); ctx.strokeStyle = E.line; ctx.stroke();
      }
      ctx.restore();
    },
    /* Clip to all but what the cup hides: inside the egg, or above its rim. */
    _clipAbove: function (ctx, E) {
      var z = E.zig, i;
      this._eggPath(ctx, E.rx, E.ry);
      ctx.moveTo(z[0][0], -E.ry * 4);
      ctx.lineTo(z[z.length - 1][0], -E.ry * 4);
      for (i = z.length - 1; i >= 0; i--) ctx.lineTo(z[i][0], z[i][1]);
      ctx.closePath();
      ctx.clip();
    },
    _backOut: function (x) { x = Math.max(0, Math.min(1, x)) - 1; return 1 + 2.70158 * x * x * x + 1.70158 * x * x; },
    _sparkle: function (ctx, x, y, r) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.fill();
      ctx.restore();
    },
    /* A yellow chick facing right, about 17 wide; beak 0-1 opens it. Every
       part is outlined first and filled after, so the outline goes round the
       whole chick and not between its head and body. */
    _drawChick: function (ctx, beak, wing) {
      var OL = "#C4870C";
      function body() { ctx.beginPath(); ctx.ellipse(0, 0, 8.6, 7.6, 0, 0, 6.29); }
      function head() { ctx.beginPath(); ctx.arc(2.2, -8.4, 6.2, 0, 6.29); }
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = OL; ctx.lineWidth = 2.2;
      body(); ctx.stroke(); head(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1, -14.2); ctx.quadraticCurveTo(0, -17.5, 2.4, -18); ctx.moveTo(2.6, -14.4);
      ctx.quadraticCurveTo(3.6, -17, 5.6, -16.4); ctx.lineWidth = 1.1; ctx.stroke();
      ctx.fillStyle = "#FFD84A";
      body(); ctx.fill(); head(); ctx.fill();
      ctx.save(); body(); ctx.clip();
      ctx.fillStyle = "rgba(255,240,170,.8)"; ctx.beginPath(); ctx.ellipse(1.5, 3.6, 6, 4, 0, 0, 6.29); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(-1.5, -0.5); ctx.rotate(wing);
      ctx.fillStyle = "#F5C02E"; ctx.strokeStyle = OL; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(-3, 0.5, 4.4, 2.8, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#F39A22"; ctx.strokeStyle = "#B4630C"; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(7.6, -9.6); ctx.lineTo(11.8, -8.5 - beak * 0.8); ctx.lineTo(7.8, -7.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7.8, -7.6); ctx.lineTo(11.2, -7.4 + beak * 1.6); ctx.lineTo(7.6, -6.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#2A2622"; ctx.beginPath(); ctx.arc(5, -9.9, 1.05, 0, 6.29); ctx.fill();
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(5.35, -10.3, 0.38, 0, 6.29); ctx.fill();
      ctx.fillStyle = "rgba(255,128,110,.45)"; ctx.beginPath(); ctx.ellipse(5.2, -6.6, 1.4, 0.9, 0, 0, 6.29); ctx.fill();
    },
    _drawHatchling: function (ctx, p) {
      var t = p.t, E = p.E, OPEN = 32, self = this;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (p.max - t) / 18));
      ctx.translate(p.x, p.y);
      ctx.scale(p.s, p.s);
      var pin = t < 10 ? Math.max(0.02, Math.sin(t / 10 * 1.9) / Math.sin(1.9)) : 1;
      var wob = t > 6 && t < OPEN ? Math.sin((t - 6) * 0.8) * 0.17 * Math.min(1, (t - 6) / 5) : 0;
      ctx.save();
      ctx.translate(0, E.ry); ctx.rotate(wob); ctx.scale(pin, pin); ctx.translate(0, -E.ry);
      if (t < OPEN) {
        this._drawShell(ctx, E, "whole", t < 17 ? 0 : t < 22 ? 0.4 : t < 29 ? 0.7 : 1);
      } else {
        var up = this._backOut((t - OPEN) / 9), hop = 0, beak = 0;
        [37, 46].forEach(function (c) {
          var q = (t - c) / 7;
          if (q > 0 && q < 1) { hop += Math.sin(q * Math.PI) * 2.6; beak = Math.sin(q * Math.PI); }
        });
        ctx.save();
        this._clipAbove(ctx, E);
        ctx.translate(0, 15 - 21 * up - hop);
        ctx.scale(p.dir, 1);
        this._drawChick(ctx, beak, -0.3 + Math.sin(t * 0.9) * 0.5);
        ctx.restore();
        this._drawShell(ctx, E, "bottom");
        var ft = t - OPEN;
        if (ft < 30) {
          ctx.save();
          ctx.globalAlpha *= 1 - ft / 30;
          ctx.translate(-p.dir * 1.5 * ft, E.pivot - 3.2 * ft + 0.15 * ft * ft);
          ctx.rotate(-p.dir * 0.2 * ft);
          ctx.translate(0, -E.pivot);
          self._drawShell(ctx, E, "top");
          ctx.restore();
        }
      }
      ctx.restore();
      ctx.restore();
    },
    _drawFeather: function (ctx, p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.t / 5, p.life / 25));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot + Math.sin(p.fl) * 0.5);
      ctx.fillStyle = p.c; ctx.strokeStyle = p.edge; ctx.lineWidth = Math.max(0.6, p.s * 0.12); ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.6, -p.s * 0.6, p.s * 0.5, p.s * 0.5, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.5, p.s * 0.5, -p.s * 0.6, -p.s * 0.6, 0, -p.s);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -p.s * 0.7); ctx.lineTo(0, p.s * 1.4); ctx.stroke();
      ctx.restore();
    },
    _fluff: function (x, y, n, sc, white) {
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = (1.6 + Math.random() * 2.4) * Math.sqrt(sc);
        this._ps.push({ kind: "feather", x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          s: (2.6 + Math.random() * 1.4) * sc, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.08,
          fl: Math.random() * 6.28, t: 0, life: 70 + Math.random() * 40,
          c: white ? "#FFFFFF" : "#FFE488", edge: white ? "rgba(150,140,122,.7)" : "rgba(196,135,12,.6)" });
      }
    },

    /* The finale's hen, facing right, centred on her body (about 50 tall with
       the comb). h: wing "fold" | "flap" | "wave" | "to" (reaching for wx, wy
       in her own frame), ph the flap's phase, beak 0-1, blink, hat (the cap
       of the egg h.E on her head), legs "dangle". */
    _drawHen: function (ctx, h) {
      var OL = "#8E8676", sx = 2, sy = -3, len = 15, ang;
      function tail() {
        ctx.beginPath();
        ctx.moveTo(-7, -10);
        ctx.quadraticCurveTo(-12, -21, -15.5, -28);
        ctx.quadraticCurveTo(-15.5, -22.5, -15, -20.5);
        ctx.quadraticCurveTo(-19, -24.5, -23, -25);
        ctx.quadraticCurveTo(-20.5, -20, -18.5, -17);
        ctx.quadraticCurveTo(-22.5, -17.5, -25.5, -15.5);
        ctx.quadraticCurveTo(-20, -6, -12, -2);
        ctx.closePath();
      }
      function body() { ctx.beginPath(); ctx.ellipse(0, 0, 16, 13, 0, 0, 6.29); }
      function neck() {
        ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(3, -17, 4, -22);
        ctx.lineTo(15, -18); ctx.quadraticCurveTo(14, -10, 13, -5); ctx.closePath();
      }
      function head() { ctx.beginPath(); ctx.arc(9.5, -20, 8.5, 0, 6.29); }
      var parts = [tail, body, neck, head];
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      if (h.legs === "dangle") {
        ctx.strokeStyle = "#F29B2B"; ctx.lineWidth = 2.2;
        [[-4, 0.25], [3, -0.15]].forEach(function (l) {
          var fx = l[0] + Math.sin(l[1]) * 11, fy = 22;
          ctx.beginPath(); ctx.moveTo(l[0], 9); ctx.lineTo(fx, fy);
          ctx.moveTo(fx, fy); ctx.lineTo(fx + 3.4, fy + 0.8); ctx.moveTo(fx, fy); ctx.lineTo(fx - 1.8, fy + 1);
          ctx.stroke();
        });
      }
      // the comb, behind the head
      var comb = [[4.6, -27.4, 2.8], [8.6, -29.2, 3.4], [12.7, -27.6, 2.9]];
      ctx.strokeStyle = "#A8261F"; ctx.lineWidth = 2;
      comb.forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], q[2], 0, 6.29); ctx.stroke(); });
      ctx.fillStyle = "#E5403A";
      comb.forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], q[2], 0, 6.29); ctx.fill(); });
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6;
      parts.forEach(function (f) { f(); ctx.stroke(); });
      ctx.fillStyle = "#FFFFFF";
      parts.forEach(function (f) { f(); ctx.fill(); });
      ctx.strokeStyle = "rgba(142,134,118,.55)"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-9, -9); ctx.quadraticCurveTo(-13, -16, -15, -21);
      ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-16, -13, -20, -18); ctx.stroke();
      ctx.save(); body(); ctx.clip();
      ctx.fillStyle = "rgba(214,204,186,.5)"; ctx.beginPath(); ctx.ellipse(3, 10.5, 17, 8, 0, 0, 6.29); ctx.fill();
      ctx.restore();
      // wattle, beak, eye
      ctx.fillStyle = "#E5403A"; ctx.strokeStyle = "#A8261F"; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.ellipse(16, -13.4, 2.1, 3.1, -0.2, 0, 6.29); ctx.fill(); ctx.stroke();
      var b = h.beak || 0;
      ctx.fillStyle = "#F5A524"; ctx.strokeStyle = "#B36B0C"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(16.4, -22); ctx.lineTo(23.4, -19.4 - b * 1.4); ctx.lineTo(16.8, -18.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(16.8, -18.2); ctx.lineTo(21.6, -17.8 + b * 2.8); ctx.lineTo(16.4, -16.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#2A2622";
      if (h.blink) { ctx.fillRect(10.4, -21.8, 3.2, 0.9); }
      else {
        ctx.beginPath(); ctx.arc(12, -21.5, 1.6, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(12.5, -22.1, 0.55, 0, 6.29); ctx.fill();
      }
      // the wing
      if (h.wing === "to") { len = Math.hypot(h.wx - sx, h.wy - sy); ang = Math.atan2(h.wy - sy, h.wx - sx); }
      else if (h.wing === "flap") ang = Math.PI + 0.5 - 0.9 * (0.5 + 0.5 * Math.sin(h.ph));
      else if (h.wing === "wave") ang = -1.75 + 0.45 * Math.sin(h.ph);
      else ang = Math.PI - 0.22;
      ctx.save();
      ctx.translate(sx, sy); ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.bezierCurveTo(len * 0.45, -6.5, len * 0.85, -3.5, len, -0.5);
      ctx.lineTo(len * 0.86, 0.6); ctx.lineTo(len * 0.97, 2); ctx.lineTo(len * 0.8, 2.6);
      ctx.bezierCurveTo(len * 0.5, 5.5, len * 0.2, 6, 0, 5);
      ctx.closePath();
      ctx.fillStyle = "#F7F4ED"; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(len * 0.3, -1); ctx.quadraticCurveTo(len * 0.6, -0.8, len * 0.8, 0.8);
      ctx.moveTo(len * 0.25, 2.2); ctx.quadraticCurveTo(len * 0.5, 2.8, len * 0.7, 2.6);
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(142,134,118,.7)"; ctx.stroke();
      ctx.restore();
      if (h.hat) {                                     // the cap of her egg, worn like a helmet
        ctx.save();
        ctx.translate(8, -27.5); ctx.rotate(-0.12); ctx.translate(0, -h.E.pivot);
        this._drawShell(ctx, h.E, "top");
        ctx.restore();
      }
    },
    /* One leg from the hip to the pedal, the knee bent forward. */
    _henLeg: function (ctx, hx, hy, px, py, col) {
      var L = 19, dx = px - hx, dy = py - hy, dd = Math.min(Math.hypot(dx, dy), 2 * L - 0.01);
      var a = Math.atan2(dy, dx), al = Math.acos(dd / (2 * L));
      var kx = hx + L * Math.cos(a - al), ky = hy + L * Math.sin(a - al);
      var fx = hx + dd * Math.cos(a), fy = hy + dd * Math.sin(a);
      ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
      ctx.moveTo(fx, fy); ctx.lineTo(fx + 3.6, fy + 0.4);
      ctx.moveTo(fx, fy); ctx.lineTo(fx + 3, fy - 1.4);
      ctx.moveTo(fx, fy); ctx.lineTo(fx - 2, fy + 0.6);
      ctx.stroke();
    },
    /* The bicycle, facing right, its origin on the ground midway between the
       wheels (about 82 long, 46 tall). wa turns the wheels. */
    _bikeBack: function (ctx, wa) {
      var R = 14.5, BB = [-3, -16.5], ST = [-10, -38], HT = [17, -37], HB = [19, -31];
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      [[-26, -14.5], [26, -14.5]].forEach(function (c) {
        ctx.strokeStyle = "#2E3038"; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, 6.29); ctx.stroke();
        ctx.strokeStyle = "#C3C8D1"; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.arc(c[0], c[1], R - 1.9, 0, 6.29); ctx.stroke();
        ctx.strokeStyle = "rgba(120,128,142,.85)"; ctx.lineWidth = 0.45;
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
          var q = wa + i * Math.PI / 4;
          ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(q) * (R - 2), c[1] + Math.sin(q) * (R - 2));
        }
        ctx.stroke();
        ctx.fillStyle = "#8D94A3"; ctx.beginPath(); ctx.arc(c[0], c[1], 1.6, 0, 6.29); ctx.fill();
      });
      ctx.strokeStyle = "#6B7080"; ctx.lineWidth = 0.6;          // the chain
      ctx.beginPath(); ctx.moveTo(BB[0], BB[1] - 4.6); ctx.lineTo(-26, -16.8); ctx.moveTo(BB[0], BB[1] + 4.6); ctx.lineTo(-26, -12.2); ctx.stroke();
      ctx.strokeStyle = "#A9AFBA"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ST[0], ST[1]); ctx.lineTo(-11, -41.5); ctx.stroke();            // seat post
      ctx.beginPath(); ctx.moveTo(HT[0], HT[1]); ctx.lineTo(15.5, -43); ctx.stroke();             // stem
      ctx.lineWidth = 1.9;
      ctx.beginPath(); ctx.moveTo(15.5, -43); ctx.quadraticCurveTo(13, -45.6, 9.5, -45.4); ctx.stroke();
      ctx.strokeStyle = "#E0473C"; ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-26, -14.5); ctx.lineTo(BB[0], BB[1]); ctx.lineTo(ST[0], ST[1]); ctx.closePath();
      ctx.moveTo(BB[0], BB[1]); ctx.lineTo(HB[0], HB[1]);
      ctx.moveTo(ST[0], ST[1]); ctx.lineTo(16.4, -35.6);
      ctx.moveTo(HB[0], HB[1]); ctx.quadraticCurveTo(23.5, -24, 26, -14.5);
      ctx.stroke();
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(HT[0], HT[1]); ctx.lineTo(HB[0], HB[1]); ctx.stroke();       // head tube
      ctx.strokeStyle = "#2F3038"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(9.5, -45.4); ctx.lineTo(7.2, -45.2); ctx.stroke();            // grip
      ctx.fillStyle = "#2F3038";
      ctx.beginPath(); ctx.moveTo(-18.5, -42.6); ctx.quadraticCurveTo(-11, -45.4, -4, -42.4);
      ctx.lineTo(-6, -40.6); ctx.quadraticCurveTo(-12, -41.6, -17.5, -40.4); ctx.closePath(); ctx.fill();   // saddle
      ctx.fillStyle = "#D8DCE3"; ctx.strokeStyle = "#8D94A3"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(13.4, -46, 1.8, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();   // bell
      ctx.strokeStyle = "#8D94A3"; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(BB[0], BB[1], 4.6, 0, 6.29); ctx.stroke();                       // chainring
    },
    _crank: function (ctx, ca, far) {
      var BB = [-3, -16.5], sg = far ? -1 : 1, px = BB[0] + sg * 7 * Math.cos(ca), py = BB[1] + sg * 7 * Math.sin(ca);
      ctx.lineCap = "round";
      ctx.strokeStyle = far ? "#5C6170" : "#8D94A3"; ctx.lineWidth = far ? 1.6 : 2;
      ctx.beginPath(); ctx.moveTo(BB[0], BB[1]); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = "#3A3D47"; ctx.fillRect(px - 2.2, py - 0.8, 4.4, 1.6);
      if (!far) { ctx.fillStyle = "#8D94A3"; ctx.beginPath(); ctx.arc(BB[0], BB[1], 1.3, 0, 6.29); ctx.fill(); }
      return [px, py - 1];
    },
    /* The bicycle at bx on the ground line gy, with the hen riding when r is
       given (r.hen her drawing options, r.bob, r.squash); ring 0-1 shows the
       bell ringing. */
    _drawRide: function (ctx, bx, gy, s, wa, ca, r, ring) {
      ctx.save();
      ctx.translate(bx, gy); ctx.scale(s, s);
      ctx.fillStyle = "rgba(70,50,20,.13)";
      ctx.beginPath(); ctx.ellipse(0, 0.5, 44, 2.8, 0, 0, 6.29); ctx.fill();
      var hc = r ? [-9, -56 + r.bob] : null;
      var fp = this._crank(ctx, ca, true);
      if (r) this._henLeg(ctx, hc[0] - 2, hc[1] + 10, fp[0], fp[1], "#D27F1C");
      this._bikeBack(ctx, wa);
      var np = this._crank(ctx, ca, false);
      if (r) {
        this._henLeg(ctx, hc[0] + 1, hc[1] + 10, np[0], np[1], "#F29B2B");
        ctx.save();
        ctx.translate(hc[0], hc[1]); ctx.scale(1, r.squash || 1);
        r.hen.wx = 8.6 - hc[0]; r.hen.wy = -45.4 - hc[1];          // the grip, in her own frame
        this._drawHen(ctx, r.hen);
        ctx.restore();
      }
      if (ring > 0 && ring < 1) {
        ctx.strokeStyle = "rgba(107,112,128," + (1 - ring) + ")"; ctx.lineWidth = 1; ctx.lineCap = "round";
        [0, 1, 2].forEach(function (j) {
          var rr = 3.5 + ring * 6 + j * 2.6;
          ctx.beginPath(); ctx.arc(13.4, -46.5, rr, -1.25, -0.25); ctx.stroke();
        });
      }
      ctx.restore();
    },
    /* The nest under the big egg: the back of it before the egg, the front
       after, so the egg sits down in it. */
    _nest: function (ctx, front) {
      var i;
      ctx.lineCap = "round";
      if (!front) {
        ctx.fillStyle = "rgba(70,50,20,.12)";
        ctx.beginPath(); ctx.ellipse(0, 3, 35, 3.2, 0, 0, 6.29); ctx.fill();
        ctx.fillStyle = "#9A6B33";
        ctx.beginPath(); ctx.ellipse(0, -4, 30, 7, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#C8954C"; ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (i = 0; i < 7; i++) { var bx = -24 + i * 8; ctx.moveTo(bx, -4); ctx.quadraticCurveTo(bx + 3, -9.5, bx + 7 - (i % 2) * 3, -10.2 + (i % 3)); }
        ctx.stroke();
        return;
      }
      ctx.fillStyle = "#C8954C";
      ctx.beginPath(); ctx.ellipse(0, -4, 31, 7.5, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 1.1;
      for (i = 0; i < 12; i++) {
        var x0 = -28 + i * 5, k = i % 3;
        ctx.strokeStyle = k === 1 ? "#9A6B33" : "#E6BE6E";
        ctx.beginPath(); ctx.moveTo(x0, -4.5 + k); ctx.quadraticCurveTo(x0 + 4, 1.5 - k, x0 + 9, -2.5 + k * 1.4); ctx.stroke();
      }
    },
    /* Where the bicycle is at frame t of the finale: it rolls in from the left
       and stops beside the egg (bell at 160), waits for her, then speeds up
       and rides out of the right side by about frame 420. */
    _hatchBx: function (p, t) {
      if (t < 160) { var q = Math.max(0, (t - 112) / 48); q = 1 - Math.pow(1 - q, 3); return p.x0 + (p.stopX - p.x0) * q; }
      var tau = t - 196;
      if (tau <= 0) return p.stopX;
      return p.stopX + (tau < 30 ? 0.5 * (p.v / 30) * tau * tau : 15 * p.v + p.v * (tau - 30));
    },
    /* The finale (FX "hatch"), timed with SFX.hatchRide, in frames of 16 ms:
       the golden egg pops in on its nest, rocks at three knocks (28, 45, 61),
       cracks (56-80) and the cap pops off (85); a hen pops up flapping, clucks
       (100, 114) and the cap lands on her head (112). A bicycle rolls in and
       stops beside the egg with a ring (160); she turns to look, hops (169)
       and turns in the air to land on the saddle (189), and rides off to the
       right (from 196), pedalling, ringing the bell (287) and waving. */
    _drawHatch: function (ctx, p) {
      var t = p.t, s = p.s, E = p.E, POP = 85, HAT = 112, HOP = 169, LAND = 189;
      function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
      var ecx = p.ex, ecy = p.gy - (2 + E.ry) * s;
      var henY = 13 - 39 * (t < POP ? 0 : this._backOut((t - POP) / 13));
      var dir = t < 154 || t >= HOP ? 1 : Math.cos(Math.PI * ease((t - 154) / 7));
      var beak = 0;
      [100, 114].forEach(function (c) { var q = (t - c) / 7; if (q > 0 && q < 1) beak = Math.sin(q * Math.PI); });
      var blink = [130, 238, 352].some(function (b) { return t > b && t < b + 4; });
      var squash = 1;
      if (t > HAT && t < HAT + 7) squash = 1 - 0.09 * Math.sin((t - HAT) / 7 * Math.PI);
      if (t > LAND && t < LAND + 7) squash = 1 - 0.1 * Math.sin((t - LAND) / 7 * Math.PI);
      var hen = { beak: beak, blink: blink, hat: t >= HAT, E: E, wing: t < POP + 16 ? "flap" : "fold", ph: t * 1.2 };
      // where she is until she lands: standing in the cup, then hopping in an arc to
      // the saddle (straight up at first, so she clears the rim), turning in the air
      var hx = ecx, hy = ecy + henY * s;
      if (t >= HOP && t < LAND) {
        var hu = (t - HOP) / (LAND - HOP), hs = hu * hu * (3 - 2 * hu);
        hx = ecx + (p.stopX - 9 * s - ecx) * hs;
        hy = ecy - 26 * s + (p.gy - 56 * s - (ecy - 26 * s)) * hu - 40 * s * 4 * hu * (1 - hu);
        dir = -Math.cos(Math.PI * ease((hu - 0.35) / 0.3));
        hen.wing = "flap"; hen.ph = t * 1.4; hen.legs = "dangle";
      }
      var inEgg = t >= POP && t < HOP + 3;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, (p.max - t) / 40, t / 6));
      ctx.save(); ctx.translate(ecx, p.gy); ctx.scale(s, s); this._nest(ctx, false); ctx.restore();
      var pin = t < 16 ? Math.sin(t / 16 * 1.9) / Math.sin(1.9) : 1, rock = 0;
      [28, 45, 61].forEach(function (kt, j) {
        if (t > kt) rock += (j % 2 ? -1 : 1) * 0.12 * Math.exp(-(t - kt) / 9) * Math.sin((t - kt) * 0.5);
      });
      ctx.save();
      ctx.translate(ecx, p.gy - 2 * s); ctx.rotate(rock); ctx.scale(s * pin, s * pin); ctx.translate(0, -E.ry);
      if (t < POP) {
        this._drawShell(ctx, E, "whole", t < 56 ? 0 : t < 66 ? 0.25 : t < 75 ? 0.5 : t < 80 ? 0.75 : 1);
        this._sparkle(ctx, E.rx * 0.48, -E.ry * 0.46, 3.6 * (0.6 + 0.4 * Math.sin(t * 0.25)));
      } else {
        if (inEgg) {
          ctx.save();
          this._clipAbove(ctx, E);
          ctx.translate((hx - ecx) / s, (hy - ecy) / s); ctx.scale(dir, squash);
          this._drawHen(ctx, hen);
          ctx.restore();
        }
        this._drawShell(ctx, E, "bottom");
      }
      ctx.restore();
      ctx.save(); ctx.translate(ecx, p.gy); ctx.scale(s, s); this._nest(ctx, true); ctx.restore();
      // the cap, flying up and over onto her head
      if (t >= POP && t < HAT) {
        var u = (t - POP) / (HAT - POP), x0 = ecx, y0 = ecy + E.pivot * s, x1 = ecx + 8 * s, y1 = ecy - 53.5 * s;
        ctx.save();
        ctx.translate(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - 62 * s * 4 * u * (1 - u));
        ctx.rotate(u * (Math.PI * 2 - 0.12));
        ctx.scale(s, s); ctx.translate(0, -E.pivot);
        this._drawShell(ctx, E, "top");
        ctx.restore();
      }
      // the bicycle, and then her on it
      if (t >= 112) {
        var bx = this._hatchBx(p, t), R = 14.5;
        var wa = (bx - p.x0) / (R * s), ca = 0.6 + Math.max(0, bx - p.stopX) / (R * s) / 1.3;
        var ring = t >= 160 && t < 180 ? (t - 160) / 20 : t >= 287 && t < 307 ? (t - 287) / 20 : 0;
        var rider = null;
        if (t >= LAND) {
          hen.wing = t >= 300 && t < 340 ? "wave" : "to";
          hen.ph = (t - 300) * 0.35;
          rider = { hen: hen, bob: t > 196 ? 0.7 * Math.sin(2 * ca) : 0, squash: squash };
        }
        this._drawRide(ctx, bx, p.gy, s, wa, ca, rider, ring);
        if (!inEgg && t >= HOP && t < LAND) {
          ctx.save();
          ctx.translate(hx, hy); ctx.scale(s * dir, s);
          this._drawHen(ctx, hen);
          ctx.restore();
        }
      }
      ctx.restore();
    },

    _run: function () {
      if (this._running) return;
      var host = this._host(), ctx = host.getContext("2d");
      this._running = true;
      var self = this;
      var t0 = performance.now();
      (function frame(t) {
        // clamp below as well: the first rAF timestamp can precede performance.now()
        var dt = Math.max(0, Math.min(32, t - t0)); t0 = t;
        var k = dt / 16;
        ctx.clearRect(0, 0, host.width, host.height);
        var alive = 0;

        self._rings.forEach(function (g) {
          if (g.life <= 0 || g.r <= 0) return;
          g.r += g.sp * k;
          g.life -= 0.06 * k;
          if (g.life <= 0) return;
          alive++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, g.life) * 0.6;
          ctx.strokeStyle = g.c;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r, 0, 6.29);
          ctx.stroke();
          ctx.restore();
        });

        self._ps.forEach(function (p) {
          if (p.kind === "ghost") {
            if (p.delay > 0) { p.delay -= k; alive++; return; }
            p.t += k; p.life -= k;
            if (p.life <= 0) return;
            if (p.orbit) {
              var O = p.orbit, lap = 175;
              if (p.t < lap) {
                p.ang += 0.034 * k;
                p.x = O.cx + Math.cos(p.ang) * O.R;
                p.y = O.cy + Math.sin(p.ang) * O.R * 0.55 + Math.sin(p.t * 0.1 + p.ph) * 6;
              } else {
                p.y -= 4.2 * k; p.x += Math.cos(p.ang) * 1.6 * k;
              }
              if (p.y < -p.r * 3) return;
            } else {
              p.x += Math.sin(p.t * 0.07 + p.ph) * p.sway * k;
              p.y += p.vy * k;
              if (p.y < -p.r * 3) return;
            }
            alive++;
            self._drawGhost(ctx, p);
            return;
          }
          if (p.kind === "tree") {
            p.t += k;
            if (p.t >= p.max) return;
            alive++;
            // once the blossom is out, a petal drifts down now and then
            if (p.t > 240 && p.t < p.max - 60 && Math.random() < 0.09 * k) {
              var fl = p.tree.flowers[Math.floor(Math.random() * p.tree.flowers.length)];
              if (fl) self._ps.push({ kind: "petal", x: fl.x, y: fl.y, vx: (Math.random() - 0.5) * 1.6, vy: 0.3,
                s: p.tree.u * (0.9 + Math.random() * 0.5), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.08,
                fl: Math.random() * 6.28, t: 0, life: 150, max: 150, delay: 0 });
            }
            self._drawTree(ctx, p);
            return;
          }
          if (p.kind === "blossom") {
            p.t += k; p.life -= k;
            if (p.life <= 0) return;
            p.vx *= Math.pow(0.93, k); p.vy = p.vy * Math.pow(0.93, k) + 0.04 * k;
            p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
            alive++;
            self._drawBlossom(ctx, p.x, p.y, p.r * (0.5 + 0.5 * Math.min(1, p.t / 8)), p.rot, Math.min(1, p.life / 20), Math.floor(p.r));
            return;
          }
          if (p.kind === "petal") {
            if (p.delay > 0) { p.delay -= k; alive++; return; }
            p.t += k; p.life -= k;
            if (p.life <= 0 || p.y > host.height + 20) return;
            p.vy = Math.min(1.3, p.vy + 0.05 * k);
            p.vx = p.vx * Math.pow(0.97, k) + Math.sin(p.t * 0.08 + p.fl) * 0.05 * k;
            p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.fl += 0.12 * k;
            alive++;
            self._drawPetal(ctx, p);
            return;
          }
          if (p.kind === "peachf") {
            p.t += k; p.life -= k;
            if (p.life <= 0) return;
            p.vy += 0.15 * k; p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
            alive++;
            self._drawPeach(ctx, p.x, p.y, p.r, p.rot, Math.min(1, p.t / 4, p.life / 18));
            return;
          }
          if (p.kind === "hatchling") {
            p.t += k;
            if (p.t >= p.max) return;
            alive++;
            if (!p.fluffed && p.t >= 32) { p.fluffed = true; self._fluff(p.x, p.y - 4 * p.s, 5, p.s * 0.9, false); }
            self._drawHatchling(ctx, p);
            return;
          }
          if (p.kind === "hatch") {
            p.t += k;
            if (p.t >= p.max) return;
            alive++;
            if (!p.popped && p.t >= 85) {
              p.popped = true;
              self._fluff(p.ex, p.gy - (2 + p.E.ry * 1.6) * p.s, 9, p.s * 1.1, true);
            }
            if (p.t > 198 && p.t < 425) {
              p.dust = (p.dust || 0) + k;
              if (p.dust > 4) {
                p.dust = 0;
                self._ps.push({ kind: "dust", x: self._hatchBx(p, p.t) - 33 * p.s, y: p.gy - 2.5 * p.s, r: 2.2 * p.s,
                  vx: -0.4 - Math.random() * 0.7, vy: -0.2 - Math.random() * 0.35, t: 0, life: 34 });
              }
            }
            self._drawHatch(ctx, p);
            return;
          }
          if (p.kind === "feather") {
            p.t += k; p.life -= k;
            if (p.life <= 0 || p.y > host.height + 20) return;
            p.vy = Math.min(1.1, p.vy + 0.06 * k);
            p.vx = p.vx * Math.pow(0.96, k) + Math.sin(p.t * 0.09 + p.fl) * 0.06 * k;
            p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.fl += 0.1 * k;
            alive++;
            self._drawFeather(ctx, p);
            return;
          }
          if (p.kind === "dust") {
            p.t += k;
            if (p.t >= p.life) return;
            p.x += p.vx * k; p.y += p.vy * k;
            alive++;
            var dq = p.t / p.life;
            ctx.save();
            ctx.globalAlpha = 0.42 * (1 - dq);
            ctx.fillStyle = "#CDB894";
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + 1.6 * dq), 0, 6.29); ctx.fill();
            ctx.restore();
            return;
          }
          if (p.kind === "skeleton") {
            p.t += k; p.life -= k;
            if (p.life <= 0) return;
            alive++;
            self._drawSkeleton(ctx, p);
            return;
          }
          if (p.kind === "moon" || p.kind === "lantern") {
            p.t += k; p.life -= k;
            if (p.life <= 0) return;
            alive++;
            if (p.kind === "moon") self._drawMoon(ctx, p);
            else self._drawLantern(ctx, p);
            return;
          }
          if (p.kind === "bat") {
            if (p.delay > 0) { p.delay -= k; alive++; return; }     // still inside the pumpkin
            p.t += k;
            p.vx += Math.sin(p.t * 0.13 + p.seed) * 0.09 * k;          // the flutter: jittery, never straight
            p.vy += (Math.cos(p.t * 0.21 + p.seed) * 0.06 - p.climb) * k;
            p.vy = Math.max(-5.5, Math.min(1.2, p.vy));
            p.vx *= Math.pow(0.99, k);
            p.x += p.vx * k; p.y += p.vy * k;
            p.ph += p.rate * k;
            p.life -= p.decay * k;
            if (p.life <= 0 || p.y < -50 || p.x < -80 || p.x > host.width + 80) return;
            alive++;
            self._drawBat(ctx, p);
            return;
          }
          if (p.kind === "snake") {
            if (p.wait > 0) { p.wait -= k; alive++; return; }
            p.t += k;
            var prev = Math.floor(p.pos);
            p.pos = Math.min(p.route.length - 1, p.pos + p.speed * k);
            // a bite: the head has reached an apple's cell
            for (var c2 = prev + 1; c2 <= Math.floor(p.pos); c2++) {
              var cellNow = p.route[c2];
              p.apples.forEach(function (ap) {
                if (!ap.eaten && ap.x === cellNow[0] && ap.y === cellNow[1]) {
                  ap.eaten = true;
                  p.len += p.grow;
                  SFX.chomp(p.eaten++);
                  var ax = ap.x * p.cell, ay = ap.y * p.cell;
                  for (var sp2 = 0; sp2 < 7; sp2++) {
                    var an = Math.random() * 6.28, sv = 1 + Math.random() * 2.2;
                    self._ps.push({ kind: "spark", x: ax, y: ay, vx: Math.cos(an) * sv, vy: Math.sin(an) * sv,
                      r: 1.3 + Math.random() * 1.5, life: 1, decay: 0.045 });
                  }
                }
              });
            }
            if (p.pos >= p.route.length - 1) return;
            alive++;
            p.apples.forEach(function (ap) {
              if (ap.eaten || p.t < ap.born) return;
              var age = p.t - ap.born, pop = Math.min(1, age / 7);
              var sc2 = pop < 1 ? pop * 1.25 : 1 + 0.04 * Math.sin(p.t * 0.2 + ap.x);
              self._drawApple(ctx, ap.x * p.cell, ap.y * p.cell, p.cell * 0.46 * sc2, p.t);
            });
            self._drawSnake(ctx, p);
            return;
          }
          if (p.kind === "dragon") {
            p.t += k;
            p.life -= k;
            p.hist.push(p.path(p.t));
            if (p.hist.length > p.n * p.gap + 2) p.hist.splice(0, p.hist.length - (p.n * p.gap + 2));
            if (p.life <= 0) return;
            // shed a few golden sparks from the body as it flies
            if (Math.random() < 0.35 * k) {
              var sp = p.hist[Math.max(0, p.hist.length - 1 - Math.floor(Math.random() * p.n) * p.gap)];
              self._ps.push({ kind: "spark", x: sp[0], y: sp[1], vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2 + 0.4, r: 1.2 + Math.random() * 1.6, life: 1, decay: 0.03 });
            }
            alive++;
            self._drawDragon(ctx, p);
            return;
          }
          if (p.kind === "bigpearl") {
            p.t += k; p.life -= k;
            if (p.life <= 0) return;
            alive++;
            var fade = Math.min(1, p.t / 20, p.life / 40), R = 16 + 2 * Math.sin(p.t * 0.12);
            var py = p.y - Math.max(0, p.t - 170) * 5;
            ctx.save();
            ctx.globalAlpha = fade;
            var gl = ctx.createRadialGradient(p.x, py, 0, p.x, py, R * 4);
            gl.addColorStop(0, "rgba(255,236,170,.8)"); gl.addColorStop(1, "rgba(255,236,170,0)");
            ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, py, R * 4, 0, 6.29); ctx.fill();
            for (var fi = 0; fi < 7; fi++) {
              var fa2 = p.t * 0.15 + fi * 0.9, fl2 = R * (1.7 + 0.3 * Math.sin(p.t * 0.4 + fi));
              ctx.fillStyle = fi % 2 ? "rgba(255,140,40,.85)" : "rgba(255,196,60,.85)";
              ctx.beginPath();
              ctx.moveTo(p.x + Math.cos(fa2 - 0.3) * R * 0.85, py + Math.sin(fa2 - 0.3) * R * 0.85);
              ctx.quadraticCurveTo(p.x + Math.cos(fa2) * fl2 * 1.15, py + Math.sin(fa2) * fl2 * 1.15,
                p.x + Math.cos(fa2 + 0.3) * R * 0.85, py + Math.sin(fa2 + 0.3) * R * 0.85);
              ctx.fill();
            }
            var pg2 = ctx.createRadialGradient(p.x - R * 0.35, py - R * 0.35, R * 0.1, p.x, py, R);
            pg2.addColorStop(0, "#FFFFFF"); pg2.addColorStop(0.55, "#F3ECFA"); pg2.addColorStop(1, "#C9B3E2");
            ctx.fillStyle = pg2; ctx.beginPath(); ctx.arc(p.x, py, R, 0, 6.29); ctx.fill();
            ctx.restore();
            return;
          }
          if (p.kind === "spark") {
            p.x += p.vx * k; p.y += p.vy * k; p.life -= p.decay * k;
            if (p.life <= 0) return;
            alive++;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = "#FFD35C";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - p.r * 2.2); ctx.lineTo(p.x + p.r * 0.6, p.y - p.r * 0.6);
            ctx.lineTo(p.x + p.r * 2.2, p.y); ctx.lineTo(p.x + p.r * 0.6, p.y + p.r * 0.6);
            ctx.lineTo(p.x, p.y + p.r * 2.2); ctx.lineTo(p.x - p.r * 0.6, p.y + p.r * 0.6);
            ctx.lineTo(p.x - p.r * 2.2, p.y); ctx.lineTo(p.x - p.r * 0.6, p.y - p.r * 0.6);
            ctx.fill();
            ctx.restore();
            return;
          }
          if (p.kind === "balloon") {
            if (p.delay > 0) { p.delay -= k; alive++; return; }
            p.tw += p.sway * k;
            p.vy = Math.max(p.vy - 0.02 * k, -4.2);        // lighter than air: keeps accelerating, gently
            p.x += (p.vx + Math.sin(p.tw) * 0.8) * k;
            p.y += p.vy * k;
            p.life -= p.decay * k;
            if (p.life <= 0 || p.y < -p.r * 4) return;
            alive++;
            var r = p.r, tilt = Math.sin(p.tw) * 0.18;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
            ctx.translate(p.x, p.y);
            ctx.rotate(tilt);
            // string
            ctx.strokeStyle = "rgba(60,60,80,.55)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, r * 1.25);
            ctx.quadraticCurveTo(r * 0.5 * Math.sin(p.tw * 1.7), r * 2.2, -r * 0.3 * Math.sin(p.tw * 1.3), r * 3.1);
            ctx.stroke();
            // knot
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.moveTo(-r * 0.22, r * 1.32); ctx.lineTo(r * 0.22, r * 1.32); ctx.lineTo(0, r * 1.12);
            ctx.closePath(); ctx.fill();
            // body
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 1.2, 0, 0, 6.29);
            ctx.fill();
            // highlight
            ctx.fillStyle = "rgba(255,255,255,.45)";
            ctx.beginPath();
            ctx.ellipse(-r * 0.35, -r * 0.45, r * 0.22, r * 0.36, -0.5, 0, 6.29);
            ctx.fill();
            ctx.restore();
            return;
          }
          if (p.kind === "paper") {
            p.vy += 0.16 * k;                               // gravity
            var drag = p.vy > 0 ? 0.94 : 0.965;             // paper falls slowly
            p.vx *= Math.pow(0.97, k); p.vy *= Math.pow(drag, k);
            p.tw += p.flip * k;
            p.x += (p.vx + (p.vy > 0 ? Math.sin(p.tw * 0.6) * 1.1 : 0)) * k;   // flutter on the way down
            p.y += p.vy * k;
            p.rot += p.vr * k;
            p.life -= p.decay * k;
            if (p.life <= 0 || p.y > host.height + 30) return;
            alive++;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.scale(1, Math.cos(p.tw));                   // the tumble: the piece turns edge-on and back
            ctx.fillStyle = p.c;
            if (p.shape === "curl") {
              ctx.strokeStyle = p.c; ctx.lineWidth = 2.4; ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-p.s * 1.6, 0);
              ctx.bezierCurveTo(-p.s * 0.8, -p.s, -p.s * 0.2, p.s, p.s * 0.5, 0);
              ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 1.3, p.s * 0.4, p.s * 1.6, 0);
              ctx.stroke();
            } else if (p.shape === "strip") {
              ctx.fillRect(-p.s * 1.1, -p.s * 0.28, p.s * 2.2, p.s * 0.56);
            } else {
              ctx.fillRect(-p.s * 0.6, -p.s * 0.45, p.s * 1.2, p.s * 0.9);
            }
            ctx.restore();
            return;
          }
          var px = p.x, py = p.y;
          p.vy += 0.085 * k;
          p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx * k;
          p.y += p.vy * k;
          p.tw += 0.55 * k;
          p.life -= p.decay * k;
          if (p.life <= 0 || p.y > host.height + 20) return;
          alive++;
          var twinkle = 0.65 + 0.35 * Math.sin(p.tw);
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life)) * twinkle;
          ctx.strokeStyle = p.c;
          ctx.lineCap = "round";
          ctx.lineWidth = p.w;
          ctx.beginPath();
          ctx.moveTo(px - p.vx * 1.6, py - p.vy * 1.6);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.restore();
        });

        if (alive) requestAnimationFrame(frame);
        else {
          self._running = false;
          self._ps = []; self._rings = [];
          ctx.clearRect(0, 0, host.width, host.height);
        }
      })(t0);
    },

    _centerOf: function (originEl) {
      var r = originEl ? originEl.getBoundingClientRect()
        : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      return [r.left + r.width / 2, r.top + r.height / 2];
    },

    burst: function (originEl) {
      if (REDUCED) return;
      var c = this._centerOf(originEl);
      this._fire(c[0], c[1]);
    },

    /* Full credit earns the grand finale: three rainbow shells, bigger and
       longer-lived, staggered so the sky stays busy for a few seconds. */
    finale: function (originEl) {
      if (REDUCED) return;
      var c = this._centerOf(originEl), self = this;
      if (w.LAB_FX === "balloons") {
        // a whole sky of them: released along the bottom edge in three waves
        var H = innerHeight, W = innerWidth;
        this._fire(W / 2, H + 30, { rainbow: true, count: 26, scale: 1.4, life: 1.5, spread: W * 0.9 });
        setTimeout(function () {
          self._fire(W / 2, H + 30, { count: 22, scale: 1.25, life: 1.5, spread: W * 0.9 });
        }, 600);
        setTimeout(function () {
          self._fire(c[0], c[1], { rainbow: true, count: 12, scale: 1.2, life: 1.4, spread: 160 });
        }, 1200);
        return;
      }
      if (w.LAB_FX === "dragon") {
        /* Two dragons playing with the pearl: the pearl hangs at the centre
           of the screen, the dragons wind a figure of eight round it from
           either side, then both leave upward. */
        var Wd = innerWidth, Hd = innerHeight, cx = Wd / 2, cy = Hd * 0.46;
        var A = Math.min(Wd * 0.34, 420), B = Math.min(Hd * 0.2, 170);
        function pair(sign) {
          return function (t) {
            var u = t / 150 * Math.PI * 2;
            if (t < 170) {
              return [cx + sign * A * Math.cos(u * 0.9), cy + B * Math.sin(u * 1.8) * sign];
            }
            var e = (t - 170);
            var base = [cx + sign * A * Math.cos(170 / 150 * Math.PI * 2 * 0.9), cy + B * Math.sin(170 / 150 * Math.PI * 2 * 1.8) * sign];
            return [base[0] + sign * e * 2.4, base[1] - e * 7];
          };
        }
        this._fire(0, 0, { path: pair(1), coat: 0, scale: 1.55, life: 1.6, lead: 0, pearl: false });
        this._fire(0, 0, { path: pair(-1), coat: 1, scale: 1.55, life: 1.6, lead: 0, pearl: false });
        this._ps.push({ kind: "bigpearl", x: cx, y: cy, t: 0, life: 230 });
        setTimeout(function () {
          self._fire(c[0], c[1], { scale: 1.1, life: 1.1, coat: 2 });
        }, 900);
        return;
      }
      if (w.LAB_FX === "peach") {
        /* A peach tree grows from a seed on the bottom edge of the screen to a
           tree full of peaches (FX._drawTree), then fades; a little puff of
           blossom at the chest as it starts. */
        var Hp = innerHeight, cont = d.querySelector(".content");
        var cr = cont ? cont.getBoundingClientRect() : { left: 0, width: innerWidth };
        var u = Math.min(Hp * 0.66, cr.width * 0.86) / 100;
        this._ps.push({ kind: "tree", tree: this._buildTree(cr.left + cr.width / 2, Hp - 3 * u - 8, u), t: 0, max: 440 });
        this._run();
        setTimeout(function () {
          self._fire(c[0], c[1], { count: 5, scale: 1.1, life: 1.1 });
        }, 300);
        return;
      }
      if (w.LAB_FX === "egg") {
        /* A big golden egg on a nest along the bottom of the lesson area hatches
           a hen, who wears the cap as a helmet, hops onto a bicycle that rolls
           up, and rides off to the right (FX._drawHatch, about 7 s); a little
           egg hatches at the chest as it starts. The egg and the parked bicycle
           together are centred on the lesson area, not the window. */
        var He = innerHeight, We = innerWidth, ce = d.querySelector(".content");
        var cre = ce ? ce.getBoundingClientRect() : { left: 0, width: We };
        var se = Math.max(0.8, Math.min(cre.width * (cre.width < 600 ? 0.7 : 0.42) / 146, He * 0.3 / 85));
        var eggX = cre.left + cre.width / 2 + 47 * se, parkX = eggX - 78 * se;
        this._ps.push({ kind: "hatch", t: 0, max: 450, s: se, ex: eggX, gy: He - 10 - 4 * se, stopX: parkX,
          x0: -60 * se, v: (We + 70 * se - parkX) / 209, E: this._eggSpec(26, 33, true, 0.68) });
        this._run();
        setTimeout(function () {
          self._fire(c[0], c[1], { scale: 1.1 });
        }, 300);
        return;
      }
      if (w.LAB_FX === "ghosts") {
        /* Three skeletons rise from the bottom of the screen and dance while a
           ring of ghosts circles above them, then the ghosts fly off and the
           skeletons sink back down; one more little group of ghosts at the
           chest. The skeletons are drawn behind the ghosts. */
        var Wg = innerWidth, Hg = innerHeight;
        var sz = Math.max(0.7, Math.min(1.45, Hg * 0.3 / 165, Wg / 3 / 120));
        [0.2, 0.5, 0.8].forEach(function (fx, q) {
          self._ps.push({ kind: "skeleton", x: Wg * fx, base: Hg - 34 * sz, s: q === 1 ? sz * 1.08 : sz,
            t: -q * 6, ph: q * 1.3, life: 300, max: 300 });
        });
        this._fire(0, 0, { count: 8, scale: 1.3, life: 2.2, orbit: { cx: Wg / 2, cy: Hg * 0.32, R: Math.min(Wg * 0.36, 380) },
          delay: 20 });
        this._run();
        setTimeout(function () {
          self._fire(c[0], c[1], { count: 3, scale: 1.1, life: 1.1 });
        }, 1300);
        return;
      }
      if (w.LAB_FX === "bats") {
        /* A harvest moon rises in the middle, three jack-o'-lanterns light up
           along the bottom, and a whole flock pours out of them, past the moon
           and off the top; then one more lantern at the chest. */
        var Wb = innerWidth, Hb = innerHeight, my = Hb * 0.3;
        this._ps.push({ kind: "moon", x: Wb / 2, y: my, r: Math.max(46, Math.min(Wb, Hb) * 0.12), t: 0, life: 300 });
        [0.16, 0.5, 0.84].forEach(function (fx, q) {
          var lx = Wb * fx, ly = Hb - 56;
          self._fire(lx, ly, { count: 10, scale: 1.3, life: 1.8, lscale: 1.5, hold: 90, delay: 16 + q * 9,
            stagger: 5, fan: 0.42, speed: 0.7, aim: Math.atan2(my - ly, Wb / 2 - lx) });
        });
        setTimeout(function () {
          self._fire(c[0], c[1], { count: 7, scale: 1.15, life: 1.3 });
        }, 1200);
        return;
      }
      if (w.LAB_FX === "snake") {
        /* Three snakes: one crosses from the left along a wave of apples, one
           from the right along a second wave, and one climbs up through the
           middle, eating as it goes. Each gets longer the whole way across. */
        var Ws = innerWidth, Hs = innerHeight;
        function wave(y0, amp, phase) {
          var out = [];
          for (var q = 1; q <= 8; q++) {
            out.push([Ws * q / 9, y0 + amp * Math.sin(q * 0.9 + phase)]);
          }
          return out;
        }
        this._fire(0, 0, { start: [-120, Hs * 0.3], apples: wave(Hs * 0.3, 60, 0),
          exit: "right", coat: 0, speed: 0.75, stagger: 2, scale: 1.25 });
        var right = wave(Hs * 0.62, 60, 2).reverse();
        this._fire(0, 0, { start: [Ws + 120, Hs * 0.62], apples: right,
          exit: "left", coat: 1, speed: 0.75, stagger: 2, scale: 1.25, wait: 25 });
        setTimeout(function () {
          var col = [];
          for (var q = 0; q < 6; q++) col.push([c[0] + (q % 2 ? 70 : -70), c[1] - 50 - q * 70]);
          self._fire(c[0], c[1], { apples: col, exit: "up", coat: 2, speed: 0.7, stagger: 2, scale: 1.25 });
        }, 700);
        return;
      }
      if (w.LAB_FX === "confetti") {
        // cannons from both bottom corners, aimed at the middle, then one overhead shower
        var Hc = innerHeight, Wc = innerWidth;
        this._fire(0, Hc, { count: 90, scale: 1.45, life: 1.5, aim: -Math.PI / 3, fan: 0.45 });
        this._fire(Wc, Hc, { count: 90, scale: 1.45, life: 1.5, aim: -2 * Math.PI / 3, fan: 0.45 });
        setTimeout(function () {
          self._fire(c[0], c[1], { rainbow: true, count: 80, scale: 1.3, life: 1.5, fan: 1.2 });
        }, 600);
        setTimeout(function () {
          self._fire(0, Hc, { rainbow: true, count: 70, scale: 1.5, life: 1.5, aim: -Math.PI / 3, fan: 0.5 });
          self._fire(Wc, Hc, { rainbow: true, count: 70, scale: 1.5, life: 1.5, aim: -2 * Math.PI / 3, fan: 0.5 });
        }, 1200);
        return;
      }
      this._fire(c[0], c[1], { rainbow: true, count: 110, scale: 1.6, life: 1.7 });
      setTimeout(function () {
        self._fire(c[0] - 150, c[1] - 60, { rainbow: true, count: 80, scale: 1.25, life: 1.5 });
      }, 550);
      setTimeout(function () {
        self._fire(c[0] + 150, c[1] - 40, { rainbow: true, count: 80, scale: 1.25, life: 1.5 });
      }, 1100);
    },

    flyGem: function (fromEl) {
      var tally = $("#gemTally");
      if (!tally) return;
      var to = tally.getBoundingClientRect();
      if (REDUCED || !fromEl) { this.popTally(); return; }
      var r = fromEl.getBoundingClientRect();
      var n = el("div", "fly-gem", w.ART.gem());
      n.style.left = (r.left + r.width / 2 - 13) + "px";
      n.style.top = (r.top + r.height / 2 - 13) + "px";
      d.body.appendChild(n);
      var dx = to.left + 18 - (r.left + r.width / 2);
      var dy = to.top + to.height / 2 - (r.top + r.height / 2);
      var anim = n.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: "translate(" + dx * 0.45 + "px," + (dy * 0.3 - 46) + "px) scale(1.35)", opacity: 1, offset: 0.5 },
          { transform: "translate(" + dx + "px," + dy + "px) scale(.45)", opacity: 0 }
        ],
        { duration: 620, easing: "cubic-bezier(.4,0,.2,1)" }
      );
      anim.onfinish = function () { n.remove(); FX.popTally(); };
      // never leave a stray gem behind if the animation is interrupted
      setTimeout(function () { if (n.isConnected) { n.remove(); FX.popTally(); } }, 1400);
    },

    /* The number is authoritative and updates the instant an answer is scored.
       The bounce and the flying gem are decoration layered on top of it. */
    setTally: function () {
      var n = $("#gemCount");
      if (n) n.textContent = fmtGems(gems());
    },

    popTally: function () {
      var t = $("#gemTally");
      if (!t) return;
      this.setTally();
      t.classList.remove("pop");
      void t.offsetWidth;
      t.classList.add("pop");
    }
  };

  /* ============================================================
     The path rail
     ============================================================ */
  var RAIL = {
    W: 208, NODE_GAP: 46, LEG_GAP: 58, AMP: 52,
    pts: [], legY: [], H: 0, svg: null, guide: null, legFills: [], legSpans: [],

    build: function () {
      var y = 22, self = this;
      this.pts = []; this.legY = [];
      LEGS.forEach(function (leg, li) {
        self.legY.push(y);
        y += self.LEG_GAP;
        for (var i = 0; i < leg.items.length; i++) {
          var t = tOf(li, i);
          var x = self.W / 2 + self.AMP * Math.sin(t * 0.66 + li * 1.15);
          self.pts.push({ x: x, y: y, t: t, li: li });
          y += self.NODE_GAP;
        }
        y += 12;
      });
      this.H = y + 26;

      var dPath = this.dTo(this.pts.length - 1);
      var nodes = "", marks = "", fills = "";

      LEGS.forEach(function (leg, li) {
        marks += '<g class="leg-mark" data-legmark="' + li + '" data-leg="' + leg.id + '">' +
          '<text class="lm-n" x="14" y="' + (self.legY[li] + 9) + '">' +
          esc(UNIT.toUpperCase() + " " + leg.n) + "</text>" +
          '<text class="lm-t" x="14" y="' + (self.legY[li] + 24) + '">' + esc(leg.title) + "</text>" +
          '<line x1="14" y1="' + (self.legY[li] + 33) + '" x2="' + (self.W - 14) +
          '" y2="' + (self.legY[li] + 33) + '"/></g>';
      });

      this.pts.forEach(function (p, k) {
        nodes += '<g class="node" data-node="' + k + '" data-leg="' + LEGS[p.li].id +
          '" transform="translate(' + p.x + ',' + p.y + ')">' +
          '<circle class="n-core" r="11"/><circle class="n-ring" r="14.5"/>' +
          '<g class="n-gem">' + w.ART.gemFlat(0, 0, 1.5) + "</g>" +
          '<g class="n-gem-half">' + w.ART.gemFlatHalf(0, 0, 1.5) + "</g></g>";
      });

      /* One fill per leg, each in that leg's own colour, so a finished leg keeps
         its identity instead of being repainted by whatever leg comes next. */
      LEGS.forEach(function (leg, li) {
        var from = tOf(li, 0), to = from + leg.items.length - 1;
        fills += '<path class="path-fill" data-legfill="' + li + '" data-leg="' + leg.id +
          '" d="' + self.dSpan(Math.max(0, from - 1), to) + '"/>';
      });

      var svg =
        '<svg class="path-svg" width="' + this.W + '" height="' + this.H + '" viewBox="0 0 ' + this.W + " " + this.H + '" aria-hidden="true">' +
        '<path class="path-track" d="' + dPath + '"/>' + fills +
        marks + nodes +
        /* The halo is centred on the node the guide is standing at, and the animal is
           centred in the halo. Both were 12px high before, which read as a misaligned
           circle rather than a marker sitting on the step. */
        /* Three nested groups on purpose. The outer one is moved between nodes, the
           body carries the hop and the cheer, and the inner one holds a small idle
           sway. Nesting lets the sway keep running underneath the other two instead
           of being overridden by them. */
        '<g class="guide" id="guide"><g class="guide-body">' +
        '<ellipse class="guide-halo" cx="0" cy="0" rx="17" ry="18"/>' +
        '<g class="guide-idle"><g transform="translate(-15.7,-18) scale(.72)">' +
        w.ART.zodiacInner(BANK.zodiac.animal) + "</g></g>" +
        "</g></g></svg>";

      var wrap = $("#pathWrap");
      wrap.style.width = this.W + "px";
      wrap.innerHTML = svg + this.listMarkup();
      this.svg = $(".path-svg", wrap);
      this.guide = $("#guide", wrap);

      // Measure each leg's own stroke so its progress can be animated separately.
      var probe = d.createElementNS("http://www.w3.org/2000/svg", "path");
      this.svg.appendChild(probe);
      this.legFills = $$("[data-legfill]", this.svg);
      this.legSpans = LEGS.map(function (leg, li) {
        var from = Math.max(0, tOf(li, 0) - 1), to = tOf(li, leg.items.length - 1);
        var steps = [];
        for (var k = from; k <= to; k++) {
          probe.setAttribute("d", self.dSpan(from, k));
          steps.push(probe.getTotalLength());
        }
        return { from: from, to: to, steps: steps, total: steps[steps.length - 1] };
      });
      probe.remove();
      this.legFills.forEach(function (el, li) {
        var t = self.legSpans[li].total;
        el.style.strokeDasharray = t;
        el.style.strokeDashoffset = t;
      });
    },

    /* Path from node a to node b inclusive. */
    dSpan: function (a, b) {
      var p = this.pts, out = "M " + p[a].x.toFixed(1) + " " + p[a].y.toFixed(1);
      for (var i = a + 1; i <= b; i++) {
        var q = p[i - 1], r = p[i], m = (r.y - q.y) / 2;
        out += " C " + q.x.toFixed(1) + " " + (q.y + m).toFixed(1) + " " +
          r.x.toFixed(1) + " " + (r.y - m).toFixed(1) + " " +
          r.x.toFixed(1) + " " + r.y.toFixed(1);
      }
      return out;
    },

    dTo: function (k) {
      var p = this.pts, out = "M " + p[0].x.toFixed(1) + " " + p[0].y.toFixed(1);
      for (var i = 1; i <= k; i++) {
        var a = p[i - 1], b = p[i], m = (b.y - a.y) / 2;
        out += " C " + a.x.toFixed(1) + " " + (a.y + m).toFixed(1) + " " +
          b.x.toFixed(1) + " " + (b.y - m).toFixed(1) + " " +
          b.x.toFixed(1) + " " + b.y.toFixed(1);
      }
      return out;
    },

    /* The screen-reader view of the same information. */
    listMarkup: function () {
      var out = '<ol class="vh" id="pathList">';
      LEGS.forEach(function (leg, li) {
        out += "<li>" + esc(UNIT + " " + leg.n + ", " + leg.title) + "<ol>";
        leg.items.forEach(function (_, i) {
          out += '<li id="pl-' + tOf(li, i) + '">Item ' + (i + 1) + " of " + leg.items.length + ", not yet answered.</li>";
        });
        out += "</ol></li>";
      });
      return out + "</ol>";
    },

    /* pos is the index of the item the student is on, or is about to reach. */
    update: function (pos, hop) {
      var self = this;
      pos = Math.max(0, Math.min(TOTAL - 1, pos));

      this.legSpans.forEach(function (span, li) {
        var reached = Math.min(Math.max(pos, span.from), span.to);
        var idx = reached - span.from;
        var len = pos < span.from ? 0 : span.steps[idx];
        self.legFills[li].style.strokeDashoffset = span.total - len;
      });

      this.pts.forEach(function (p, k) {
        var g = self.svg.querySelector('[data-node="' + k + '"]');
        if (!g) return;
        var done = S.given[k] != null;
        g.classList.toggle("is-hit", done && isCorrect(k));
        g.classList.toggle("is-alt", done && isAlternate(k));
        g.classList.toggle("is-miss", done && !isCredited(k));
        g.classList.toggle("is-now", k === pos);
        var li = d.getElementById("pl-" + k);
        if (li) {
          li.textContent = "Item " + (iOf(k) + 1) + " of " + LEGS[liOf(k)].items.length + ", " +
            (done
              ? (isCorrect(k) ? "answered correctly, one gem."
                : isAlternate(k) ? "a near miss, half a gem."
                : "answered incorrectly, no gem.")
              : "not yet answered.");
          if (k === pos) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
        }
      });

      $$("[data-legmark]", this.svg).forEach(function (g) {
        g.classList.toggle("is-active", +g.getAttribute("data-legmark") === liOf(pos));
      });

      var p = this.pts[pos];
      this.guide.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")");
      if (hop && !REDUCED) {
        this.guide.classList.remove("hop");
        void this.guide.getBoundingClientRect();
        this.guide.classList.add("hop");
      }
      this.scrollTo(p.y);
    },

    cheer: function () {
      if (REDUCED) return;
      this.guide.classList.remove("cheer");
      void this.guide.getBoundingClientRect();
      this.guide.classList.add("cheer");
    },

    scrollTo: function (y) {
      var box = $("#railScroll");
      if (!box) return;
      var target = y - box.clientHeight / 2;
      box.scrollTo({ top: Math.max(0, target), behavior: REDUCED ? "auto" : "smooth" });
    }
  };

  /* ============================================================
     Persistence
       v2: "2|A:seg;seg;…|P:<screen>|X:<0|1>|F:<0|1>"
     One segment per item: empty while unanswered, y or n for a
     yes-or-no item, the number for a count, the chosen id for a
     sorting or diagram item, dot-joined slugs for a built word.
     Thirty short segments stay well under the SCORM 1.2 limit.
     The v1 one-character format Lab 1 originally wrote is still
     read, so no saved attempt is lost to the upgrade.
     ============================================================ */
  var KEY = (BANK.store_key || "phonetics_lab" + BANK.lab) + "_" + MODE;

  function itemAt(t) { return LEGS[liOf(t)].items[iOf(t)]; }

  /* ------------------------------------------------------------
     Item-order shuffle. A bank that sets shuffle_items presents
     each trail's questions in a per-student random order. The
     answer buttons stay put, except that a bank setting
     shuffle_options also reorders each multiple-choice question's
     options (Lab 10); an option keeps its own value, so answers are
     stored and reported by it, and only the letter shown on screen
     follows the new order. The order must survive a
     reload, because saved answers are stored by position, so the
     seed is written into the suspend data (the R segment) and the
     same permutation is rebuilt from it on resume. A seed of 0
     means the authored order; window.LAB_SEED pins the seed for
     tests.
     ------------------------------------------------------------ */
  var SHUFFLE = !!BANK.shuffle_items;
  var SEED = 0;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function applyShuffle(seed) {
    if (!seed) return;
    var rnd = mulberry32(seed);
    LEGS.forEach(function (leg) {
      var a = leg.items;
      if (leg.shuffle_pairs) {
        /* Lab 5: a leg whose questions come in linked pairs (two steps on one
           vowel) shuffles the pairs, and each pair keeps its own order. */
        var pairs = [];
        for (var k = 0; k < a.length; k += 2) pairs.push(a.slice(k, k + 2));
        for (var m = pairs.length - 1; m > 0; m--) {
          var n = Math.floor(rnd() * (m + 1));
          var t2 = pairs[m]; pairs[m] = pairs[n]; pairs[n] = t2;
        }
        var flat = [].concat.apply([], pairs);
        for (var q = 0; q < a.length; q++) a[q] = flat[q];
        return;
      }
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
    });
    if (!BANK.shuffle_options) return;
    // a stream of its own, so the question order is the same with or without it
    var orn = mulberry32(seed ^ 0x5BD1E995);
    LEGS.forEach(function (leg) {
      leg.items.forEach(function (it) {
        if (it.type !== "mc" || !it.options) return;
        var o = it.options;
        for (var i = o.length - 1; i > 0; i--) {
          var j = Math.floor(orn() * (i + 1));
          var tmp = o[i]; o[i] = o[j]; o[j] = tmp;
        }
      });
    });
  }

  /* The seed has to be known before the rail is built and answers are
     restored, so it is read straight out of the stored suspend string. */
  function peekSeed() {
    var str = "";
    try {
      if (MODE === "scorm" && w.SCORM && w.SCORM.isAvailable()) str = w.SCORM.getSuspend() || "";
      else str = w.localStorage.getItem(KEY) || "";
    } catch (e) {}
    if (str.indexOf("2|") !== 0) return 0;
    var m = /\|R:(\d+)/.exec(str);
    return m ? +m[1] : 0;
  }

  function encVal(v) {
    if (v == null) return "";
    if (typeof v === "boolean") return v ? "y" : "n";
    return String(v);
  }

  function decVal(it, s) {
    if (!s) return null;
    if (it.type === "boolean") return s === "y";
    if (it.type === "count") { var n = +s; return isNaN(n) ? null : n; }
    return s;                       // choice, spot, build: the id itself was stored
  }

  function enc() {
    var a = [];
    for (var t = 0; t < TOTAL; t++) a.push(encVal(S.given[t]));
    return "2|A:" + a.join(";") + "|P:" + S.at + "|X:" + (S.fx ? 1 : 0) + "|F:" + (S.submitted ? 1 : 0) +
      (SHUFFLE ? "|R:" + SEED : "");
  }

  function dec(str) {
    if (!str) return false;
    var v2 = str.indexOf("2|") === 0;
    if (!v2 && str.indexOf("1|") !== 0) return false;
    var got = false;
    str.split("|").forEach(function (seg) {
      var k = seg.slice(0, 2), v = seg.slice(2);
      if (k === "A:") {
        if (v2) {
          v.split(";").forEach(function (s, t) {
            if (t >= TOTAL) return;
            var val = decVal(itemAt(t), s);
            if (val != null) { S.given[t] = val; got = true; }
          });
        } else {
          for (var t = 0; t < TOTAL && t < v.length; t++) {
            var c = v[t];
            if (c === "-") continue;
            S.given[t] = c === "y" ? true : c === "n" ? false : +c;
            got = true;
          }
        }
      } else if (k === "P:") { S.at = Math.max(0, Math.min(SCREENS.length - 1, +v || 0)); }
      else if (k === "X:") { S.fx = v !== "0"; }
      else if (k === "F:") { S.submitted = v === "1"; }
    });
    return got;
  }

  var saveTimer = null;
  function save(now) {
    if (!now) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { save(true); }, 700);
      return;
    }
    var data = enc();
    if (MODE === "scorm" && w.SCORM && w.SCORM.isAvailable()) {
      w.SCORM.setSuspend(data);
      w.SCORM.setLocation("s" + S.at);
      w.SCORM.commit();
    } else {
      try { w.localStorage.setItem(KEY, data); } catch (e) {}
    }
  }

  function restore() {
    if (MODE === "scorm" && w.SCORM && w.SCORM.isAvailable()) {
      return dec(w.SCORM.getSuspend());
    }
    try { return dec(w.localStorage.getItem(KEY)); } catch (e) { return false; }
  }

  /* ============================================================
     Flow
     ============================================================ */
  function setLeg(li) {
    d.documentElement.setAttribute("data-leg", li == null ? LEGS[0].id : LEGS[li].id);
    var lab = $("#hudLeg");
    if (lab) {
      lab.innerHTML = li == null
        ? '<span class="leg-dot"></span><span>' + esc(BANK.title) + "</span>"
        : '<span class="leg-dot"></span><span>' + UNIT + " " + LEGS[li].n + " · " +
          esc(LEGS[li].title) + "</span>";
    }
  }

  function render() {
    var sc = SCREENS[S.at];
    AUDIO.stop();
    S.pending = null;
    setLeg(sc.leg == null ? (sc.k === "finish" ? LEGS.length - 1 : null) : sc.leg);

    var stage = $("#stage");
    stage.innerHTML = "";
    var host = el("div", "wrap screen");
    stage.appendChild(host);

    w.SCREENS[sc.k](host, sc);
    tieIPA(host);

    // rail position: the item being worked on, or the boundary of the current leg
    var pos;
    if (sc.k === "item") pos = sc.t;
    else if (sc.k === "concept") pos = tOf(sc.leg, 0);
    else if (sc.k === "checkpoint") pos = tOf(sc.leg, LEGS[sc.leg].items.length - 1);
    else if (sc.k === "finish") pos = TOTAL - 1;
    else pos = 0;
    RAIL.update(pos, false);

    FX.popTally();
    stage.scrollIntoView ? w.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }) : w.scrollTo(0, 0);
    var h = host.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    save();
  }

  function go(n) {
    S.at = Math.max(0, Math.min(SCREENS.length - 1, n));
    render();
  }
  function next() { go(S.at + 1); }

  /* Record an answer. Called once per item; later calls are ignored. */
  function submitAnswer(sc, value, sourceEl) {
    var t = sc.t;
    if (S.given[t] != null) return null;
    S.given[t] = value;
    var right = isCredited(t);

    FX.setTally();
    if (right) {
      SFX.good();
      FX.flyGem(sourceEl);
      FX.burst(sourceEl);
    } else {
      SFX.bad();
    }
    RAIL.update(t, false);
    save(true);
    return right;
  }

  /* ============================================================
     SCORM submission
     ============================================================ */
  function reportInteractions() {
    if (!(w.SCORM && w.SCORM.isAvailable())) return;
    for (var t = 0; t < TOTAL; t++) {
      var li = liOf(t), i = iOf(t);
      var it = LEGS[li].items[i];
      var given = S.given[t];
      var isBool = it.type === "boolean";
      // a pick-all-that-apply answer is a SCORM 1.2 choice set, written comma-separated
      var asSet = it.type === "procs"
        ? function (k) { return k.split(".").join(","); }
        : function (k) { return k; };
      w.SCORM.reportInteraction({
        id: it.id,
        // a built word is free-form from the LMS's point of view; everything else is a pick
        type: isBool ? "true-false" : (it.type === "build" || it.type === "transcribe") ? "fill-in" : "choice",
        studentResponse: given == null ? "" : asSet(keyOf(it, given)),
        correctResponse: asSet(keyOf(it, it.answer)),
        // SCORM 1.2 has no half-credit result value that every LMS renders safely,
        // so only an exact answer is reported as correct. The half gems are still
        // in the score, which is what actually carries the grade.
        result: given == null ? "neutral" : (isCorrect(t) ? "correct" : "wrong")
      });
    }
  }

  function commitGrade() {
    var g = gems(), sc = scoreOf(g);
    if (!(w.SCORM && w.SCORM.isAvailable())) return { ok: false, preview: true, gems: g, score: sc };
    reportInteractions();
    w.SCORM.set("cmi.core.score.min", "0");
    w.SCORM.set("cmi.core.score.max", "100");
    w.SCORM.set("cmi.core.score.raw", String(sc));
    // "completed" for everyone who submits: the score carries the grade and a
    // partial-credit student is never marked failed.
    w.SCORM.set("cmi.core.lesson_status", "completed");
    var ok = w.SCORM.commit();
    var status = w.SCORM.getStatus();
    S.submitted = true;
    save(true);
    return { ok: ok || status === "completed" || status === "passed", status: status, gems: g, score: sc };
  }

  /* ============================================================
     Chrome
     ============================================================ */
  function initChrome() {
    $("#gemCount").textContent = "0";

    var railBtn = $("#mapBtn"), rail = $("#rail"), scrim = $("#railScrim");
    function closeRail() {
      rail.classList.remove("open");
      scrim.classList.remove("show");
      railBtn.setAttribute("aria-expanded", "false");
    }
    if (railBtn) {
      railBtn.addEventListener("click", function () {
        var open = rail.classList.toggle("open");
        scrim.classList.toggle("show", open);
        railBtn.setAttribute("aria-expanded", String(open));
      });
      scrim.addEventListener("click", closeRail);
    }

    var fxBtn = $("#fxBtn");
    if (fxBtn) {
      var paint = function () {
        fxBtn.setAttribute("aria-pressed", String(S.fx));
        fxBtn.title = S.fx ? "Turn effect sounds off" : "Turn effect sounds on";
        fxBtn.innerHTML = (S.fx ? "♪" : "♪̸") + '<span class="vh">Effect sounds ' +
          (S.fx ? "on" : "off") + "</span>";
      };
      fxBtn.addEventListener("click", function () { S.fx = !S.fx; paint(); if (S.fx) SFX.good(); save(); });
      paint();
    }

    // one delegated handler for every speaker control on the page
    d.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-play]");
      if (!b) return;
      e.preventDefault();
      AUDIO.play(b.getAttribute("data-play"), b, null, +b.getAttribute("data-rate") || 1);
    });

    // keyboard: 1-5 answer, Enter advances
    d.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      var sc = SCREENS[S.at];
      if (e.key === "Enter") {
        var act = $("#actBtn");
        if (act && !act.disabled) { e.preventDefault(); act.click(); }
        return;
      }
      if (sc.k !== "item") return;
      var n = e.key === "0" ? 10 : +e.key;
      if (n >= 1 && n <= 10) {
        var opts = $$(".opt");
        if (opts[n - 1] && !opts[n - 1].disabled) { e.preventDefault(); opts[n - 1].click(); }
      }
    });

    w.addEventListener("pagehide", function () {
      try {
        save(true);
        if (MODE === "scorm" && w.SCORM && w.SCORM.isAvailable()) {
          w.SCORM.setExitSuspend();
          w.SCORM.finish("suspend");
        }
      } catch (e) {}
    });
  }

  /* ============================================================
     Boot
     ============================================================ */
  function boot() {
    initChrome();

    // SCORM first: reading the stored seed needs a live API connection.
    if (MODE === "scorm") {
      var live = w.SCORM && w.SCORM.init();
      if (!live) {
        var b = $("#previewBanner");
        if (b) b.classList.add("show");
      } else if (!w.SCORM.getStatus() || w.SCORM.getStatus() === "not attempted") {
        w.SCORM.setIncomplete();
      }
    }

    if (SHUFFLE) {
      SEED = peekSeed();
      if (!SEED) {
        SEED = w.LAB_SEED != null ? (w.LAB_SEED | 0)
          : 1 + Math.floor(Math.random() * 2147483622);
      }
      applyShuffle(SEED);
    }

    RAIL.build();
    var resumed = restore();
    render();
    if (resumed && S.at > 0) {
      var n = answered();
      toast(S.submitted
        ? "Welcome back. This attempt is already submitted."
        : "Welcome back. " + (n ? n + " of " + TOTAL + " answered so far." : "Picking up where you stopped."));
    }
  }

  /* A short, dismissable notice. Announced once, then it gets out of the way. */
  function toast(text) {
    var t = el("div", "toast", esc(text) +
      '<button type="button" class="toast-x" aria-label="Dismiss">&times;</button>');
    t.setAttribute("role", "status");
    d.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    function bye() { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }
    t.querySelector(".toast-x").addEventListener("click", bye);
    setTimeout(bye, 6500);
  }

  /* Public surface used by lab-screens.js */
  w.LAB = {
    mode: MODE, bank: BANK, meta: META, legs: LEGS, per: PER, total: TOTAL, tOf: tOf, liOf: liOf, iOf: iOf,
    state: S, screens: SCREENS, reduced: REDUCED,
    audio: AUDIO, sfx: SFX, fx: FX, rail: RAIL,
    el: el, esc: esc, $: $, $$: $$, tieIPA: tieIPA, tieText: tieText,
    gems: gems, answered: answered, legGems: legGems, legAlternates: legAlternates,
    alternates: alternates, keyOf: keyOf, creditOf: creditOf, graded: graded,
    fmtGems: fmtGems, altCredit: ALT_CREDIT, completion: COMPLETION,
    isCorrect: isCorrect, isAlternate: isAlternate, isCredited: isCredited,
    verdict: verdict, verdictOf: verdictOf,
    scoreOf: scoreOf, pointsOf: pointsOf,
    itemOf: itemOf, legOf: legOf,
    go: go, next: next, answer: submitAnswer, save: save,
    commitGrade: commitGrade
  };

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
