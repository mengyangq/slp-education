/* ============================================================
   Phonetics Labs, screens
   Every view the student sees. Depends on lab-engine.js and
   lab-art.js. Loaded after both.
   ============================================================ */
(function (w, d) {
  "use strict";

  var L = w.LAB, ART = w.ART;
  var el = L.el, esc = L.esc, $ = L.$, $$ = L.$$;

  /* What a student calls one of the three modules inside a lab. */
  var UNIT = (L.bank.unit && L.bank.unit.one) || "Trail";
  // what the lab calls itself: "Lab 3" in the series, or a one-off lab's own name
  var LABEL = L.bank.label || "Lab " + L.bank.lab;
  var NUMW = ["No", "One", "Two", "Three", "Four", "Five", "Six"];

  /* ---------------------------------------------------------
     Shared pieces
     --------------------------------------------------------- */
  function actionBar(label, opts) {
    opts = opts || {};
    var hint = opts.hint
      ? '<span class="hint">' + opts.hint + "</span>"
      : '<span class="hint"></span>';
    return '<div class="act">' + hint +
      '<button type="button" class="pb" id="actBtn"' + (opts.disabled ? " disabled" : "") +
      (opts.cls ? ' data-x="' + opts.cls + '"' : "") + ">" + esc(label) + "</button></div>";
  }

  function onAct(fn) {
    var b = $("#actBtn");
    if (b) b.addEventListener("click", fn);
  }

  function chipHTML(main, sub, role, cls, delay) {
    return '<div class="chip ' + (cls || "") + '" style="animation-delay:' + delay + 'ms">' +
      (role ? '<span class="c-role">' + esc(role) + "</span>" : "") +
      '<span class="c-main">' + main + "</span>" +
      (sub ? '<span class="c-sub">' + esc(sub) + "</span>" : "") + "</div>";
  }

  /* Morpheme chips: word -> [ dis ][ agree ][ ment ][ s ] */
  function morphemeChips(item) {
    var out = '<div class="chips">';
    item.chips.forEach(function (c, i) {
      if (i) out += '<span class="chip-plus" style="animation-delay:' + (i * 90 - 30) + 'ms">+</span>';
      out += chipHTML(esc(c.text), c.gloss, c.role, "", i * 90);
    });
    return out + "</div>";
  }

  /* Phoneme chips with the letters that spell each one. */
  function phonemeChips(item, playable) {
    var out = '<div class="chips">';
    item.chips.forEach(function (c, i) {
      var main = "/" + esc(c.ipa) + "/";
      if (playable && L.audio.has("ipa_" + c.slug)) {
        main = '<button type="button" class="spk round" data-play="ipa_' + c.slug +
          '" aria-label="Play the sound ' + esc(c.ipa) + '" style="margin-bottom:2px">' +
          ART.speaker() + "</button><br>" + main;
      }
      out += chipHTML(main, c.sub || ("spelled " + c.letters), null, "ipa", i * 90);
    });
    return out + "</div>";
  }

  /* Two aligned phoneme rows for a minimal pair.
     Every row emits the same column count, label + play slot + one cell per
     position, so the grid lines up even when the words differ in length. */
  function alignRows(item, opts) {
    opts = opts || {};
    var a = item.a, b = item.b;
    var n = Math.max(a.ipa.length, b.ipa.length);
    var diffs = item.aligned ? item.diffs : null;
    var withAudio = !!opts.audio && (L.audio.has(a.audio) || L.audio.has(b.audio));

    function slot(side) {
      if (!withAudio) return "";
      if (side && L.audio.has(side.audio)) {
        return '<button type="button" class="spk round" data-play="' + side.audio +
          '" aria-label="Play the word ' + esc(side.word) + '">' + ART.speaker() + "</button>";
      }
      return '<span class="aslot" aria-hidden="true"></span>';
    }

    function row(side) {
      var cells = "";
      for (var k = 0; k < n; k++) {
        var ph = side.ipa[k];
        if (ph == null) {
          cells += '<span class="acell gap"><span class="vh">no sound in this position</span>·</span>';
        } else {
          var cls = !item.aligned ? "diff" : (diffs.indexOf(k) >= 0 ? "diff" : "same");
          var clip = L.audio.forIPA(ph);
          cells += clip
            ? '<button type="button" class="acell ' + cls + '" data-play="' + clip +
              '" aria-label="Play the sound ' + esc(ph) + '">/' + esc(ph) + "/</button>"
            : '<span class="acell ' + cls + '">/' + esc(ph) + "/</span>";
        }
      }
      return '<div class="arow"><span class="alab">' + esc(side.word) + "</span>" +
        slot(side) + cells + "</div>";
    }

    var marks = "";
    if (item.aligned && diffs.length) {
      marks = '<div class="arow amark"><span class="alab"></span>' + slot(null);
      for (var k = 0; k < n; k++) {
        marks += "<span>" + (diffs.indexOf(k) >= 0 ? "↑ differs" : "") + "</span>";
      }
      marks += "</div>";
    }

    return '<div class="align-scroll"><div class="align">' +
      row(a) + row(b) + marks + "</div></div>";
  }

  /* Letters collapsing into sounds, used by the Phoneme Counter. */
  function collapseView(item) {
    var letters = "", li = 0;
    item.chips.forEach(function (c, ci) {
      for (var k = 0; k < c.letters.length; k++) {
        var merged = c.letters.length > 1 ? " merged" : "";
        letters += '<span class="' + merged.trim() + '" data-chip="' + ci + '">' +
          esc(c.letters[k]) + "</span>";
        li++;
      }
    });
    var s1 = item.letters === 1 ? "letter" : "letters";
    var s2 = item.answer === 1 ? "sound" : "sounds";
    return '<div class="collapse">' +
      '<div class="row-letters">' + letters + "</div>" +
      '<div class="tick">' + item.letters + " " + s1 + " on the page</div>" +
      '<div style="font-size:1.3rem;color:var(--acc);font-weight:800">&darr;</div>' +
      phonemeChips(item, true) +
      '<div class="tick">' + item.answer + " " + s2 + " in the mouth</div>" +
      "</div>";
  }

  /* ---------------------------------------------------------
     Intro
     --------------------------------------------------------- */
  function intro(host) {
    var G = L.bank.grading;

    host.innerHTML =
      '<span class="eyebrow">' + esc(L.meta.course || "Phonetics") + " · " + esc(LABEL) + "</span>" +
      "<h2>" + esc(L.bank.title) + "</h2>" +
      '<p class="lede">' + (NUMW[L.legs.length] || L.legs.length) + " activities, " + L.total +
      " questions, one path. " +
      (L.bank.lede ||
        "You will break words into meaningful pieces, decide whether two words differ by a single " +
        "sound, and count the sounds inside a word.") + "</p>" +

      "<h3>How this works</h3><ul>" +
      "<li>Answer, then press <b>Check</b>. You get one " + (L.completion || L.mode !== "scorm" ? "" : "scored ") +
      "attempt at each question.</li>" +
      "<li>After every question you see the answer and an explanation, right or wrong.</li>" +
      "<li>Each correct answer earns a <b>gem</b> and moves you along the trail.</li>" +
      "<li>" + (L.bank.near_note ||
        "A few questions have a near miss that earns <b>half a gem</b>. " +
        "The feedback shows you what you missed.") + "</li>" +
      "<li>Your progress saves as you go, so you can stop and come back.</li>" +
      "</ul>" +

      // grading is a Moodle matter: the practice site says nothing about it
      (L.mode === "scorm"
        ? '<div class="callout c-info"><span class="ic" aria-hidden="true">&#9432;</span>' +
          "<h4>How this is graded</h4><p>" +
          (L.completion
            ? "<b>This lab is graded on completion.</b> Work through all " + L.total + " questions and " +
              "submit at the end for full credit. The gems show you how you did; they do not change " +
              "the grade. "
            : "<b>" + G.full_threshold + " or more correct out of " + L.total +
              "</b> earns the full " + G.full_points + " points. <b>1 to " + (G.full_threshold - 1) +
              " correct</b> earns " + G.partial_points + " point. ") +
          "Nothing is sent to Moodle until you press the submit button at the end.</p></div>"
        : "") +

      actionBar("Start " + (L.bank.label ? "the lab" : LABEL));

    onAct(function () { L.next(); });
  }

  /* ---------------------------------------------------------
     Concept screen, one per leg, carrying the worked example
     --------------------------------------------------------- */
  var DEMOS = {
    mb: demoMorpheme,
    mp: demoMinimalPair,
    pc: demoPhoneme,
    ss: demoSystems,
    pw: demoPathway,
    wb: demoBuilder,
    af: demoArticulators,
    sd: demoDetective,
    vf: demoVowelChart,
    tm: demoTongue,
    wp: demoProcs,
    sp: demoProcs,
    cc: demoClues,
    tr: demoTranscribe
  };

  function concept(host, sc) {
    var leg = L.legs[sc.leg];
    host.innerHTML =
      '<span class="eyebrow">' + UNIT + " " + leg.n + " of " + L.legs.length + "</span>" +
      "<h2>" + esc(leg.title) + "</h2>" +
      '<p class="lede">' + esc(leg.subtitle) + ".</p>" +
      '<div class="card"><p style="font-size:1.05rem;margin:0">' + leg.concept + "</p></div>" +
      (leg.audio_note
        ? '<div class="callout c-audio"><span class="ic" aria-hidden="true">' + ART.speaker() +
          "</span><p>" + leg.audio_note + "</p></div>"
        : "") +
      '<div id="demoHost"></div>' +
      actionBar("Start the " + leg.items.length + " questions");

    DEMOS[leg.id]($("#demoHost"), leg);
    onAct(function () { L.next(); });
  }

  /* --- Morpheme Builder: cats = cat + s ------------------- */
  function demoMorpheme(host) {
    host.innerHTML =
      '<div class="demo"><h4>Worked example, tap each piece</h4>' +
      '<div class="demo-tap">' +
      '<button type="button" class="tapper" data-tap="cats">cats<span class="hintdot"></span></button>' +
      '<button type="button" class="tapper" data-tap="cat">cat<span class="hintdot"></span></button>' +
      '<button type="button" class="tapper" data-tap="s">-s<span class="hintdot"></span></button>' +
      "</div>" +
      '<div class="demo-stage empty" id="demoStage" aria-live="polite">' +
      '<p class="dcap">Tap <b>cats</b>, then <b>cat</b>, then <b>-s</b>.</p></div>' +
      '<p style="margin:10px 0 0;font-size:.9rem;color:var(--ink-soft)">' +
      "<b>cats</b> = <b>cat</b> + <b>-s</b>, so <b>2 morphemes</b>.</p></div>";

    var stage = $("#demoStage", host);

    var VIEWS = {
      cats: function () {
        return {
          art: '<div class="pic-row">' + ART.objectRow("cat", 3) + "</div>",
          cap: "<b>cats</b> means more than one cat. The whole word carries that meaning, " +
            "but it is not the smallest piece."
        };
      },
      cat: function () {
        return {
          art: '<div class="pic-row">' + ART.object("cat") + "</div>",
          cap: "<b>cat</b> is the animal. You can picture it, and you cannot cut it into anything " +
            "smaller that still means something. That makes it one morpheme."
        };
      },
      s: function () {
        function pair(kind) {
          return '<div class="md-row">' +
            '<div class="md-cell">' +
            '<div class="pic-row">' + ART.object(kind) + "</div>" +
            '<span class="md-lab">' + kind + "</span></div>" +
            '<span class="md-op">+ <b>-s</b></span>' +
            '<span class="md-op">=</span>' +
            '<div class="md-cell">' +
            '<div class="pic-row">' + ART.objectRow(kind, 3) + "</div>" +
            '<span class="md-lab">' + kind + "s</span></div></div>";
        }
        return {
          art: '<div class="multi-demo">' + pair("cat") + pair("hat") + pair("cup") + "</div>",
          cap: "<b>-s</b> is not a picture of anything. It adds a meaning: <b>more than one</b>. " +
            "It does the same job to every noun you attach it to. Carrying meaning is exactly what " +
            "makes it a morpheme, even though it cannot stand alone."
        };
      }
    };

    $$(".tapper", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-tap");
        $$(".tapper", host).forEach(function (b) {
          b.classList.toggle("on", b === btn);
          if (b === btn) b.classList.add("seen");
        });
        var v = VIEWS[key]();
        stage.classList.remove("empty");
        stage.innerHTML = v.art + '<p class="dcap">' + v.cap + "</p>";
        L.tieIPA(stage);
      });
    });
  }

  /* --- Minimal Pair Detective: see / tea ------------------ */
  function demoMinimalPair(host) {
    var demo = {
      aligned: true, diffs: [0],
      a: { word: "see", ipa: ["s", "i"], audio: "w_see" },
      b: { word: "tea", ipa: ["t", "i"], audio: "w_tea" }
    };
    host.innerHTML =
      '<div class="demo"><h4>Worked example</h4>' +
      '<div class="demo-stage" style="padding:18px 12px">' +
      alignRows(demo, { audio: true }) +
      '<p class="dcap" id="mpCap">The second sound is the same in both words. Only the first ' +
      "position differs, and that single change gives you a different word.</p>" +
      "</div>" +

      '<p style="margin:10px 0 0;font-size:.9rem;color:var(--ink-soft)">' +
      "<b>see</b> and <b>tea</b> differ in exactly one phoneme, /s/ against /t/, so they are a " +
      "<b>minimal pair</b>.</p></div>";

  }

  /* --- Phoneme Counter: ship ------------------------------ */
  function demoPhoneme(host) {
    var demo = {
      word: "ship", letters: 4, answer: 3,
      chips: [
        { letters: "sh", ipa: "ʃ", slug: "sh" },
        { letters: "i", ipa: "ɪ", slug: "ih" },
        { letters: "p", ipa: "p", slug: "p" }
      ]
    };
    host.innerHTML =
      '<div class="demo"><h4>Worked example</h4>' +
      '<div class="demo-stage" id="pcStage" style="padding:18px 12px" aria-live="polite">' +
      '<div class="row-letters" style="display:flex;gap:6px;font-size:1.8rem;font-weight:800">' +
      "<span>s</span><span>h</span><span>i</span><span>p</span></div>" +
      '<p class="dcap"><b>ship</b> has 4 letters. How many sounds do you make?</p></div>' +
      '<div class="demo-tap" style="margin-top:10px">' +
      '<button type="button" class="tapper" id="pcBtn">Show the sounds<span class="hintdot"></span></button>' +
      (L.audio.has("w_ship") ? '<button type="button" class="tapper" data-play="w_ship">Hear the word</button>' : "") +
      "</div>" +
      '<p style="margin:10px 0 0;font-size:.9rem;color:var(--ink-soft)">' +
      "<b>ship</b> has 4 letters but only <b>3 phonemes</b>: /ʃ/ /ɪ/ /p/.</p></div>";

    var btn = $("#pcBtn", host);
    btn.addEventListener("click", function () {
      btn.classList.add("seen", "on");
      btn.disabled = true;
      $("#pcStage", host).innerHTML = collapseView(demo) +
        '<p class="dcap">The <b>s</b> and the <b>h</b> merge into one sound, /ʃ/.</p>';
      L.tieIPA($("#pcStage", host));
    });
  }

  /* --- The three systems (Lab 2, Trail 1) ----------------- */
  function demoSystems(host) {
    host.innerHTML =
      '<div class="demo"><h4>Worked example, tap each system</h4>' +
      '<div class="demo-tap">' +
      '<button type="button" class="tapper" data-sys="resp">Respiratory<span class="hintdot"></span></button>' +
      '<button type="button" class="tapper" data-sys="lar">Laryngeal<span class="hintdot"></span></button>' +
      '<button type="button" class="tapper" data-sys="supra">Supralaryngeal<span class="hintdot"></span></button>' +
      "</div>" +
      '<div class="demo-stage empty" id="demoStage" aria-live="polite">' +
      '<p class="dcap">Tap each system to see what it contributes.</p></div>' +
      '<p style="margin:10px 0 0;font-size:.9rem;color:var(--ink-soft)">' +
      "Every part you will sort belongs to exactly one of these three.</p></div>";

    var stage = $("#demoStage", host);
    var VIEWS = {
      resp: { icon: "resp", cap: "<b>Respiratory</b>: the power supply. The lungs push a steady " +
        "stream of air upward, and without that airflow there is nothing to turn into sound." },
      lar: { icon: "lar", cap: "<b>Laryngeal</b>: the sound source. Inside the larynx, the vocal " +
        "folds sit in the airstream, and when they vibrate, the air starts to buzz." },
      supra: { icon: "supra", cap: "<b>Supralaryngeal</b>: the resonating chambers. Everything " +
        "above the larynx (the throat, mouth and nose) shapes that buzz into speech sounds." }
    };
    $$(".tapper", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-sys");
        $$(".tapper", host).forEach(function (b) {
          b.classList.toggle("on", b === btn);
          if (b === btn) b.classList.add("seen");
        });
        stage.classList.remove("empty");
        stage.innerHTML = '<div class="pic-row">' +
          ART.systemIcon(VIEWS[key].icon, { cls: "big" }) + "</div>" +
          '<p class="dcap">' + VIEWS[key].cap + "</p>";
      });
    });
  }

  /* --- The pathway (Lab 2, Trail 2) ------------------------ */
  function demoPathway(host) {
    var order = ["lungs", "trachea", "larynx", "vocal_folds", "pharynx",
                 "nasal_cavity", "oral_cavity", "tongue", "hard_palate", "lips"];
    var caps = {
      lungs: "It starts in the <b>lungs</b>: a steady push of air.",
      trachea: "Up the <b>trachea</b>, the windpipe.",
      larynx: "Through the <b>larynx</b>&hellip;",
      vocal_folds: "&hellip;where the <b>vocal folds</b> set it buzzing.",
      pharynx: "The buzz rises through the <b>pharynx</b>, the throat.",
      nasal_cavity: "Some sounds resonate in the <b>nasal cavity</b>&hellip;",
      oral_cavity: "&hellip;most are shaped in the <b>oral cavity</b>,",
      tongue: "sculpted by the <b>tongue</b>,",
      hard_palate: "against the <b>hard palate</b>,",
      lips: "and released at the <b>lips</b>. That is the whole journey."
    };
    var intro = "Tap <b>Watch the air travel</b> to follow the air one stop at a time.";

    host.innerHTML =
      '<div class="demo"><h4>Worked example</h4>' +
      '<div class="demo-stage" id="pwStage" style="padding:14px 10px">' +
      '<div class="diagram-wrap demo-diagram">' + ART.sagittal() + "</div>" +
      '<p class="dcap" id="pwCap">' + intro + "</p></div>" +
      '<div class="demo-tap" style="margin-top:10px">' +
      '<button type="button" class="tapper" id="pwBtn">Watch the air travel<span class="hintdot"></span></button>' +
      "</div></div>";

    var btn = $("#pwBtn", host), cap = $("#pwCap", host);
    var rgns = {};
    $$(".rgn", host).forEach(function (g) { rgns[g.getAttribute("data-v")] = g; });
    var k = -1;                       // -1 = not started

    btn.addEventListener("click", function () {
      btn.classList.add("seen");
      if (k >= order.length - 1) {    // finished: reset for another walk
        order.forEach(function (id) { rgns[id] && rgns[id].classList.remove("flow", "flow-now"); });
        k = -1;
        cap.innerHTML = intro;
        btn.textContent = "Watch the air travel";
        return;
      }
      if (k >= 0 && rgns[order[k]]) rgns[order[k]].classList.remove("flow-now");
      k++;
      var id = order[k];
      if (rgns[id]) rgns[id].classList.add("flow", "flow-now");
      cap.innerHTML = caps[id];
      btn.textContent = k === order.length - 1 ? "Watch it again" : "Next stop";
    });
  }

  /* --- The word builder (Lab 2, Trail 3) ------------------- */
  /* Lab 2 builds "bee"; a leg may carry its own example in leg.demo
     ({word, audio, tiles, want, cap, ok}), which Lab 3 uses for "egg". */
  var BEE_DEMO = {
    word: "bee", audio: "w_bee", want: ["b", "iy"],
    tiles: [{ ipa: "b", slug: "b" }, { ipa: "ʃ", slug: "sh" }, { ipa: "i", slug: "iy" }],
    cap: "<b>bee</b> has three letters but two sounds. Tap the sounds in order. Tap a filled box to take it back out.",
    ok: "<b>/b/ + /i/ = bee.</b> Two sounds, and the double <b>e</b> spells just one of them."
  };

  function demoBuilder(host) {
    var leg = L.legs.filter(function (l) { return l.id === "wb"; })[0];
    var D = (leg && leg.demo) || BEE_DEMO;
    var tiles = D.tiles, want = D.want;
    var fill = want.map(function () { return null; });

    host.innerHTML =
      '<div class="demo"><h4>Worked example, build the word</h4>' +
      '<div class="demo-stage" id="wbStage" style="padding:16px 12px">' +
      '<div class="target wb-target" style="padding:4px 0 8px">' +
      '<span class="target-word wb-word" style="font-size:1.7rem">' + esc(D.word) +
      L.audio.btn(D.audio, "Hear it") + "</span>" +
      (ART.wordIcon(D.word) ? '<span class="wb-pic">' + ART.wordIcon(D.word) + "</span>" : "") +
      "</div>" +
      '<div class="slots" id="dSlots"></div>' +
      '<div class="tilebank" id="dTiles"></div>' +
      '<p class="dcap" id="dCap">' + D.cap + "</p></div></div>";

    var slotHost = $("#dSlots", host), tileHost = $("#dTiles", host), cap = $("#dCap", host);

    function paint() {
      slotHost.innerHTML = fill.map(function (sl, i) {
        var t = sl && tiles.filter(function (x) { return x.slug === sl; })[0];
        return '<button type="button" class="slot' + (sl ? " full" : "") + '" data-i="' + i +
          '" aria-label="Position ' + (i + 1) + (sl ? ", contains /" + t.ipa + "/, press to remove" : ", empty") +
          '">' + (sl ? "/" + t.ipa + "/" : "") + "</button>";
      }).join("");
      tileHost.innerHTML = tiles.map(function (t) {
        return '<button type="button" class="tile" data-slug="' + t.slug +
          '" aria-label="The sound ' + t.ipa + '">/' + t.ipa + "/</button>";
      }).join("");
      $$(".slot", slotHost).forEach(function (b) {
        b.addEventListener("click", function () {
          var i = +b.getAttribute("data-i");
          if (fill[i]) { fill[i] = null; paint(); }
        });
      });
      $$(".tile", tileHost).forEach(function (b) {
        b.addEventListener("click", function () {
          var i = fill.indexOf(null);
          if (i < 0) return;
          fill[i] = b.getAttribute("data-slug");
          if (L.audio.has("ipa_" + fill[i])) L.audio.play("ipa_" + fill[i]);
          paint();
          if (fill.indexOf(null) < 0) {
            var ok = fill.join(".") === want.join(".");
            cap.innerHTML = ok
              ? D.ok
              : "Not this word yet. Tap a filled box to take a sound back out and try another order.";
          }
        });
      });
      L.tieIPA(slotHost); L.tieIPA(tileHost);
    }
    paint();
  }

  /* --- The articulators (Lab 3, Trail 1) ------------------- */
  /* The drawn map at rest; tapping a sound moves the mouth into it, with its
     recording in step, and lights and labels the parts it uses. */
  function demoArticulators(host) {
    // a bank may bring its own three sounds (leg.demo.steps, Lab 4 onward), so the
    // worked example never gives away one of that lab's questions
    var leg = L.legs.filter(function (l) { return l.id === "af"; })[0];
    var STEPS = (leg && leg.demo && leg.demo.steps) || [
      { ipa: "m", audio: "ipa_m", show: ["lips"],
        cap: "<b>/m/</b> uses the <b>lips</b>, and only the lips: they close, and the sound hums out through the nose. One articulator." },
      { ipa: "d", audio: "ipa_d", show: ["tip", "alveolar"],
        cap: "<b>/d/</b> uses two: the <b>tongue tip</b> is the part that moves, and the <b>alveolar ridge</b> just behind the upper teeth is where it lands." },
      { ipa: "k", audio: "ipa_k", show: ["back", "velum"],
        cap: "<b>/k/</b> is made at the very back: the <b>back of the tongue</b> rises to the <b>velum</b>, the soft part of the roof of the mouth. Two again." }
    ];
    var LABEL = {};
    ((leg && leg.regions) || []).forEach(function (r) { LABEL[r.v] = r.label; });
    function slugOf(st) { return (st.audio || "").replace(/^ipa_/, "") || ipaSlug(st.ipa); }
    host.innerHTML =
      '<div class="demo"><h4>Worked example, tap a sound</h4>' +
      '<div class="demo-tap">' + STEPS.map(function (st, i) {
        return '<button type="button" class="tapper" data-i="' + i + '">/' + st.ipa +
          '/<span class="hintdot"></span></button>';
      }).join("") + "</div>" +
      '<div class="demo-stage" id="afStage" style="padding:14px 10px">' +
      '<div class="am-wrap demo-diagram" id="afMap">' + ART.amap(slugOf(STEPS[0])) + "</div>" +
      '<p class="dcap" id="afCap">The mouth at rest. Tap a sound to watch the mouth make it ' +
      "and see which parts it uses.</p>" + figCredit() +
      "</div></div>";

    var cap = $("#afCap", host), mapHost = $("#afMap", host);
    $$(".tapper", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var st = STEPS[+btn.getAttribute("data-i")];
        $$(".tapper", host).forEach(function (b) {
          b.classList.toggle("on", b === btn);
          if (b === btn) b.classList.add("seen");
        });
        // a fresh map in this sound, from rest
        mapHost.innerHTML = ART.amap(slugOf(st));
        var fig = $(".am-fig", mapHost), map = ART.amapCtl(fig);
        $$(".rgn", mapHost).forEach(function (g) {
          g.classList.toggle("flow-now", st.show.indexOf(g.getAttribute("data-v")) >= 0);
        });
        map.labels(st.show.map(function (v) { return { v: v, text: LABEL[v] || v, cls: "now" }; }));
        cap.innerHTML = st.cap;
        L.tieIPA(cap);
        syncPlay(map, fig, true, null);
      });
    });
    L.tieIPA(host);
  }

  /* --- Sound Detective (Lab 3, Trail 2) -------------------- */
  function demoDetective(host) {
    // likewise: leg.demo = {panel, clues: [{k, btn, cap}], audio} replaces the /b/ example
    var leg = L.legs.filter(function (l) { return l.id === "sd"; })[0];
    var D = (leg && leg.demo) || {};
    var panel = D.panel || { show: ["lips"], flow: "stop", place: "Both lips pressed together",
      manner: "Air is blocked completely, then released in a burst", voiced: true };
    var CLUES = D.clues || [
      { k: "where", btn: "Where?", cap: "<b>Where:</b> the lit parts are the two lips, pressed together. So it is a lip sound: /p/, /b/ or /m/." },
      { k: "how", btn: "How?", cap: "<b>How:</b> the burst mark means the air is blocked completely and then let go. That rules out /m/, which sends air through the nose. /p/ or /b/." },
      { k: "voice", btn: "Voice?", cap: "<b>Voice:</b> the badge says the vocal folds vibrate. Of /p/ and /b/, only /b/ is voiced. <b>The sound is /b/.</b>" }
    ];
    var slug = D.slug || (D.audio || "ipa_b").replace(/^ipa_/, "");
    host.innerHTML =
      '<div class="demo"><h4>Worked example, read the three clues</h4>' +
      '<div class="demo-stage" id="sdStage" style="padding:14px 10px">' +
      panelHTML(panel, { demo: true, slug: slug }) +
      '<p class="dcap" id="sdCap">Press <b>Play</b> to watch the sound being made, then tap the three clues in order.</p>' +
      figCredit() + "</div>" +
      '<div class="demo-tap" style="margin-top:10px">' + CLUES.map(function (c) {
        return '<button type="button" class="tapper" data-k="' + c.k + '">' + c.btn + '<span class="hintdot"></span></button>';
      }).join("") + "</div></div>";
    var cap = $("#sdCap", host), pan = $(".sd-panel", host), wrap = $(".rd-fig", host);
    var F = wireFig(wrap);
    $$(".tapper", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.getAttribute("data-k");
        var c = CLUES.filter(function (x) { return x.k === k; })[0];
        $$(".tapper", host).forEach(function (b) {
          b.classList.toggle("on", b === btn);
          if (b === btn) b.classList.add("seen");
        });
        pan.setAttribute("data-clue", k);
        wrap.setAttribute("data-clue", k);
        cap.innerHTML = c.cap + (k === "voice" ? " " + hearWatchBtn(slug) : "");
        var hw = $(".hw-btn", cap);
        if (hw && F) hw.addEventListener("click", function () { F.play(true, hw); });
        if (k === "how" && F) F.play(false);
        L.tieIPA(cap);
      });
    });
  }

  /* The Sound Detective panel: the drawn mouth set in the sound's own position
     (Lab 6's figure, with its Play button), then the three clues in words. Labs 3
     and 4 give the clues in words beside the picture; Labs 6 and 7 leave them out. */
  function panelHTML(panel, opts) {
    opts = opts || {};
    var voiced = !!panel.voiced;
    return '<div class="sd-panel' + (opts.demo ? " is-demo" : "") + '">' +
      '<div class="sd-fig">' + readFig(opts.slug, { noDesc: true }) + "</div>" +
      '<div class="sd-clues">' +
      '<div class="clue clue-where"><span class="clue-k">Where</span><span class="clue-v">' + esc(panel.place) + "</span></div>" +
      '<div class="clue clue-how"><span class="clue-k">How</span><span class="clue-v">' + esc(panel.manner) + "</span></div>" +
      '<div class="clue clue-voice ' + (voiced ? "on" : "off") + '"><span class="clue-k">Voice</span>' +
      '<span class="clue-v"><span class="voice-badge" aria-hidden="true">' +
      (voiced
        ? '<svg viewBox="0 0 40 20"><path d="M2 10 Q6 1 10 10 T18 10 T26 10 T34 10 T38 10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
        : '<svg viewBox="0 0 40 20"><path d="M2 10 H38" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>') +
      "</span>" + (voiced ? "Vocal folds vibrating (voiced)" : "Vocal folds still (voiceless)") +
      "</span></div></div></div>";
  }

  /* ---------------------------------------------------------
     Item screen
     --------------------------------------------------------- */
  function item(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    if (it.type === "choice") return itemChoice(host, sc);
    if (it.type === "spot") return itemSpot(host, sc);
    if (it.type === "build") return itemBuild(host, sc);
    if (it.type === "multispot") return itemMultiSpot(host, sc);
    if (it.type === "pick") return itemPick(host, sc);
    if (it.type === "hear") return itemHear(host, sc);
    if (it.type === "tongue") return itemTongue(host, sc);
    if (it.type === "procs") return itemProcs(host, sc);
    if (it.type === "read") return itemRead(host, sc);
    if (it.type === "transcribe") return itemTranscribe(host, sc);
    var already = L.state.given[sc.t] != null;
    var isBool = it.type === "boolean";

    var target;
    if (isBool) {
      target =
        '<div class="pair">' +
        pairRow(it.a) + pairRow(it.b) +
        "</div>";
    } else {
      target =
        '<div class="target"><span class="target-word">' + esc(it.word) + "</span>" +
        L.audio.btn(it.audio, "Hear it") + "</div>";
    }

    var opts = "";
    if (isBool) {
      opts = '<div class="answers two">' +
        optBtn("true", leg.choices[0], 1) +
        optBtn("false", leg.choices[1], 2) + "</div>";
    } else {
      opts = '<div class="answers">' + leg.choices.map(function (c, i) {
        return optBtn(String(c), String(c), i + 1);
      }).join("") + "</div>";
    }

    host.innerHTML =
      '<div class="item-head"><span class="item-count">' + UNIT + " " + leg.n + " · question " +
      (sc.i + 1) + " of " + leg.items.length + " · " + (sc.t + 1) + " of " + L.total + "</span></div>" +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      target + opts +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    var picked = null;

    $$(".opt", host).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        picked = b.getAttribute("data-v");
        $$(".opt", host).forEach(function (x) { x.classList.toggle("sel", x === b); });
        $("#actBtn").disabled = false;
      });
    });

    if (already) {
      lockAndReveal(true);
    } else {
      onAct(function () {
        if (picked == null) return;
        var value = isBool ? picked === "true" : +picked;
        L.answer(sc, value, $(".opt.sel", host));
        lockAndReveal(false);
      });
    }

    function pairRow(side) {
      return '<div class="pair-row"><span class="pw">' + esc(side.word) + "</span>" +
        L.audio.btn(side.audio, "Hear it") + "</div>";
    }

    /* The number key still works, it just is not advertised on the face of the
       button. aria-keyshortcuts keeps it discoverable to assistive technology. */
    function optBtn(v, label, k) {
      return '<button type="button" class="opt" data-v="' + v +
        '" aria-keyshortcuts="' + k + '">' + esc(label) + "</button>";
    }

    function lockAndReveal(silent) {
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t);
      var alt = L.isAlternate(sc.t);
      var right = exact || alt;
      var givenKey = L.keyOf(it, given);
      var answerKey = L.keyOf(it, it.answer);

      $$(".opt", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        b.classList.remove("sel");
        if (v === answerKey) b.classList.add("is-good");
        else if (v === givenKey) b.classList.add(alt ? "is-alt" : "is-bad");
        else if (it.accept && it.accept[v]) b.classList.add("is-alt-quiet");
      });

      if (!right && !silent && !L.reduced) {
        stageCard.classList.add("shake");
        setTimeout(function () { stageCard.classList.remove("shake"); }, 240);
      }

      var reveal = isBool
        ? '<div class="reveal">' + alignRows(it, { audio: true }) +
          '<div style="text-align:center"><span class="verdict ' + (it.answer ? "yes" : "no") + '">' +
          (it.answer ? "✓ minimal pair" : "✕ not a minimal pair") + "</span></div></div>"
        : leg.id === "mb"
          ? '<div class="reveal">' + morphemeChips(it) + "</div>"
          : '<div class="reveal">' + collapseView(it) + "</div>";

      var aim = alt
        ? '<div class="fb-aim">' + it.accept[givenKey] + "</div>"
        : (it.miss && it.miss[givenKey]
          ? '<div class="fb-aim"><b>Where that came from:</b> ' + it.miss[givenKey] + "</div>"
          : "");
      var note = it.note
        ? '<div class="callout c-info" style="margin:14px 0 0"><span class="ic" aria-hidden="true">&#9432;</span>' +
          "<p style=\"margin:0\">" + it.note + "</p></div>"
        : "";

      var tone = exact ? "good" : alt ? "alt" : "bad";
      var mark = exact ? "&#10003;" : alt ? "&#189;" : "&#10007;";
      var headline = exact ? "Correct" : alt ? "Not quite" : "Not this time";
      var badge = exact
        ? '<span style="margin-left:auto">' +
          ART.gem().replace("<svg", '<svg style="width:22px;height:22px"') + "</span>"
        : alt
          ? '<span class="half">' + ART.gemHalf() + "half a gem</span>"
          : "";

      $("#fbHost", host).innerHTML =
        '<div class="fb ' + tone + '" role="status">' +
        '<div class="fb-head"><span class="mark">' + mark + "</span>" + headline + badge +
        "</div>" +
        '<div class="fb-body"><p>' + it.explain + "</p>" + aim + "</div>" +
        reveal + note + "</div>";

      L.tieIPA($("#fbHost", host));

      var b = $("#actBtn");
      b.disabled = false;
      b.textContent = sc.t === L.total - 1 ? "See your results" : "Continue";
      b.replaceWith(b.cloneNode(true));
      onAct(function () { L.next(); });
    }
  }

  /* ---------------------------------------------------------
     Shared pieces for the Lab 2 item types
     --------------------------------------------------------- */
  function itemHead(sc, leg) {
    return '<div class="item-head"><span class="item-count">' + UNIT + " " + leg.n +
      " · question " + (sc.i + 1) + " of " + leg.items.length + " · " + (sc.t + 1) +
      " of " + L.total + "</span></div>";
  }

  /* The feedback panel every reveal shares: verdict, explanation, targeted
     line, standing note. revealHTML is whatever the activity shows back. */
  function fbHTML(sc, it, revealHTML) {
    var given = L.state.given[sc.t];
    var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
    var givenKey = L.keyOf(it, given);
    var aim = alt
      ? '<div class="fb-aim">' + it.accept[givenKey] + "</div>"
      : (it.miss && it.miss[givenKey]
        ? '<div class="fb-aim"><b>Where that came from:</b> ' + it.miss[givenKey] + "</div>"
        : "");
    var note = it.note
      ? '<div class="callout c-info" style="margin:14px 0 0"><span class="ic" aria-hidden="true">&#9432;</span>' +
        "<p style=\"margin:0\">" + it.note + "</p></div>"
      : "";
    var tone = exact ? "good" : alt ? "alt" : "bad";
    var mark = exact ? "&#10003;" : alt ? "&#189;" : "&#10007;";
    var headline = exact ? "Correct" : alt ? "Not quite" : "Not this time";
    var badge = exact
      ? '<span style="margin-left:auto">' +
        ART.gem().replace("<svg", '<svg style="width:22px;height:22px"') + "</span>"
      : alt
        ? '<span class="half">' + ART.gemHalf() + "half a gem</span>"
        : "";
    return '<div class="fb ' + tone + '" role="status">' +
      '<div class="fb-head"><span class="mark">' + mark + "</span>" + headline + badge + "</div>" +
      '<div class="fb-body"><p>' + it.explain + "</p>" + aim + "</div>" +
      (revealHTML || "") + note + "</div>";
  }

  function armContinue(sc) {
    var b = $("#actBtn");
    b.disabled = false;
    b.textContent = sc.t === L.total - 1 ? "See your results" : "Continue";
    b.replaceWith(b.cloneNode(true));
    onAct(function () { L.next(); });
  }

  function shake(cardEl) {
    if (L.reduced) return;
    cardEl.classList.add("shake");
    setTimeout(function () { cardEl.classList.remove("shake"); }, 240);
  }

  /* Pointer-event dragging. A short press with no movement falls through to
     the element's own click handler, so everything draggable in these labs
     can also be done by tapping, and by keyboard through the same buttons. */
  function dragify(src, opts) {
    var ghost = null, active = false, pid = null, moved = false, sx = 0, sy = 0, lastOver = null;

    function targetAt(x, y) {
      var el = d.elementFromPoint(x, y);
      while (el && el !== d.body && el !== d.documentElement) {
        if (el.matches && el.matches(opts.match)) return el;
        el = el.parentNode && el.parentNode.nodeType === 1 ? el.parentNode : null;
      }
      return null;
    }
    function cleanup() {
      if (ghost) { ghost.remove(); ghost = null; }
      src.classList.remove("drag-src");
      if (lastOver) { lastOver.classList.remove("drop-hot"); lastOver = null; }
      active = false; moved = false;
    }
    src.addEventListener("pointerdown", function (e) {
      if (opts.disabled && opts.disabled()) return;
      if (e.button != null && e.button !== 0) return;
      active = true; moved = false; pid = e.pointerId; sx = e.clientX; sy = e.clientY;
      try { src.setPointerCapture(pid); } catch (err) {}
    });
    src.addEventListener("pointermove", function (e) {
      if (!active || e.pointerId !== pid) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
      if (!moved) {
        moved = true;
        var r = src.getBoundingClientRect();
        ghost = src.cloneNode(true);
        ghost.classList.add("drag-ghost");
        ghost.style.width = r.width + "px";
        ghost.style.height = r.height + "px";
        d.body.appendChild(ghost);
        src.classList.add("drag-src");
      }
      ghost.style.left = (e.clientX - ghost.offsetWidth / 2) + "px";
      ghost.style.top = (e.clientY - ghost.offsetHeight * 0.7) + "px";
      var t = targetAt(e.clientX, e.clientY);
      if (t !== lastOver) {
        if (lastOver) lastOver.classList.remove("drop-hot");
        if (t) t.classList.add("drop-hot");
        lastOver = t;
      }
      e.preventDefault();
    });
    src.addEventListener("pointerup", function (e) {
      if (!active || e.pointerId !== pid) return;
      var wasMoved = moved;
      var t = wasMoved ? targetAt(e.clientX, e.clientY) : null;
      cleanup();
      if (wasMoved && t) opts.drop(t);
    });
    src.addEventListener("pointercancel", cleanup);
  }

  /* A label pinned over the diagram at a region's anchor point. */
  function sagPin(regionId, text, cls) {
    var a = ART.sagAnchor[regionId];
    if (!a) return "";
    return '<span class="sag-pin ' + (cls || "") + '" style="left:' +
      (a[0] / ART.sagW * 100).toFixed(2) + "%;top:" + (a[1] / ART.sagH * 100).toFixed(2) + '%">' +
      esc(text) + "</span>";
  }

  /* ---------------------------------------------------------
     Sort into a system (Lab 2, Trail 1)
     One part, three bins. Drag the chip into a bin, or tap the
     bin; Check locks it in.
     --------------------------------------------------------- */
  function itemChoice(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = null, locked = false;

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      '<div class="target"><span class="target-word">' + esc(it.word) + "</span></div>" +
      '<div class="answers bins">' + leg.choices.map(function (c, i) {
        return '<button type="button" class="opt bin" data-v="' + c.v +
          '" aria-keyshortcuts="' + (i + 1) + '">' +
          '<span class="bin-icon">' + ART.systemIcon(c.icon) + "</span>" +
          '<span class="bin-name">' + esc(c.label) + "</span>" +
          '<span class="bin-tag">' + esc(c.tag) + "</span>" +
          '<span class="bin-slot" aria-hidden="true"></span></button>';
      }).join("") + "</div>" +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);

    function dock(v, cls) {
      $$(".bin-slot", host).forEach(function (s) { s.innerHTML = ""; });
      var bin = $('.bin[data-v="' + v + '"] .bin-slot', host);
      if (bin) bin.innerHTML = '<span class="mini-chip ' + (cls || "") + '">' + esc(it.word) + "</span>";
    }
    function select(v) {
      if (locked) return;
      picked = v;
      $$(".bin", host).forEach(function (b) {
        b.classList.toggle("sel", b.getAttribute("data-v") === v);
      });
      dock(v, "");
      $("#actBtn").disabled = false;
    }

    $$(".bin", host).forEach(function (b) {
      b.addEventListener("click", function () { if (!b.disabled) select(b.getAttribute("data-v")); });
    });

    function lock(silent) {
      locked = true;
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      var givenKey = L.keyOf(it, given), answerKey = L.keyOf(it, it.answer);
      $$(".bin", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        b.classList.remove("sel");
        if (v === answerKey) b.classList.add("is-good");
        else if (v === givenKey) b.classList.add(alt ? "is-alt" : "is-bad");
        else if (it.accept && it.accept[v]) b.classList.add("is-alt-quiet");
      });
      $$(".bin-slot", host).forEach(function (s) { s.innerHTML = ""; });
      var goodBin = $('.bin[data-v="' + answerKey + '"] .bin-slot', host);
      if (goodBin) goodBin.innerHTML = '<span class="mini-chip good">' + esc(it.word) + "</span>";
      if (!exact && givenKey !== answerKey) {
        var badBin = $('.bin[data-v="' + givenKey + '"] .bin-slot', host);
        if (badBin) badBin.innerHTML = '<span class="mini-chip ' + (alt ? "alt" : "bad") + '">' +
          esc(it.word) + "</span>";
      }
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, "");
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    if (already) lock(true);
    else onAct(function () {
      if (picked == null || locked) return;
      L.answer(sc, picked, $('.bin[data-v="' + picked + '"]', host));
      lock(false);
    });
  }

  /* ---------------------------------------------------------
     Place on the diagram (Lab 2, Trail 2)
     One label, one figure. Drag the label onto a region, or tap
     the region; Check locks it in. A visually hidden button per
     region carries the keyboard and screen-reader path.
     --------------------------------------------------------- */
  function itemSpot(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = null, locked = false;

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      '<div class="target"><span class="target-word">' + esc(it.word) + "</span></div>" +
      '<div class="diagram-wrap" id="dgWrap">' + ART.sagittal() +
      '<div class="sag-overlay" id="pinHost"></div></div>' +
      '<div role="group" aria-label="Places on the diagram">' + leg.regions.map(function (r, i) {
        return '<button type="button" class="opt vh" data-v="' + r.v +
          '" aria-keyshortcuts="' + (i < 9 ? i + 1 : 0) + '">' + esc(r.label) + "</button>";
      }).join("") + "</div>" +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    var pinHost = $("#pinHost", host);
    var rgns = $$(".rgn", host);

    function select(v) {
      if (locked) return;
      picked = v;
      rgns.forEach(function (g) {
        g.classList.toggle("sel", g.getAttribute("data-v") === v);
      });
      pinHost.innerHTML = sagPin(v, it.word, "picked");
      $("#actBtn").disabled = false;
    }

    rgns.forEach(function (g) {
      g.classList.add("live");
      g.addEventListener("click", function () { select(g.getAttribute("data-v")); });
    });
    $$("button.opt.vh", host).forEach(function (b) {
      b.addEventListener("click", function () { if (!b.disabled) select(b.getAttribute("data-v")); });
    });

    function lock(silent) {
      locked = true;
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      var givenKey = L.keyOf(it, given), answerKey = L.keyOf(it, it.answer);
      rgns.forEach(function (g) {
        var v = g.getAttribute("data-v");
        g.classList.remove("sel", "live");
        if (v === answerKey) g.classList.add("is-good");
        else if (v === givenKey) g.classList.add(alt ? "is-alt" : "is-bad");
      });
      $$("button.opt.vh", host).forEach(function (b) { b.disabled = true; });
      var pins = sagPin(answerKey, it.word, "good");
      if (!exact && givenKey !== answerKey) {
        pins += sagPin(givenKey, it.word, alt ? "alt" : "bad");
      }
      pinHost.innerHTML = pins;
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, "");
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    if (already) lock(true);
    else onAct(function () {
      if (picked == null || locked) return;
      L.answer(sc, picked, $("#dgWrap", host));
      lock(false);
    });
  }

  /* ---------------------------------------------------------
     Build the word (Lab 2, Trail 3)
     Tap tiles to stamp sounds into the slots, in order. A tile
     can be used twice; tapping a filled slot takes it back out.
     Every stamp plays its recording when this build has one.
     --------------------------------------------------------- */
  function itemBuild(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var locked = false;
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    var ans = it.answer.split(".");
    var fill = new Array(ans.length).fill(null);
    if (already) {
      var g = String(L.state.given[sc.t]).split(".");
      for (var k = 0; k < fill.length && k < g.length; k++) fill[k] = g[k] || null;
    }

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      '<div class="target wb-target">' +
      '<span class="target-word wb-word">' + esc(it.word) +
      L.audio.btn(it.audio, "Hear it") + "</span>" +
      (ART.wordIcon(it.word) ? '<span class="wb-pic">' + ART.wordIcon(it.word) + "</span>" : "") +
      "</div>" +
      '<div class="slots" id="slotHost"></div>' +
      '<div class="tilebank" id="tileHost" role="group" aria-label="The sounds you can use"></div>' +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    var slotHost = $("#slotHost", host), tileHost = $("#tileHost", host);

    function place(i, slug) {
      if (locked || i < 0) return;
      fill[i] = slug;
      if (L.audio.has("ipa_" + slug)) L.audio.play("ipa_" + slug);
      paint();
    }

    function paint(marks) {
      slotHost.innerHTML = fill.map(function (sl, i) {
        var cls = "slot" + (sl ? " full" : "") +
          (marks ? (marks[i] ? " ok" : " off") : "");
        return '<button type="button" class="' + cls + '" data-i="' + i +
          '"' + (locked ? " disabled" : "") + ' aria-label="Position ' + (i + 1) +
          (sl ? ", contains /" + IPA_OF[sl] + "/" + (locked ? "" : ", press to remove") : ", empty") +
          '">' + (sl ? "/" + IPA_OF[sl] + "/" : "") + "</button>";
      }).join("");
      function tileBtn(t) {
        return '<button type="button" class="tile"' + (locked ? " disabled" : "") +
          ' data-slug="' + t.slug + '" aria-label="The sound ' + t.ipa + '">/' + t.ipa + "/</button>";
      }
      function tileRow(cat, label) {
        var tiles = leg.tiles.filter(function (t) { return (t.cat || "c") === cat; });
        if (!tiles.length) return "";
        return '<div class="tile-row" role="group" aria-label="' + label + '">' +
          '<span class="tile-row-lab" aria-hidden="true">' + label + "</span>" +
          '<span class="tile-row-tiles">' + tiles.map(tileBtn).join("") + "</span></div>";
      }
      tileHost.innerHTML = tileRow("c", "Consonants") + tileRow("v", "Vowels");
      if (!locked) {
        $$(".slot", slotHost).forEach(function (b) {
          b.addEventListener("click", function () {
            var i = +b.getAttribute("data-i");
            if (fill[i]) { fill[i] = null; paint(); }
          });
        });
        $$(".tile", tileHost).forEach(function (b) {
          b.addEventListener("click", function () { place(fill.indexOf(null), b.getAttribute("data-slug")); });
          dragify(b, {
            match: ".slot",
            disabled: function () { return locked; },
            drop: function (el) { place(+el.getAttribute("data-i"), b.getAttribute("data-slug")); }
          });
        });
      }
      $("#actBtn").disabled = locked || fill.indexOf(null) >= 0;
      L.tieIPA(slotHost); L.tieIPA(tileHost);
    }

    /* letters collapsing into sounds, the same reveal vocabulary as Lab 1 */
    function reveal() {
      var letters = "";
      it.chips.forEach(function (c, ci) {
        for (var k = 0; k < c.letters.length; k++) {
          letters += '<span class="' + (c.letters.length > 1 ? "merged" : "") +
            '" data-chip="' + ci + '">' + esc(c.letters[k]) + "</span>";
        }
      });
      var nL = it.word.length, nS = it.chips.length;
      return '<div class="reveal"><div class="collapse">' +
        '<div class="row-letters">' + letters + "</div>" +
        '<div class="tick">' + nL + (nL === 1 ? " letter" : " letters") + " on the page</div>" +
        '<div style="font-size:1.3rem;color:var(--acc);font-weight:800">&darr;</div>' +
        phonemeChips(it, true) +
        '<div class="tick">' + nS + (nS === 1 ? " sound" : " sounds") + " in the mouth</div>" +
        "</div></div>";
    }

    function lock(silent) {
      locked = true;
      var exact = L.isCorrect(sc.t);
      // a build that matched one of the item's other right answers (it.also) is marked against that one
      var ref = exact ? String(L.state.given[sc.t]).split(".") : ans;
      var marks = fill.map(function (sl, i) { return sl === ref[i]; });
      paint(marks);
      if (!exact && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, reveal());
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    paint();
    if (already) lock(true);
    else onAct(function () {
      if (locked || fill.indexOf(null) >= 0) return;
      L.answer(sc, fill.join("."), slotHost);
      lock(false);
    });
  }

  /* ---------------------------------------------------------
     Find the articulators (Labs 3 and 4, Trail 1)
     One sound, the drawn mouth at rest (ART.amap). Tap one or
     two regions to toggle them, Check locks the set in; the
     mouth then moves into the sound and labels the answer.
     The answer is the sorted, dot-joined set of region ids,
     so order is free.
     --------------------------------------------------------- */
  function itemMultiSpot(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = {}, locked = false;
    var LABEL = {};
    leg.regions.forEach(function (r) { LABEL[r.v] = r.label; });
    var audio = L.audio.forIPA(it.ipa), slug = ipaSlug(it.ipa);

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      '<div class="target"><span class="target-word ipa-word">/' + esc(it.ipa) + "/</span>" +
      L.audio.btn(audio, "Hear it") + "</div>" +
      '<div class="am-wrap" id="dgWrap">' + ART.amap(slug) + "</div>" +
      '<p class="ms-tally" id="msTally" aria-live="polite">Nothing tapped yet.</p>' +
      // the same ten parts as buttons: hidden on a wide screen (screen readers and keys use
      // them), shown as a row of chips on a phone, where some regions are small to tap
      '<div class="am-chips" role="group" aria-label="Articulators on the diagram">' + leg.regions.map(function (r, i) {
        return '<button type="button" class="opt vh" data-v="' + r.v + '" aria-pressed="false"' +
          ' aria-keyshortcuts="' + (i < 9 ? i + 1 : 0) + '">' + esc(r.label) + "</button>";
      }).join("") + "</div>" +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host), tally = $("#msTally", host);
    var fig = $(".am-fig", host), map = ART.amapCtl(fig);
    var rgns = $$(".rgn", host);

    // parts are named in the order of the map's region list, not the key's sort order
    function inMapOrder(k) {
      var order = leg.regions.map(function (r) { return r.v; });
      return k.split(".").sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    }
    function chosen() { return Object.keys(picked).filter(function (k) { return picked[k]; }).sort(); }

    function paint() {
      var set = chosen();
      rgns.forEach(function (g) { g.classList.toggle("sel", !!picked[g.getAttribute("data-v")]); });
      $$("button.opt.vh", host).forEach(function (b) {
        b.setAttribute("aria-pressed", String(!!picked[b.getAttribute("data-v")]));
      });
      // no labels while choosing: they would sit over the small regions next door
      tally.innerHTML = set.length
        ? "Tapped: " + set.map(function (v) { return "<b>" + esc(LABEL[v]) + "</b>"; }).join(" + ") +
          '<span class="ms-hint"> (tap again to remove)</span>'
        : "Nothing tapped yet.";
      $("#actBtn").disabled = !set.length;
    }
    function toggle(v) {
      if (locked) return;
      picked[v] = !picked[v];
      paint();
    }

    rgns.forEach(function (g) {
      g.classList.add("live");
      g.addEventListener("click", function () { toggle(g.getAttribute("data-v")); });
    });
    $$("button.opt.vh", host).forEach(function (b) {
      b.addEventListener("click", function () { if (!b.disabled) toggle(b.getAttribute("data-v")); });
    });

    function lock(silent) {
      locked = true;
      var givenKey = String(L.state.given[sc.t]);
      var given = givenKey.split(".");
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      // when the student gave one of several right answers, that is the set to light
      var want = (exact ? givenKey : it.answer).split(".");
      var labels = [];
      rgns.forEach(function (g) {
        var v = g.getAttribute("data-v");
        g.classList.remove("sel", "live");
        var inWant = want.indexOf(v) >= 0, inGiven = given.indexOf(v) >= 0;
        if (inWant) {
          g.classList.add("is-good");
          labels.push({ v: v, text: LABEL[v], cls: "good" });
        } else if (inGiven) {
          g.classList.add(alt ? "is-alt" : "is-bad");
          labels.push({ v: v, text: LABEL[v], cls: alt ? "alt" : "bad" });
        }
      });
      $$("button.opt.vh", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        if (want.indexOf(v) >= 0) b.classList.add("is-good");
        else if (given.indexOf(v) >= 0) b.classList.add(alt ? "is-alt" : "is-bad");
      });
      map.labels(labels);
      // the mouth now makes the sound: from rest into it, once, without its recording
      if (silent || L.reduced) map.show(); else map.play();
      // an also-answer listed in it.quiet counts in full but is only named when it
      // is the one the student gave (Lab 4: a voiced sound plus the vocal folds)
      var sets = [it.answer].concat((it.also || []).filter(function (k) {
        return (it.quiet || []).indexOf(k) < 0 || k === givenKey;
      }));
      tally.innerHTML = (sets.length > 1 ? "Either counts: " : "The answer: ") + sets.map(function (k) {
        return inMapOrder(k).map(function (v) { return "<b>" + esc(LABEL[v]) + "</b>"; }).join(" + ");
      }).join(", or ") + " " + hearWatchBtn(slug);
      var hw = $(".hw-btn", tally);
      if (hw) hw.addEventListener("click", function () {
        fig.scrollIntoView({ block: "nearest", behavior: L.reduced ? "auto" : "smooth" });
        syncPlay(map, fig, true, hw);
      });
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, "");
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    paint();
    if (already) lock(true);
    else onAct(function () {
      var set = chosen();
      if (!set.length || locked) return;
      L.answer(sc, set.join("."), $("#dgWrap", host));
      lock(false);
    });
  }

  /* ---------------------------------------------------------
     Which sound am I (Lab 3, Trail 2)
     A figure panel, ten IPA tiles. Tap one, Check locks it in.
     --------------------------------------------------------- */
  function itemPick(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = null, locked = false;
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      panelHTML(it.panel, { slug: it.answer }) +
      '<div class="answers ipa-picks" role="group" aria-label="The sounds to choose from">' +
      leg.tiles.map(function (t, i) {
        return '<button type="button" class="opt pick" data-v="' + t.slug +
          '" aria-keyshortcuts="' + (i < 9 ? i + 1 : 0) + '" aria-label="The sound ' + esc(t.ipa) + '">/' +
          esc(t.ipa) + "/</button>";
      }).join("") + "</div>" +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    var F = wireFig($(".rd-fig", host));

    $$(".pick", host).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled || locked) return;
        picked = b.getAttribute("data-v");
        $$(".pick", host).forEach(function (x) { x.classList.toggle("sel", x === b); });
        $("#actBtn").disabled = false;
      });
    });

    function lock(silent) {
      locked = true;
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      var givenKey = L.keyOf(it, given), answerKey = L.keyOf(it, it.answer);
      $$(".pick", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        b.classList.remove("sel");
        if (v === answerKey) b.classList.add("is-good");
        else if (v === givenKey) b.classList.add(alt ? "is-alt" : "is-bad");
        else if (it.accept && it.accept[v]) b.classList.add("is-alt-quiet");
      });
      // the stamp is set in capitals; the symbol inside it must not be (ð would become Ð)
      var reveal = '<div class="reveal" style="text-align:center"><span class="verdict yes">' +
        'The sound: <span class="ipa-keep">/' + esc(IPA_OF[answerKey]) + "/</span></span> " +
        hearWatchBtn(answerKey) + "</div>";
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, reveal);
      var hw = $(".hw-btn", host);
      if (hw && F) hw.addEventListener("click", function () {
        $(".rd-fig", host).scrollIntoView({ block: "nearest", behavior: L.reduced ? "auto" : "smooth" });
        F.play(true, hw);
      });
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    L.tieIPA(host);
    if (already) lock(true);
    else {
      // the picture moves once on arrival, silently: its recording would give the answer away
      playSoon(F);
      onAct(function () {
        if (picked == null || locked) return;
        L.answer(sc, picked, $('.pick[data-v="' + picked + '"]', host));
        lock(false);
      });
    }
  }

  /* ---------------------------------------------------------
     Lab 6, Trail 1: read the picture (type "read")
     The drawn mouth set in the sound's own position (ART.cmouth):
     the shape shows where, the air shows how, the circle shows
     the vocal folds. No words until Check. It plays once, with
     no sound, when the question opens (hearing it would give the
     answer away), and again whenever the student presses Play.
     After Check, Hear and watch plays it with the recording, the
     burst or the hiss landing as the sound is heard.
     --------------------------------------------------------- */
  var MANNER_KEY = [
    ["stop", "Stop", "blocked, then a burst"],
    ["fric", "Fricative", "a narrow gap: a hiss"],
    ["affric", "Affricate", "a block that lets go into a hiss"],
    ["nasal", "Nasal", "velum down, out through the nose"],
    ["lateral", "Lateral", "around the sides of the tongue"],
    ["approx", "Glide or /ɹ/", "a wide gap, no hiss"]
  ];
  var FLOW_SAYS = { stop: "blocked, then a burst", fric: "squeezed through a narrow gap, a hiss",
    affric: "blocked, then let go into a hiss", nasal: "the velum is down and the air goes out through the nose",
    lateral: "around the sides of the tongue", approx: "through a wide gap, smoothly, with no hiss",
    glottal: "a soft hiss through the open vocal folds" };
  var SHAPE_SAYS = { bilabial: "both lips closed", labiodental: "the lower lip against the upper teeth",
    dental: "the tongue tip between the teeth", alv_stop: "the tongue tip on the alveolar ridge",
    alv_fric: "the tongue tip raised close to the alveolar ridge", postalv: "the tongue blade just behind the ridge",
    postalv_stop: "the tongue blade against the area just behind the ridge",
    retroflex: "the tongue tip raised toward the area behind the ridge, not touching",
    palatal: "the front of the tongue raised toward the hard palate",
    velar: "the back of the tongue against the velum",
    labiovelar: "the lips rounded and the back of the tongue raised toward the velum",
    glottal: "the mouth open; the vocal folds apart" };
  // a consonant's name in the three terms, for the recap chart
  var PLACE_NAME = { bilabial: "bilabial", labiodental: "labiodental", dental: "interdental", alv_stop: "alveolar",
    alv_fric: "alveolar", postalv: "postalveolar", postalv_stop: "postalveolar", retroflex: "postalveolar",
    palatal: "palatal", velar: "velar", labiovelar: "labial-velar", glottal: "glottal" };
  var MANNER_NAME = { stop: "stop", fric: "fricative", affric: "affricate", nasal: "nasal", lateral: "lateral",
    approx: "glide", glottal: "fricative" };
  function consName(slug) {
    var c = ART.cons[slug];
    var manner = slug === "r" ? "liquid" : MANNER_NAME[c.f];
    return (c.vo ? "voiced " : "voiceless ") + PLACE_NAME[c.s] + " " + manner;
  }
  function clipTimes(slug) {
    return (w.LAB_CLIP_TIMES || {})[slug] || { on: 0.01, off: 0.25, dur: 0.3 };
  }

  function keyGrid() {
    return '<div class="mk-grid">' + MANNER_KEY.map(function (m) {
      return '<div class="mk-cell">' + ART.mannerIcon(m[0]) + '<span><span class="mk-name">' + m[1] +
        '</span><span class="mk-gloss">' + m[2] + "</span></span></div>";
    }).join("") +
      '<div class="mk-cell">' + ART.foldsIcon(true) + '<span><span class="mk-name">Voiced</span>' +
      '<span class="mk-gloss">vocal folds closed and buzzing</span></span></div>' +
      '<div class="mk-cell">' + ART.foldsIcon(false) + '<span><span class="mk-name">Voiceless</span>' +
      '<span class="mk-gloss">vocal folds open and still</span></span></div></div>';
  }
  function keyHTML(open) {
    return '<details class="mkey"' + (open ? " open" : "") + "><summary>What do the marks mean?</summary>" +
      keyGrid() + "</details>";
  }

  /* The figure with its Play button, and for a screen reader the same three clues in
     words (a sighted student reads them off the picture). */
  function readFig(slug, opts) {
    opts = opts || {};
    var c = ART.cons[slug];
    return '<div class="rd-fig"' + (opts.id ? ' id="' + opts.id + '"' : "") + ">" +
      ART.cmouth(slug) +
      (L.reduced ? "" : '<button type="button" class="cm-play"' + (opts.playId ? ' id="' + opts.playId + '"' : "") +
        '><span aria-hidden="true">&#9654;</span> Play</button>') +
      (opts.noDesc ? "" : '<p class="vh">The picture: ' + esc(SHAPE_SAYS[c.s]) + ". The air: " + esc(FLOW_SAYS[c.f]) +
      ". The vocal folds: " + (c.vo ? "closed and buzzing" : "open and still") + ".</p>") + "</div>";
  }
  /* Play a drawn mouth once (a consonant figure, or the articulator map): with
     withSound, its recording in step, the burst or the hiss landing as it is heard. */
  function syncPlay(ctl, fig, withSound, srcBtn, done) {
    var slug = ctl.slug, T = clipTimes(slug), clip = "ipa_" + slug;
    var sound = withSound && L.audio.has(clip);
    clearTimeout(fig._cue);
    ctl.play({
      holdMs: sound ? (T.off - T.on) * 1000 + 150 : 0,
      cue: sound ? function (ms) {
        // the player waits PREROLL before it starts, and the clip's sound begins `on` in
        var lead = Math.max(0, ms - L.audio.PREROLL - T.on * 1000);
        fig._cue = setTimeout(function () { if (fig.isConnected) L.audio.play(clip, srcBtn || null); }, lead);
      } : null,
      done: done
    });
  }
  // the manifest slug for a symbol as the bank writes it (/ʃ/ -> sh)
  function ipaSlug(ipa) { return (w.LAB_IPA_SLUG || {})[ipa] || ipa; }

  /* Wire a figure's Play button. opts.sound plays the recording in step with it. */
  function wireFig(root, opts) {
    opts = opts || {};
    var fig = $(".cm-fig", root), btn = $(".cm-play", root);
    if (!fig) return null;
    var ctl = ART.cmouthCtl(fig);
    function play(withSound, srcBtn) {
      if (btn) { btn.disabled = true; btn.classList.add("on"); }
      syncPlay(ctl, fig, withSound, srcBtn, function () {
        if (btn) { btn.disabled = false; btn.classList.remove("on"); btn.innerHTML = '<span aria-hidden="true">&#8635;</span> Play again'; }
        if (opts.done) opts.done();
      });
    }
    if (btn) btn.addEventListener("click", function () { play(!!opts.sound); });
    return { ctl: ctl, play: play, fig: fig };
  }
  /* Play a figure once, shortly after it appears, if the screen is still up. */
  function playSoon(F, ms) {
    if (!F || L.reduced) return;
    setTimeout(function () { if (F.fig.isConnected) F.play(false); }, ms == null ? 650 : ms);
  }

  function cluesHTML(panel) {
    var voiced = !!panel.voiced;
    return '<div class="sd-clues">' +
      '<div class="clue clue-where"><span class="clue-k">Where</span><span class="clue-v">' + esc(panel.place) + "</span></div>" +
      '<div class="clue clue-how"><span class="clue-k">How</span><span class="clue-v">' + esc(panel.manner) + "</span></div>" +
      '<div class="clue clue-voice ' + (voiced ? "on" : "off") + '"><span class="clue-k">Voice</span>' +
      '<span class="clue-v">' + (voiced ? "Vocal folds vibrating (voiced)" : "Vocal folds still (voiceless)") +
      "</span></div></div>";
  }

  /* The sound's Hear and watch button: the recording and the moving mouth together. */
  function hearWatchBtn(slug) {
    if (!L.audio.has("ipa_" + slug)) return "";
    return '<button type="button" class="spk hw-btn" aria-label="Hear it and watch the mouth">' + ART.speaker() +
      "<span>Hear and watch</span></button>";
  }

  function demoClues(host, leg) {
    var D = leg.demo;
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    host.innerHTML =
      '<div class="demo"><h4>Worked example, read the three clues</h4>' +
      '<div class="demo-stage" style="padding:14px 10px">' +
      readFig(D.answer, { id: "ccFig" }) +
      '<div class="answers ipa-picks four demo-opts" aria-hidden="true">' +
      D.options.map(function (s) {
        return '<span class="opt pick" data-v="' + s + '">/' + esc(IPA_OF[s]) + "/</span>";
      }).join("") + "</div>" +
      '<p class="dcap" id="ccCap">Press <b>Play</b> to watch the sound being made, then tap the three clues in order ' +
      "and watch the four sounds narrow to one.</p>" + figCredit() + "</div>" +
      '<div class="demo-tap" style="margin-top:10px">' + D.clues.map(function (c) {
        return '<button type="button" class="tapper" data-k="' + c.k + '">' + c.btn + '<span class="hintdot"></span></button>';
      }).join("") + "</div>" +
      keyHTML(true) + "</div>";
    var cap = $("#ccCap", host), wrap = $("#ccFig", host);
    var F = wireFig(wrap);
    $$(".tapper", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.getAttribute("data-k");
        var idx = D.clues.map(function (c) { return c.k; }).indexOf(k);
        $$(".tapper", host).forEach(function (b) {
          b.classList.toggle("on", b === btn);
          if (b === btn) b.classList.add("seen");
        });
        wrap.setAttribute("data-clue", k);
        // everything ruled out by this clue and the ones before it
        var out = {};
        D.clues.slice(0, idx + 1).forEach(function (c) { (c.out || []).forEach(function (s) { out[s] = 1; }); });
        $$(".demo-opts .opt", host).forEach(function (o) {
          var v = o.getAttribute("data-v");
          o.classList.toggle("out", !!out[v]);
          o.classList.toggle("is-good", k === "voice" && v === D.answer);
        });
        cap.innerHTML = D.clues[idx].cap + (k === "voice" ? " " + hearWatchBtn(D.answer) : "");
        var hw = $(".hw-btn", cap);
        if (hw) hw.addEventListener("click", function () { F.play(true, hw); });
        if (k === "how" && F) F.play(false);
        L.tieIPA(cap);
      });
    });
    L.tieIPA(host);
  }

  function itemRead(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = null, locked = false;
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      readFig(it.answer) +
      keyHTML(false) +
      '<div class="answers ipa-picks four" role="group" aria-label="The four sounds to choose from">' +
      it.options.map(function (s, i) {
        return '<button type="button" class="opt pick" data-v="' + s + '" aria-keyshortcuts="' + (i + 1) +
          '" aria-label="The sound ' + esc(IPA_OF[s]) + '">/' + esc(IPA_OF[s]) + "/</button>";
      }).join("") + "</div>" +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    var F = wireFig($(".rd-fig", host));
    $$(".pick", host).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled || locked) return;
        picked = b.getAttribute("data-v");
        $$(".pick", host).forEach(function (x) { x.classList.toggle("sel", x === b); });
        $("#actBtn").disabled = false;
      });
    });

    function lock(silent) {
      locked = true;
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      var givenKey = L.keyOf(it, given), answerKey = L.keyOf(it, it.answer);
      $$(".pick", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        b.classList.remove("sel");
        if (v === answerKey) b.classList.add("is-good");
        else if (v === givenKey) b.classList.add(alt ? "is-alt" : "is-bad");
      });
      var reveal = '<div class="reveal rd-reveal"><span class="verdict yes">' +
        'The sound: <span class="ipa-keep">/' + esc(IPA_OF[answerKey]) + "/</span></span> " +
        hearWatchBtn(answerKey) +
        '<p class="rd-label">' + esc(it.label) + "</p>" + cluesHTML(it.panel) + "</div>";
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, reveal);
      var hw = $(".hw-btn", host);
      if (hw && F) hw.addEventListener("click", function () {
        $(".rd-fig", host).scrollIntoView({ block: "nearest", behavior: L.reduced ? "auto" : "smooth" });
        F.play(true, hw);
      });
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    L.tieIPA(host);
    if (already) lock(true);
    else {
      playSoon(F);
      onAct(function () {
        if (picked == null || locked) return;
        L.answer(sc, picked, $('.pick[data-v="' + picked + '"]', host));
        lock(false);
      });
    }
  }

  /* ---------------------------------------------------------
     Lab 6, Trail 2: the transcriber (type "transcribe")
     A symbol keyboard of the whole inventory and a line that
     grows as the student types: no boxes, so nothing gives
     away how many sounds the word has. Two symbols typed side
     by side that are one sound (leg.merge: /ɑ/ + /ɪ/, /t/ + /ʃ/)
     are stored as that sound, because on the line they look the
     same. The reveal sets what they wrote against the answer,
     aligned, then the letters collapsing into sounds.
     --------------------------------------------------------- */
  function mergeKey(leg, seq) {
    var M = {};
    (leg.merge || []).forEach(function (m) { M[m[0] + "|" + m[1]] = m[2]; });
    var out = [];
    seq.forEach(function (s) {
      var k = out.length ? out[out.length - 1] + "|" + s : "";
      if (k && M[k]) out[out.length - 1] = M[k];
      else out.push(s);
    });
    return out;
  }

  /* Line up what was written against the answer (fewest edits), so a
     missing or extra sound shows as a gap rather than shifting the rest. */
  function alignSeq(a, b) {
    var n = a.length, m = b.length, D = [], i, j;
    for (i = 0; i <= n; i++) { D.push([]); for (j = 0; j <= m; j++) D[i].push(0); }
    for (i = 0; i <= n; i++) D[i][0] = i;
    for (j = 0; j <= m; j++) D[0][j] = j;
    for (i = 1; i <= n; i++) {
      for (j = 1; j <= m; j++) {
        D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    var out = [];
    i = n; j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
        out.unshift([a[i - 1], b[j - 1]]); i--; j--;
      } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) {
        out.unshift([a[i - 1], null]); i--;
      } else {
        out.unshift([null, b[j - 1]]); j--;
      }
    }
    return out;
  }

  function trCompare(given, ref, IPA_OF, exact) {
    var pairs = alignSeq(given, ref);
    function cell(s, other, play) {
      if (s == null) return '<span class="acell gap"><span class="vh">nothing here</span>·</span>';
      var cls = s === other ? "same" : "diff";
      if (play && L.audio.has("ipa_" + s)) {
        return '<button type="button" class="acell ' + cls + '" data-play="ipa_' + s +
          '" aria-label="Play the sound ' + esc(IPA_OF[s]) + '">' + esc(IPA_OF[s]) + "</button>";
      }
      return '<span class="acell ' + cls + '">' + esc(IPA_OF[s]) + "</span>";
    }
    var you = pairs.map(function (p) { return cell(p[0], p[1], false); }).join("");
    var ans = pairs.map(function (p) { return cell(p[1], p[0], true); }).join("");
    return '<div class="align-scroll"><div class="align tr-align">' +
      '<div class="arow"><span class="alab">You wrote</span>' + you + "</div>" +
      (exact ? "" : '<div class="arow ans"><span class="alab">Answer</span>' + ans + "</div>") +
      "</div></div>";
  }

  function collapseHTML(it) {
    var letters = "";
    it.chips.forEach(function (c, ci) {
      for (var k = 0; k < c.letters.length; k++) {
        letters += '<span class="' + (c.letters.length > 1 ? "merged" : "") +
          '" data-chip="' + ci + '">' + esc(c.letters[k]) + "</span>";
      }
    });
    var nL = it.word.length, nS = it.chips.length;
    return '<div class="collapse">' +
      '<div class="row-letters">' + letters + "</div>" +
      '<div class="tick">' + nL + (nL === 1 ? " letter" : " letters") + " on the page</div>" +
      '<div style="font-size:1.3rem;color:var(--acc);font-weight:800">&darr;</div>' +
      phonemeChips(it, true) +
      '<div class="tick">' + nS + (nS === 1 ? " sound" : " sounds") + " in the mouth</div></div>";
  }

  /* The keyboard: two labelled rows, consonants then vowels, a little more
     space between the families (stops, fricatives, ...) than inside them. */
  function keyboardHTML(tiles, locked) {
    function row(cat, label) {
      var list = tiles.filter(function (t) { return (t.cat || "c") === cat; });
      if (!list.length) return "";
      // each family stays together on one line, so the rows wrap between families
      var html = "", g = null;
      list.forEach(function (t, i) {
        if (i === 0 || t.g !== g) html += (i ? "</span>" : "") + '<span class="key-grp">';
        g = t.g;
        html += '<button type="button" class="tile key"' + (locked ? " disabled" : "") + ' data-slug="' + t.slug +
          '" aria-label="Type ' + esc(t.ipa) + '">' + esc(t.ipa) + "</button>";
      });
      html += "</span>";
      return '<div class="tile-row" role="group" aria-label="' + label + '">' +
        '<span class="tile-row-lab" aria-hidden="true">' + label + "</span>" +
        '<span class="tile-row-tiles">' + html + "</span></div>";
    }
    return row("c", "Consonants") + row("v", "Vowels");
  }

  function lineHTML(seq, IPA_OF, locked) {
    var syms = seq.map(function (s, i) {
      return '<button type="button" class="tr-sym" data-i="' + i + '"' + (locked ? " disabled" : "") +
        ' aria-label="' + esc(IPA_OF[s]) + (locked ? "" : ", press to take it out") + '">' + esc(IPA_OF[s]) + "</button>";
    }).join("");
    return '<span class="tr-slash" aria-hidden="true">/</span>' +
      (seq.length || locked ? syms : '<span class="tr-hint">tap the symbols below</span>') +
      (locked ? "" : '<span class="tr-caret" aria-hidden="true"></span>') +
      '<span class="tr-slash" aria-hidden="true">/</span>' +
      '<button type="button" class="tr-back" aria-label="Take back the last symbol" aria-keyshortcuts="Backspace"' +
      (locked || !seq.length ? " disabled" : "") + ">&#9003;</button>";
  }

  function itemTranscribe(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var locked = false;
    var MAX = leg.max_len || 12;
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    var seq = already ? String(L.state.given[sc.t]).split(".") : [];

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(leg.prompt) + "</p>" +
      '<div class="target wb-target tr-target">' +
      '<span class="target-word wb-word">' + esc(it.word) + L.audio.btn(it.audio, "Hear it") + "</span></div>" +
      '<div class="tr-line" id="trLine" role="group" aria-label="Your transcription"></div>' +
      '<p class="tr-full" id="trFull" role="status"></p>' +
      '<div class="tilebank tr-keys" id="trKeys" role="group" aria-label="The IPA keyboard"></div>' +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host), lineEl = $("#trLine", host), keysEl = $("#trKeys", host);
    var fullEl = $("#trFull", host);

    function paint() {
      lineEl.innerHTML = lineHTML(seq, IPA_OF, locked);
      lineEl.classList.toggle("locked", locked);
      if (!locked) {
        $$(".tr-sym", lineEl).forEach(function (b) {
          b.addEventListener("click", function () {
            seq.splice(+b.getAttribute("data-i"), 1);
            fullEl.textContent = "";
            paint();
          });
        });
        $(".tr-back", lineEl).addEventListener("click", back);
      }
      $("#actBtn").disabled = locked || !seq.length;
      L.tieIPA(lineEl);
    }
    function back() {
      if (locked || !seq.length) return;
      seq.pop();
      fullEl.textContent = "";
      paint();
    }
    function type(slug) {
      if (locked) return;
      if (seq.length >= MAX) { fullEl.textContent = "That is as long as the line goes."; return; }
      seq.push(slug);
      if (L.audio.has("ipa_" + slug)) L.audio.play("ipa_" + slug);
      paint();
    }

    keysEl.innerHTML = keyboardHTML(leg.tiles, already);
    $$(".key", keysEl).forEach(function (b) {
      b.addEventListener("click", function () { type(b.getAttribute("data-slug")); });
    });
    L.tieIPA(keysEl);

    // Backspace on a hardware keyboard does what the ⌫ key does, while this screen is up
    function onKey(e) {
      if (!host.isConnected) { d.removeEventListener("keydown", onKey); return; }
      if (e.key === "Backspace" && !locked) { e.preventDefault(); back(); }
    }
    d.addEventListener("keydown", onKey);

    function lock(silent) {
      locked = true;
      var given = String(L.state.given[sc.t]).split(".");
      seq = given;
      paint();
      $$(".key", keysEl).forEach(function (b) { b.disabled = true; });
      var exact = L.isCorrect(sc.t);
      // a transcription that matched one of the item's other right answers is set against that one
      var ref = exact ? given : it.answer.split(".");
      if (!exact && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it,
        '<div class="reveal">' + trCompare(given, ref, IPA_OF, exact) + collapseHTML(it) + "</div>");
      L.tieIPA($("#fbHost", host));
      armContinue(sc);
    }

    paint();
    if (already) lock(true);
    else {
      onAct(function () {
        if (locked || !seq.length) return;
        L.answer(sc, mergeKey(leg, seq).join("."), lineEl);
        lock(false);
      });
      // the word plays once on arrival
      var spk = $(".target .spk", host);
      if (spk) L.audio.play(it.audio, spk);
    }
  }

  function demoTranscribe(host, leg) {
    var D = leg.demo;
    var IPA_OF = {};
    D.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    var seq = [];
    host.innerHTML =
      '<div class="demo"><h4>Worked example, write the word</h4>' +
      '<div class="demo-stage" style="padding:16px 12px">' +
      '<div class="target wb-target tr-target" style="padding:4px 0 6px">' +
      '<span class="target-word wb-word" style="font-size:1.7rem">' + esc(D.word) +
      L.audio.btn(D.audio, "Hear it") + "</span></div>" +
      '<div class="tr-line" id="dLine"></div>' +
      '<div class="tilebank tr-keys" id="dKeys" style="flex-direction:row;flex-wrap:wrap;justify-content:center">' +
      D.tiles.map(function (t) {
        return '<button type="button" class="tile key" data-slug="' + t.slug + '" aria-label="Type ' + esc(t.ipa) +
          '">' + esc(t.ipa) + "</button>";
      }).join("") + "</div>" +
      '<p class="dcap" id="dCap">' + D.cap + "</p></div></div>";
    var lineEl = $("#dLine", host), cap = $("#dCap", host);
    function paint() {
      lineEl.innerHTML = lineHTML(seq, IPA_OF, false);
      $$(".tr-sym", lineEl).forEach(function (b) {
        b.addEventListener("click", function () { seq.splice(+b.getAttribute("data-i"), 1); paint(); });
      });
      $(".tr-back", lineEl).addEventListener("click", function () { seq.pop(); paint(); });
      if (seq.join(".") === D.want.join(".")) cap.innerHTML = D.ok;
      else if (seq.length >= D.want.length) cap.innerHTML = "Not this word yet. Take a symbol back out and listen again.";
      else cap.innerHTML = D.cap;
      L.tieIPA(lineEl);
    }
    $$(".key", host).forEach(function (b) {
      b.addEventListener("click", function () {
        if (seq.length >= 8) return;
        var s = b.getAttribute("data-slug");
        seq.push(s);
        if (L.audio.has("ipa_" + s)) L.audio.play("ipa_" + s);
        paint();
      });
    });
    paint();
    L.tieIPA(host);
  }

  /* Lab 6 recaps. Trail 1: the consonant chart, every English consonant in its cell,
     the fifteen asked about in black with the student's marks. Every symbol is a button:
     tap it and the drawn mouth below makes the sound while it plays. */
  function recapConsonants(li) {
    var leg = L.legs[li], C = leg.chart;
    var IPA_OF = {}, MARK = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    leg.items.forEach(function (it, i) { MARK[it.answer] = recapMark(li * L.per + i); });
    var CELL = {};
    C.cells.forEach(function (c) { CELL[c[0] + "|" + c[1]] = [c[2], c[3]]; });
    function sym(s) {
      if (!s) return "<span></span>";
      if (s.charAt(0) === "(") {
        var inner = s.slice(1, -1);
        return '<span class="cc-s faint">(' + esc(IPA_OF[inner]) + ")</span>";
      }
      return '<button type="button" class="cc-s cc-tap' + (MARK[s] ? " t" : "") + '" data-s="' + s +
        '" aria-label="Show and play ' + esc(IPA_OF[s]) + '">' + esc(IPA_OF[s]) + (MARK[s] || "") + "</button>";
    }
    var head = "<tr><th></th>" + C.cols.map(function (c) { return "<th>" + esc(c[1]) + "</th>"; }).join("") + "</tr>";
    var body = C.rows.map(function (r) {
      return '<tr><th class="rh">' + esc(r[1]) + "</th>" + C.cols.map(function (c) {
        var p = CELL[c[0] + "|" + r[0]];
        return "<td>" + (p ? '<div class="cc-pair">' + sym(p[0]) + sym(p[1]) + "</div>" : "") + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<div class="recap"><h3>The consonant chart</h3>' +
      '<p class="recap-note">Every English consonant by place and manner, voiceless on the left of each box ' +
      "and voiced on the right. The fifteen you met carry your answer marks. " +
      "<b>Tap any symbol</b> to watch it being made and hear it.</p>" +
      '<div class="table-wrap"><table class="cchart"><thead>' + head + "</thead><tbody>" + body +
      "</tbody></table></div>" +
      '<p class="cc-note">/w/ works at two places at once, the lips and the velum, so it appears twice.</p>' +
      '<div class="cc-show" id="ccShow" aria-live="polite"></div></div>';
  }
  function wireConsonants(host, li) {
    var leg = L.legs[li], show = $("#ccShow", host);
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    $$(".cc-tap", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var s = b.getAttribute("data-s");
        $$(".cc-tap", host).forEach(function (x) { x.classList.toggle("on", x === b); });
        show.innerHTML = '<p class="cc-show-head"><span class="ipa-keep">/' + esc(IPA_OF[s]) + "/</span> " +
          esc(consName(s)) + "</p>" + readFig(s);
        L.tieIPA(show);
        var F = wireFig(show, { sound: true });
        if (F) F.play(true, b);
        else if (L.audio.has("ipa_" + s)) L.audio.play("ipa_" + s, b);
      });
    });
  }

  /* Trail 2: the fifteen words, each answer beside what was written. */
  function recapTranscribe(li) {
    var leg = L.legs[li];
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    function ipa(key) { return "/" + key.split(".").map(function (s) { return IPA_OF[s] || s; }).join("") + "/"; }
    var rows = leg.items.map(function (it, i) {
      var t = li * L.per + i, given = L.state.given[t];
      var also = (it.also || []).length ? ' <small>or ' + it.also.map(ipa).join(" or ") + "</small>" : "";
      return "<tr><td><b>" + esc(it.word) + "</b></td><td class=\"rc-ipa\">" + esc(ipa(it.answer)) + also +
        "</td><td class=\"rc-ipa\" style=\"font-weight:600;color:var(--ink-soft)\">" +
        (given == null ? "" : esc(ipa(String(given)))) + "</td><td>" + recapMark(t) + "</td></tr>";
    }).join("");
    return '<div class="recap"><h3>Fifteen words, transcribed</h3>' +
      '<p class="recap-note">Each answer beside what you wrote, with your marks.</p>' +
      '<div class="table-wrap"><table class="recap-table"><thead><tr><th>Word</th><th>Answer</th>' +
      "<th>You wrote</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div></div>";
  }

  /* ---------------------------------------------------------
     Lab 5: the vowel chart and the moving mouth
     --------------------------------------------------------- */

  /* The chart with a real button on each vowel. opts.pick lists the slugs
     that can be tapped (the rest are drawn but inert); opts.cls tags the
     buttons. Positions are percentages of the chart box, so the buttons
     stay on their spots at any width. */
  function chartHTML(slugs, opts) {
    opts = opts || {};
    var live = opts.pick || slugs;
    return '<div class="vchart' + (opts.small ? " small" : "") + '">' + ART.vowelChart() +
      slugs.map(function (v, i) {
        var pos = ART.vcPos[v], ipa = ART.vcIPA[v];
        var style = "left:" + (pos[0] / ART.vcW * 100).toFixed(2) + "%;top:" + (pos[1] / ART.vcH * 100).toFixed(2) + "%";
        if (live.indexOf(v) < 0 || opts.inert) {
          var asked = opts.asked && opts.asked.indexOf(v) >= 0 ? " asked" : "";
          return '<span class="vc-sym' + asked + '" data-v="' + v + '" style="' + style + '">' + esc(ipa) + "</span>";
        }
        return '<button type="button" class="opt vc-opt' + (opts.cls ? " " + opts.cls : "") + '" data-v="' + v +
          '" style="' + style + '"' + (i < 10 ? ' aria-keyshortcuts="' + (i < 9 ? i + 1 : 0) + '"' : "") +
          ' aria-label="The vowel ' + esc(ipa) + '">' + esc(ipa) + "</button>";
      }).join("") +
      '<svg class="vc-over" viewBox="0 0 ' + ART.vcW + " " + ART.vcH + '" aria-hidden="true"></svg>' +
      "</div>";
  }

  /* The moving mouth's tongue shapes are adapted from a CC BY-SA diagram; the
     build passes the credit in, and it is shown wherever the figure is introduced. */
  function figCredit() {
    // the practice site credits the figure from its footer (Credits); the Moodle version has no footer
    return w.LAB_FIG_CREDIT && L.mode === "scorm" ? '<p class="fig-credit">' + w.LAB_FIG_CREDIT + "</p>" : "";
  }

  /* Lab 5: the mouth makes a vowel as its recording is heard. It settles to rest,
     arrives at the vowel just as the sound starts (the clip's `on`, after the player's
     PREROLL), and for a vowel that glides (/e/, /o/, a diphthong) moves on to where it
     ends while it sounds. */
  function vowelWatch(ctl, fig, slug, srcBtn) {
    var T = clipTimes(slug), moves = ART.vowelMoves(slug);
    var SETTLE = 240, MOVE = 380, dur = Math.max(200, (T.off - T.on) * 1000);
    var arrive = SETTLE + MOVE;
    clearTimeout(fig._cue); clearTimeout(fig._cue2);
    ctl.stop();
    ctl.set(ART.mouthRest, SETTLE, function () {
      ctl.set(moves[0], MOVE, function () {
        if (moves.length > 1) ctl.glide(moves.slice(1), Math.max(160, dur * 0.75), 0);
      });
    });
    fig._cue = setTimeout(function () {
      if (fig.isConnected) L.audio.play("ipa_" + slug, srcBtn || null);
    }, Math.max(0, arrive - L.audio.PREROLL - T.on * 1000));
  }

  /* An arrow across the chart, for a glide from one vowel toward another. */
  function chartArrow(chartEl, from, to) {
    var over = chartEl.querySelector(".vc-over");
    if (!over) return;
    if (!from) { over.innerHTML = ""; return; }
    var a = ART.vcPos[from], b = ART.vcPos[to];
    var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    var x1 = a[0] + ux * 22, y1 = a[1] + uy * 22, x2 = b[0] - ux * 24, y2 = b[1] - uy * 24;
    var hx = x2 - ux * 10, hy = y2 - uy * 10;
    over.innerHTML = '<path class="vc-glide" d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + " L" + x2.toFixed(1) + " " + y2.toFixed(1) + '"/>' +
      '<path class="vc-glide-head" d="M' + (hx - uy * 7).toFixed(1) + " " + (hy + ux * 7).toFixed(1) + " L" + x2.toFixed(1) + " " +
      y2.toFixed(1) + " L" + (hx + uy * 7).toFixed(1) + " " + (hy - ux * 7).toFixed(1) + '"/>';
  }

  /* --- Vowel Finder worked example (Lab 5, Trail 1) --------
     Three sounds no question in the lab asks about: /ɪ/, and two
     diphthongs, whose glide is drawn across the chart. */
  function demoVowelChart(host) {
    var leg = L.legs.filter(function (l) { return l.id === "vf"; })[0];
    var STEPS = (leg && leg.demo && leg.demo.steps) || [];
    host.innerHTML =
      '<div class="demo"><h4>Worked example, tap a sound</h4>' +
      '<div class="demo-tap">' + STEPS.map(function (st, i) {
        return '<button type="button" class="tapper" data-i="' + i + '">/' + esc(st.ipa) +
          '/<span class="hintdot"></span></button>';
      }).join("") + "</div>" +
      '<div class="demo-stage vf-stage" id="vfStage">' +
      '<div class="vf-pair">' + chartHTML(leg.chart, { inert: true, small: true }) +
      ART.mouth({ cls: "demo-mouth", dot: true }) + "</div>" +
      '<p class="dcap" id="vfCap">The vowel chart is a map of the tongue. Tap a sound above: its place ' +
      "lights up on the chart, and the drawn mouth shows where the tongue goes.</p></div>" +
      figCredit() + "</div>";

    var cap = $("#vfCap", host), chart = $(".vchart", host);
    var ctl = ART.mouthCtl($(".mouth-fig", host));
    $$(".tapper", host).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var st = STEPS[+btn.getAttribute("data-i")];
        $$(".tapper", host).forEach(function (b) {
          b.classList.toggle("on", b === btn);
          if (b === btn) b.classList.add("seen");
        });
        $$(".vc-sym", chart).forEach(function (el) {
          el.classList.toggle("lit", st.lit.indexOf(el.getAttribute("data-v")) >= 0);
        });
        chartArrow(chart, st.lit.length > 1 ? st.lit[0] : null, st.lit[1]);
        cap.innerHTML = st.cap;
        L.tieIPA(cap);
        var vs = st.audio.replace(/^ipa_/, "");
        if (L.audio.has(st.audio) && ART.vowelPose[vs]) vowelWatch(ctl, $(".mouth-fig", host), vs, null);
        else {
          ctl.set(ART.mouthRest, 260, function () {
            ctl.glide(st.lit.map(function (v) { return ART.vowelPose[v]; }), 620, 180);
          });
          if (L.audio.has(st.audio)) L.audio.play(st.audio);
        }
      });
    });
    L.tieIPA(host);
  }

  /* --- Tongue Mover worked example (Lab 5, Trail 2) --------
     Free play first: tap any height and either side and watch the tongue
     go there. Then one solved example, a vowel this trail never asks. */
  function demoTongue(host) {
    var leg = L.legs.filter(function (l) { return l.id === "tm"; })[0];
    var D = (leg && leg.demo) || {};
    var H = ART.heightOf, pose = { h: 0.62, b: 0.5 };
    host.innerHTML =
      '<div class="demo"><h4>Worked example, move the tongue</h4>' +
      '<div class="demo-stage" id="tmStage">' +
      '<div class="tm-demo">' + ART.mouth({ cls: "demo-mouth", dot: true, pose: pose }) +
      '<div class="tm-demo-ctl">' +
      '<div class="tm-demo-row" role="group" aria-label="Tongue height">' +
      '<button type="button" class="tapper" data-h="high">High</button>' +
      '<button type="button" class="tapper" data-h="mid">Mid</button>' +
      '<button type="button" class="tapper" data-h="low">Low</button></div>' +
      '<div class="tm-demo-row" role="group" aria-label="Front or back">' +
      '<button type="button" class="tapper" data-b="front">Front</button>' +
      '<button type="button" class="tapper" data-b="back">Back</button></div>' +
      '<div class="tm-demo-row"><button type="button" class="tapper solve" id="tmSolve">Show /' + esc(D.ipa || "æ") +
      '/<span class="hintdot"></span></button></div></div></div>' +
      '<p class="dcap" id="tmCap">Tap a height and a side. The dot marks the highest point of the tongue, ' +
      "the point a vowel chart plots.</p></div>" + figCredit() + "</div>";

    var cap = $("#tmCap", host), ctl = ART.mouthCtl($(".mouth-fig", host), pose);
    function mark(attr, v) {
      $$(".tapper[" + attr + "]", host).forEach(function (b) {
        b.classList.toggle("on", b.getAttribute(attr) === v);
        if (b.getAttribute(attr) === v) b.classList.add("seen");
      });
    }
    var hNow = "mid", bNow = null;
    function move() {
      pose = { h: H[hNow], b: bNow == null ? 0.5 : (bNow === "back" ? 1 : 0) };
      ctl.set(pose, 520);
      cap.innerHTML = "Tongue <b>" + hNow + "</b>" + (bNow ? " and <b>" + bNow + "</b>" : ", halfway between front and back") +
        (bNow ? "." : ". Now tap Front or Back.");
    }
    $$(".tapper[data-h]", host).forEach(function (b) {
      b.addEventListener("click", function () { hNow = b.getAttribute("data-h"); mark("data-h", hNow); move(); });
    });
    $$(".tapper[data-b]", host).forEach(function (b) {
      b.addEventListener("click", function () { bNow = b.getAttribute("data-b"); mark("data-b", bNow); move(); });
    });
    $("#tmSolve", host).addEventListener("click", function () {
      var btn = this;
      btn.classList.add("seen", "on");
      mark("data-h", D.height); mark("data-b", D.place);
      hNow = D.height; bNow = D.place;
      ctl.glide(ART.vowelMoves(D.slug), 620, 160);
      cap.innerHTML = D.cap;
      L.tieIPA(cap);
      if (L.audio.has(D.audio)) L.audio.play(D.audio);
    });
    L.tieIPA(host);
  }

  /* ---------------------------------------------------------
     Hear it, find it on the chart (Lab 5, Trail 1)
     One recording, the vowel chart. Tap a symbol, Check locks it.
     The reveal plays the tongue moving to the vowel.
     --------------------------------------------------------- */
  function itemHear(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = null, locked = false;

    var target;
    if (it.word) {
      // a vowel heard inside a word: the letters that spell it are marked
      var w0 = it.word, f = it.focus || [0, 0];
      target = '<div class="target hear-target"><span class="target-word hear-word">' +
        esc(w0.slice(0, f[0])) + '<span class="focus">' + esc(w0.slice(f[0], f[1])) + "</span>" +
        esc(w0.slice(f[1])) + "</span>" + L.audio.btn(it.audio, "Hear the word", "big") + "</div>" +
        '<p class="hear-cue">' + it.cue + "</p>";
    } else {
      target = '<div class="target hear-target">' + L.audio.btn(it.audio, "Play the vowel", "big") + "</div>";
    }

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(it.prompt || leg.prompt) + "</p>" +
      target +
      '<div class="vf-chart-wrap" role="group" aria-label="The vowel chart">' + chartHTML(leg.chart) + "</div>" +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    $$(".vc-opt", host).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled || locked) return;
        picked = b.getAttribute("data-v");
        $$(".vc-opt", host).forEach(function (x) { x.classList.toggle("sel", x === b); });
        $("#actBtn").disabled = false;
      });
    });

    function lock(silent) {
      locked = true;
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      var givenKey = L.keyOf(it, given), answerKey = L.keyOf(it, it.answer);
      $$(".vc-opt", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        b.classList.remove("sel");
        if (v === answerKey) b.classList.add("is-good");
        else if (v === givenKey) b.classList.add(alt ? "is-alt" : "is-bad");
        else if (it.accept && it.accept[v]) b.classList.add("is-alt-quiet");
      });
      var ipa = ART.vcIPA[answerKey];
      var reveal = '<div class="reveal hear-reveal">' +
        ART.mouth({ cls: "reveal-mouth", dot: true }) +
        '<div class="hear-say"><span class="hear-lab">The vowel</span><span class="hear-sym">/' + esc(ipa) + "/</span>" +
        (it.as ? '<span class="hear-as">as in <i>' + esc(it.as) + "</i></span>" : "") +
        (it.where ? '<span class="hear-where">' + esc(it.where) + "</span>" : "") +
        // a vowel heard on its own replays with the mouth in step; one heard inside a
        // word (zebra) just replays the word
        '<span class="hear-again">' + (!it.word && it.audio === "ipa_" + answerKey
          ? hearWatchBtn(answerKey)
          : L.audio.btn(it.audio, it.word ? "Hear the word again" : "Hear it again")) +
        "</span></div></div>";
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, reveal);
      L.tieIPA($("#fbHost", host));
      var fig = $(".reveal-mouth", host);
      if (fig) {
        var ctl = ART.mouthCtl(fig);
        setTimeout(function () { ctl.glide(ART.vowelMoves(answerKey), 700, 160); }, silent ? 0 : 250);
        var hw = $(".hear-again .hw-btn", host);
        if (hw) hw.addEventListener("click", function () { vowelWatch(ctl, fig, answerKey, hw); });
      }
      armContinue(sc);
    }

    L.tieIPA(host);
    if (already) lock(true);
    else {
      // play the recording once on arrival; the button replays it
      var first = $(".hear-target .spk", host);
      if (first) L.audio.play(it.audio, first);
      onAct(function () {
        if (picked == null || locked) return;
        L.answer(sc, picked, $('.vc-opt[data-v="' + picked + '"]', host));
        lock(false);
      });
    }
  }

  /* ---------------------------------------------------------
     Move the tongue (Lab 5, Trail 2)
     Each vowel is two linked questions: how high the tongue
     goes, then whether its front or its back is raised. Every
     choice moves the tongue there before Check; the reveal
     moves it to the answer.
     --------------------------------------------------------- */
  function itemTongue(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = null, locked = false;
    var H = ART.heightOf, V = ART.vowelPose[it.vowel];
    var isHeight = it.step === "height";
    var choices = isHeight ? [["high", "High"], ["mid", "Mid"], ["low", "Low"]] : [["front", "Front"], ["back", "Back"]];
    // the height step starts from rest; the place step starts where the height step left it
    var start = isHeight ? ART.mouthRest : { h: H[it.height], b: 0.5 };
    function poseFor(v) {
      return isHeight ? { h: H[v], b: 0.5 } : { h: H[it.height], b: v === "back" ? 1 : 0 };
    }

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(isHeight ? leg.prompts.height : leg.prompts.place) + "</p>" +
      '<div class="target"><span class="target-word ipa-word">/' + esc(it.ipa) + "/</span>" +
      L.audio.btn(it.audio, "Hear it") +
      (it.as ? '<span class="tm-as">as in <i>' + esc(it.as) + "</i></span>" : "") + "</div>" +
      '<div class="tm-stage' + (isHeight ? " is-height" : " is-place") + '" id="dgWrap">' +
      ART.mouth({ cls: "tm-mouth", dot: true, pose: start }) +
      '<div class="answers tm-choices ' + (isHeight ? "three" : "two") + '" role="group" aria-label="' +
      (isHeight ? "Tongue height" : "Front or back") + '">' +
      choices.map(function (c, i) {
        return '<button type="button" class="opt tm-opt" data-v="' + c[0] + '" aria-keyshortcuts="' + (i + 1) + '">' +
          '<span class="tm-ico" aria-hidden="true">' + tmIcon(c[0]) + "</span>" + esc(c[1]) + "</button>";
      }).join("") + "</div></div>" +
      (isHeight ? "" : '<p class="tm-note">' + esc(leg.prompts.carry.replace("{h}", it.height)) + "</p>") +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host);
    var ctl = ART.mouthCtl($(".tm-mouth", host), start);

    $$(".tm-opt", host).forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled || locked) return;
        picked = b.getAttribute("data-v");
        $$(".tm-opt", host).forEach(function (x) { x.classList.toggle("sel", x === b); });
        ctl.set(poseFor(picked), 520);
        $("#actBtn").disabled = false;
      });
    });

    function lock(silent) {
      locked = true;
      var given = L.state.given[sc.t];
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      var givenKey = L.keyOf(it, given), answerKey = L.keyOf(it, it.answer);
      $$(".tm-opt", host).forEach(function (b) {
        var v = b.getAttribute("data-v");
        b.disabled = true;
        b.classList.remove("sel");
        if (v === answerKey) b.classList.add("is-good");
        else if (v === givenKey) b.classList.add(alt ? "is-alt" : "is-bad");
      });
      var sym = '<span class="ipa-keep">/' + esc(it.ipa) + "/</span>";
      var line = isHeight
        ? sym + " is a " + esc(it.height) + " vowel"
        : sym + " is " + esc(it.height) + " " + esc(it.place) + (V.round > 0.3 ? ", lips rounded" : "");
      var reveal = '<div class="reveal" style="text-align:center"><span class="verdict yes">' + line + "</span> " +
        L.audio.btn(it.audio, "Hear it") + "</div>";
      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, reveal);
      L.tieIPA($("#fbHost", host));
      // the height step settles at the right height; the place step plays the whole vowel
      if (isHeight) ctl.set({ h: H[it.height], b: 0.5 }, silent ? 0 : 620);
      else if (silent) ctl.set(ART.vowelPose[it.vowel], 0);
      else ctl.glide(ART.vowelMoves(it.vowel), 650, 160);
      armContinue(sc);
    }

    L.tieIPA(host);
    if (already) lock(true);
    else onAct(function () {
      if (picked == null || locked) return;
      L.answer(sc, picked, $('.tm-opt[data-v="' + picked + '"]', host));
      lock(false);
    });
  }

  /* Small arrows on the Tongue Mover buttons. */
  function tmIcon(v) {
    var d = {
      high: "M12 4 L12 20 M6 10 L12 4 L18 10",
      mid: "M4 12 L20 12 M8 8 L4 12 L8 16 M16 8 L20 12 L16 16",
      low: "M12 4 L12 20 M6 14 L12 20 L18 14",
      front: "M20 12 L4 12 M10 6 L4 12 L10 18",
      back: "M4 12 L20 12 M14 6 L20 12 L14 18"
    }[v];
    return '<svg viewBox="0 0 24 24"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* Lab 5, Trail 1: the chart with the student's own results on it. */
  function recapVowelChart(li) {
    var leg = L.legs[li];
    var mark = {};
    leg.items.forEach(function (it, i) { mark[it.answer] = li * L.per + i; });
    var chart = chartHTML(leg.chart, { inert: true, asked: Object.keys(mark) });
    var res = "";
    leg.chart.forEach(function (v) {
      if (mark[v] == null) return;
      var pos = ART.vcPos[v];
      res += '<span class="vc-res" style="left:' + (pos[0] / ART.vcW * 100).toFixed(2) + "%;top:" +
        (pos[1] / ART.vcH * 100).toFixed(2) + '%">' + recapMark(mark[v]) + "</span>";
    });
    chart = chart.replace('<svg class="vc-over"', res + '<svg class="vc-over"');
    return '<div class="recap"><h3>Your vowel map</h3>' +
      '<p class="recap-note">The ten vowels you heard, each in its place on the chart, with your answers marked. ' +
      "The other four were not asked.</p>" +
      '<div class="vf-chart-wrap recap-chart">' + chart.replace('class="vchart"', 'class="vchart recap"') + "</div></div>";
  }

  /* Lab 5, Trail 2: the five vowels, each with its two answers. */
  function recapTongue(li) {
    var leg = L.legs[li], rows = "";
    for (var i = 0; i < leg.items.length; i += 2) {
      var a = leg.items[i], b = leg.items[i + 1];
      var hi = a.step === "height" ? a : b, pl = a.step === "height" ? b : a;
      var ti = li * L.per + i + (a.step === "height" ? 0 : 1), tp = li * L.per + i + (a.step === "height" ? 1 : 0);
      rows += '<tr><td class="rc-ipa">/' + esc(hi.ipa) + "/</td><td>" + esc(hi.height) + " " + recapMark(ti) +
        "</td><td>" + esc(pl.place) + " " + recapMark(tp) + "</td><td>" +
        (ART.vowelPose[hi.vowel].round > 0.3 ? "rounded" : "unrounded") + "</td></tr>";
    }
    return '<div class="recap"><h3>Five vowels, placed</h3>' +
      '<p class="recap-note">Height and front or back for each vowel, with your answers marked.</p>' +
      '<div class="table-wrap"><table class="recap-table"><thead><tr><th>Vowel</th><th>Height</th><th>Front or back</th>' +
      "<th>Lips</th></tr></thead><tbody>" + rows + "</tbody></table></div></div>";
  }

  /* =========================================================
     Phonological Processes Lab
     Every question plays one recording of a word said with one
     or two phonological processes, and offers all twelve
     processes to pick from, grouped by family. The answer is the
     set picked, dot-joined in sorted order. The reveal lines the
     target up against the recording, segment by segment, and
     tags each change with the process that made it.
     ========================================================= */
  var PP = L.bank.processes || { families: [], options: [] };
  var PP_OPT = {}, PP_ORDER = [];
  PP.options.forEach(function (o) { PP_OPT[o.v] = o; PP_ORDER.push(o.v); });
  function ppFam(v) { return (PP_OPT[v] || {}).fam || ""; }
  function ppLabel(v) { return (PP_OPT[v] || {}).label || v; }
  function ppSort(list) {
    return list.slice().sort(function (a, b) { return PP_ORDER.indexOf(a) - PP_ORDER.indexOf(b); });
  }
  function ppNames(list) {
    return ppSort(list).map(function (v) { return "<b>" + esc(ppLabel(v)) + "</b>"; }).join(" + ");
  }

  /* The two transcriptions, read straight off the alignment so they can never
     disagree with it. Each column is [target, recording, process]; an empty
     recording cell is a deleted sound. */
  function ppTarget(al) { return al.map(function (c) { return c[0]; }).join(""); }
  function ppHeard(al, over) { return over || al.map(function (c) { return c[1]; }).join(""); }

  /* Target over recording, one column per target sound, the changes coloured by
     process family and labelled underneath. Built still: ppPlay animates it. */
  function ppAlign(al, opts) {
    opts = opts || {};
    var n = al.length, cells = "", k;
    var cols = "grid-template-columns:auto repeat(" + n + ",minmax(1.9em,auto))";
    cells += '<span class="pa-lab" style="grid-row:1;grid-column:1">' + esc(opts.top || "Target") + "</span>";
    cells += '<span class="pa-lab" style="grid-row:2;grid-column:1">' + esc(opts.bottom || "Recording") + "</span>";
    for (k = 0; k < n; k++) {
      var c = al[k], ch = !!c[2], fam = ch ? ppFam(c[2]) : "";
      cells += '<span class="pa-t' + (ch ? " ch" : "") + '" style="grid-row:1;grid-column:' + (k + 2) + '">' +
        esc(c[0] || " ") + "</span>";
      cells += '<span class="pa-h' + (ch ? " ch f-" + fam + (c[1] ? "" : " del") : "") + '" data-k="' + k +
        '" style="grid-row:2;grid-column:' + (k + 2) + '">' +
        (ch ? '<span class="pa-was">' + esc(c[0] || " ") + "</span>" : "") +
        '<span class="pa-now">' + (c[1] ? esc(c[1]) : ch ? "&ndash;" : "") + "</span></span>";
    }
    // one tag per run of neighbouring columns changed by the same process; a tag that
    // starts within two columns of the one before drops to a second row, so two long
    // names never overlap
    var lastEnd = -9, lastRow = 4;
    for (k = 0; k < n; k++) {
      if (!al[k][2]) continue;
      var p = al[k][2], j = k;
      while (j + 1 < n && al[j + 1][2] === p) j++;
      var row = k - lastEnd <= 2 && lastRow === 3 ? 4 : 3;
      lastEnd = j; lastRow = row;
      cells += '<span class="pa-tag f-' + ppFam(p) + '" style="grid-row:' + row + ";grid-column:" + (k + 2) + " / " +
        (j + 3) + '"><span>' + esc(PP_OPT[p] ? PP_OPT[p].short || PP_OPT[p].label : p) + "</span></span>";
      k = j;
    }
    return '<div class="pp-align' + (opts.cls ? " " + opts.cls : "") + '" style="' + cols + '">' + cells + "</div>" +
      '<p class="pa-key" aria-hidden="true">Top row: ' + esc((opts.top || "Target").toLowerCase()) +
      " &middot; bottom row: " + esc((opts.bottom || "Recording").toLowerCase()) + "</p>";
  }

  /* Changes happen one after another, so the eye can follow each. Still for
     reduced motion, and on a revisit. */
  function ppPlay(root, instant) {
    if (!root) return;
    var grid = root.classList && root.classList.contains("pp-align") ? root : $(".pp-align", root);
    if (!grid) return;
    grid.classList.remove("played");
    $$(".pa-h.ch, .pa-tag", grid).forEach(function (x) { x.classList.remove("on"); });
    if (instant || L.reduced) {
      grid.classList.add("played");
      $$(".pa-h.ch, .pa-tag", grid).forEach(function (x) { x.classList.add("on"); });
      return;
    }
    void grid.offsetWidth;
    grid.classList.add("played");
    var ch = $$(".pa-h.ch", grid), tags = $$(".pa-tag", grid);
    ch.forEach(function (x, i) { setTimeout(function () { x.classList.add("on"); }, 380 + i * 330); });
    setTimeout(function () { tags.forEach(function (x) { x.classList.add("on"); }); }, 380 + ch.length * 330);
  }

  function ppSlowBtn(slug) {
    if (!L.audio.has(slug)) return "";
    return '<button type="button" class="spk pp-slow" data-play="' + slug + '" data-rate="0.6" ' +
      'aria-label="Play the recording slowly">' + ART.speaker() + "<span>Slow</span></button>";
  }

  /* The board of twelve, family by family. */
  function ppBoard() {
    return '<div class="pp-board" role="group" aria-label="Phonological processes">' +
      PP.families.map(function (f) {
        return '<div class="pp-fam f-' + f.id + '"><span class="pp-fam-lab">' + esc(f.label) + "</span>" +
          '<div class="pp-opts">' + PP.options.filter(function (o) { return o.fam === f.id; }).map(function (o) {
            return '<button type="button" class="pp-opt f-' + f.id + '" data-v="' + o.v + '" aria-pressed="false">' +
              '<span class="pp-box" aria-hidden="true"></span><span class="pp-name">' + esc(o.label) + "</span></button>";
          }).join("") + "</div></div>";
      }).join("") + "</div>";
  }

  /* A reminder of what each process is, folded away until wanted. */
  function ppGuide() {
    return '<details class="pp-guide"><summary>What each process means</summary><dl>' +
      PP.options.map(function (o) {
        return '<div class="pp-def f-' + o.fam + '"><dt>' + esc(o.label) + "</dt><dd>" + o.def + "</dd></div>";
      }).join("") + "</dl></details>";
  }

  function itemProcs(host, sc) {
    var leg = L.legs[sc.leg], it = leg.items[sc.i];
    var already = L.state.given[sc.t] != null;
    var picked = {}, locked = false;
    var want = it.answer.split(".");

    host.innerHTML = itemHead(sc, leg) +
      '<div class="card">' +
      '<p class="prompt">' + esc(it.prompt || leg.prompt) + "</p>" +
      '<div class="pp-target">' +
      '<div class="pp-word"><span class="pp-w">' + esc(it.word) + '</span><span class="pp-ipa">/' +
      esc(ppTarget(it.align)) + "/</span></div>" +
      '<div class="pp-play">' + L.audio.btn(it.audio, "Play the recording", "big") + ppSlowBtn(it.audio) + "</div>" +
      "</div>" +
      ppBoard() +
      '<p class="ms-tally" id="ppTally" aria-live="polite">Nothing picked yet.</p>' +
      ppGuide() +
      '<div id="fbHost"></div>' +
      "</div>" +
      actionBar("Check", { disabled: true });

    var stageCard = $(".card", host), tally = $("#ppTally", host);
    var btns = $$(".pp-opt", host);

    function chosen() { return ppSort(Object.keys(picked).filter(function (k) { return picked[k]; })); }
    function paint() {
      var set = chosen();
      btns.forEach(function (b) {
        var on = !!picked[b.getAttribute("data-v")];
        b.classList.toggle("sel", on);
        b.setAttribute("aria-pressed", String(on));
      });
      tally.innerHTML = set.length
        ? "Picked: " + ppNames(set) + '<span class="ms-hint"> (tap again to remove)</span>'
        : "Nothing picked yet.";
      $("#actBtn").disabled = !set.length;
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (locked) return;
        var v = b.getAttribute("data-v");
        picked[v] = !picked[v];
        paint();
      });
    });

    function lock(silent) {
      locked = true;
      var givenKey = String(L.state.given[sc.t]);
      var given = givenKey.split(".");
      var exact = L.isCorrect(sc.t), alt = L.isAlternate(sc.t);
      btns.forEach(function (b) {
        var v = b.getAttribute("data-v"), inW = want.indexOf(v) >= 0, inG = given.indexOf(v) >= 0;
        b.disabled = true;
        b.classList.remove("sel");
        b.setAttribute("aria-pressed", String(inG));
        if (inW && inG) b.classList.add("is-good");
        else if (inW) b.classList.add("is-missed");
        else if (inG) b.classList.add("is-bad");
      });
      tally.innerHTML = (want.length > 1 ? "Two processes: " : "The process: ") + ppNames(want) +
        (exact ? "" : '<span class="ms-hint"> · you picked ' + ppNames(given) + "</span>");

      // a line for each process picked that is not there, and each one missed
      var notes = "";
      ppSort(given).forEach(function (v) {
        if (want.indexOf(v) >= 0) return;
        notes += '<li class="pn-bad"><b>' + esc(ppLabel(v)) + "</b> is not in this one. " +
          ((it.why && it.why[v]) || (PP_OPT[v] ? PP_OPT[v].def : "")) + "</li>";
      });
      if (!alt) want.forEach(function (v) {
        if (given.indexOf(v) >= 0) return;
        notes += '<li class="pn-miss"><b>Missed: ' + esc(ppLabel(v)) + ".</b> " +
          (PP_OPT[v] ? PP_OPT[v].def : "") + "</li>";
      });

      var reveal = '<div class="reveal pp-reveal">' +
        '<p class="pp-line"><span class="pp-tr">/' + esc(ppTarget(it.align)) + '/</span>' +
        '<span class="pp-arrow" aria-hidden="true">&rarr;</span><span class="pp-tr heard">[' +
        esc(ppHeard(it.align, it.heard)) + "]</span>" +
        '<span class="vh">The target, then what the recording says.</span></p>' +
        ppAlign(it.align) +
        '<div class="pp-again">' + L.audio.btn(it.audio, "Hear it again") + ppSlowBtn(it.audio) +
        '<button type="button" class="tapper pp-replay">Replay the changes</button></div>' +
        (notes ? '<ul class="pp-notes">' + notes + "</ul>" : "") +
        "</div>";

      if (!exact && !alt && !silent) shake(stageCard);
      $("#fbHost", host).innerHTML = fbHTML(sc, it, reveal);
      L.tieIPA($("#fbHost", host));
      var rv = $(".pp-reveal", host);
      ppPlay(rv, silent);
      $(".pp-replay", host).addEventListener("click", function () { ppPlay(rv, false); });
      armContinue(sc);
    }

    paint();
    L.tieIPA(host);
    if (already) lock(true);
    else {
      // play the recording once on arrival; the buttons replay it
      var first = $(".pp-play .spk.big", host);
      if (first) L.audio.play(it.audio, first);
      onAct(function () {
        var set = chosen();
        if (!set.length || locked) return;
        // the stored key is alphabetical, like the bank's; the display order is the board's
        L.answer(sc, set.slice().sort().join("."), $(".pp-board", host));
        lock(false);
      });
    }
  }

  /* --- Process explorer: the worked example for either trail -----
     One tab per process, each with an example word no question uses.
     Tapping a tab plays its change on the alignment. */
  function demoProcs(host, leg) {
    var D = leg.demo, ex = D.examples;
    host.innerHTML =
      '<div class="demo"><h4>' + esc(D.title || "Worked examples, the processes in this trail") + "</h4>" +
      '<div class="demo-stage pp-demo">' +
      '<p class="dcap">' + (D.cap || "Tap each process to see what it does to a word.") + "</p>" +
      '<div class="pp-tabs" role="tablist" aria-label="Processes">' + ex.map(function (e, i) {
        return '<button type="button" class="pp-tab f-' + ppFam(e.proc) + '" role="tab" data-i="' + i +
          '" aria-selected="false"><span class="hintdot"></span>' + esc(ppLabel(e.proc)) + "</button>";
      }).join("") + "</div>" +
      '<div class="pp-demo-show" id="ppShow" role="tabpanel" aria-live="polite"></div>' +
      "</div></div>";

    var show = $("#ppShow", host), tabs = $$(".pp-tab", host);
    function open(i, instant) {
      var e = ex[i];
      tabs.forEach(function (t, k) {
        t.classList.toggle("on", k === i);
        t.setAttribute("aria-selected", String(k === i));
        if (k === i) t.classList.add("seen");
      });
      show.innerHTML =
        '<div class="pp-demo-word"><span class="pp-w">' + esc(e.word) + '</span>' +
        '<span class="pp-line"><span class="pp-tr">/' + esc(ppTarget(e.align)) + '/</span>' +
        '<span class="pp-arrow" aria-hidden="true">&rarr;</span><span class="pp-tr heard">[' +
        esc(ppHeard(e.align, e.heard)) + "]</span></span></div>" +
        ppAlign(e.align, { bottom: "Said as" }) +
        '<p class="pp-demo-cap"><b>' + esc(ppLabel(e.proc)) + ".</b> " + PP_OPT[e.proc].def + "</p>";
      L.tieIPA(show);
      ppPlay(show, instant);
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { open(+t.getAttribute("data-i"), false); });
    });
    open(0, true);
  }

  /* Checkpoint: each process in the trail, with the words that carried it and
     whether the student named it there. Then anything picked that was never
     there. */
  function recapProcs(li) {
    var leg = L.legs[li], rows = "", extra = {};
    var byProc = {};
    leg.items.forEach(function (it, i) {
      var t = li * L.per + i;
      var given = String(L.state.given[t] || "").split(".");
      it.answer.split(".").forEach(function (p) {
        (byProc[p] = byProc[p] || []).push({ word: it.word, hit: given.indexOf(p) >= 0 });
      });
      given.forEach(function (p) {
        if (p && it.answer.split(".").indexOf(p) < 0) extra[p] = (extra[p] || 0) + 1;
      });
    });
    ppSort(Object.keys(byProc)).forEach(function (p) {
      var list = byProc[p], hits = list.filter(function (x) { return x.hit; }).length;
      rows += '<tr><td><span class="pp-dot f-' + ppFam(p) + '"></span>' + esc(ppLabel(p)) + "</td><td>" +
        list.map(function (x) {
          return '<span class="pp-rw ' + (x.hit ? "ok" : "no") + '">' + esc(x.word) +
            '<span aria-hidden="true">' + (x.hit ? " &#10003;" : " &#10007;") + "</span>" +
            '<span class="vh">' + (x.hit ? ", named" : ", missed") + "</span></span>";
        }).join(" ") + '</td><td class="num">' + hits + " of " + list.length + "</td></tr>";
    });
    var ex = ppSort(Object.keys(extra));
    return '<div class="recap"><h3>Your process profile</h3>' +
      '<p class="recap-note">Every process in this trail, the words that carried it, and whether you named it ' +
      "there: a tick where you did, a cross where you missed it.</p>" +
      '<div class="table-wrap"><table class="recap-table pp-recap"><thead><tr><th>Process</th><th>Words</th>' +
      '<th style="text-align:right">Named</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      (ex.length
        ? '<p class="recap-note pp-extra">Picked where it was not there: ' + ex.map(function (p) {
            return "<b>" + esc(ppLabel(p)) + "</b>" + (extra[p] > 1 ? " &times;" + extra[p] : "");
          }).join(", ") + ". Worth a second look at <i>What each process means</i>.</p>"
        : '<p class="recap-note pp-extra">No false alarms: you never picked a process that was not there.</p>') +
      "</div>";
  }

  /* ---------------------------------------------------------
     Checkpoint recaps: the holistic picture at the end of a
     trail. Trail 1 shows every part sorted into its system;
     Trail 2 shows the diagram fully labelled. Each label carries
     the student's own result.
     --------------------------------------------------------- */
  function recapMark(t) {
    if (L.isCorrect(t)) return '<i class="rc-mark ok" aria-hidden="true">&#10003;</i><span class="vh">, correct</span>';
    if (L.isAlternate(t)) return '<i class="rc-mark alt" aria-hidden="true">&#189;</i><span class="vh">, a near miss</span>';
    return '<i class="rc-mark no" aria-hidden="true">&#10007;</i><span class="vh">, missed</span>';
  }

  function recapSystems(li) {
    var leg = L.legs[li];
    var bins = leg.choices.map(function (c) {
      var chips = "";
      leg.items.forEach(function (it, i) {
        if (it.answer !== c.v) return;
        chips += '<span class="recap-chip">' + esc(it.word) + recapMark(li * L.per + i) + "</span>";
      });
      return '<div class="recap-bin"><div class="recap-bin-head">' + ART.systemIcon(c.icon) +
        "<b>" + esc(c.label) + "</b><small>" + esc(c.tag) + "</small></div>" +
        '<div class="recap-chips">' + chips + "</div></div>";
    }).join("");
    return '<div class="recap"><h3>The whole machine</h3>' +
      '<p class="recap-note">All ten parts in their systems, with your answers marked.</p>' +
      '<div class="recap-bins">' + bins + "</div></div>";
  }

  /* Label lanes for the full map: which side each label sits on and its
     height, in the diagram's own coordinates, so the leader lines land
     exactly on their regions at any size. */
  var RECAP_LANES = {
    nasal_cavity: ["l", 200], hard_palate: ["l", 275], oral_cavity: ["l", 345],
    lips: ["l", 415], tongue: ["l", 485],
    pharynx: ["r", 330], larynx: ["r", 525], vocal_folds: ["r", 592],
    trachea: ["r", 680], lungs: ["r", 850]
  };

  function recapPathway(li) {
    var leg = L.legs[li];
    var lines = "", labels = "";
    leg.items.forEach(function (it, i) {
      var lane = RECAP_LANES[it.answer], a = ART.sagAnchor[it.answer];
      if (!lane || !a) return;
      var lx = lane[0] === "l" ? 26 : 774, ly = lane[1];
      lines += '<line x1="' + lx + '" y1="' + ly + '" x2="' + a[0] + '" y2="' + a[1] + '"/>' +
        '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="3.4"/>';
      labels += '<span class="recap-label ' + lane[0] + '" style="top:' +
        (ly / ART.sagH * 100).toFixed(2) + '%">' + esc(it.word) + recapMark(li * L.per + i) + "</span>";
    });
    return '<div class="recap"><h3>The whole pathway</h3>' +
      '<p class="recap-note">Every stop on the road from the lungs to the lips, with your answers marked.</p>' +
      '<div class="diagram-wrap recap-diagram">' + ART.sagittal() +
      '<svg class="lead-svg" viewBox="0 0 ' + ART.sagW + ' ' + ART.sagH + '" aria-hidden="true">' + lines + "</svg>" +
      '<div class="sag-overlay">' + labels + "</div></div></div>";
  }

  /* Labs 3 and 4, Trail 1: the map fully labelled, then every sound with its
     articulators and the student's mark. Each sound is a button: the map moves
     into it, with its recording, and lights the parts it uses. */
  function recapArticulators(li) {
    var leg = L.legs[li];
    var LABEL = {}, order = leg.regions.map(function (r) { return r.v; });
    leg.regions.forEach(function (r) { LABEL[r.v] = r.label; });
    var rows = leg.items.map(function (it, i) {
      var sets = [it.answer].concat((it.also || []).filter(function (k) {
        return (it.quiet || []).indexOf(k) < 0;
      }));
      return '<button type="button" class="recap-chip am-chip" data-i="' + i + '" aria-label="Show and play ' +
        esc(it.ipa) + '">/' + esc(it.ipa) + "/ <small>" +
        esc(sets.map(function (k) {
          return k.split(".").sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); })
            .map(function (v) { return LABEL[v]; }).join(" + ");
        }).join(" or ")) + "</small>" +
        recapMark(li * L.per + i) + "</button>";
    }).join("");
    return '<div class="recap"><h3>The whole mouth</h3>' +
      '<p class="recap-note">Every articulator on the map, and the ten sounds with your answers marked. ' +
      "<b>Tap a sound</b> to watch it being made and hear it.</p>" +
      '<div class="am-wrap recap-diagram" id="amRecap">' + ART.amap(ipaSlug(leg.items[0].ipa)) + "</div>" +
      '<div class="recap-chips" style="margin-top:14px">' + rows + "</div></div>";
  }
  function wireArticulators(host, li) {
    var leg = L.legs[li], mapHost = $("#amRecap", host);
    var LABEL = {};
    leg.regions.forEach(function (r) { LABEL[r.v] = r.label; });
    function draw(slug, lit) {
      mapHost.innerHTML = ART.amap(slug);
      var fig = $(".am-fig", mapHost), map = ART.amapCtl(fig);
      $$(".rgn", mapHost).forEach(function (g) {
        var on = lit && lit.indexOf(g.getAttribute("data-v")) >= 0;
        g.classList.toggle("flow-now", !!on);
        g.classList.toggle("am-faint", !on);
      });
      map.labels(leg.regions.map(function (r) {
        return { v: r.v, text: r.label, cls: lit && lit.indexOf(r.v) >= 0 ? "now" : "plain" };
      }));
      return { fig: fig, map: map };
    }
    draw(ipaSlug(leg.items[0].ipa), null);
    $$(".am-chip", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var it = leg.items[+b.getAttribute("data-i")];
        $$(".am-chip", host).forEach(function (x) { x.classList.toggle("on", x === b); });
        var M = draw(ipaSlug(it.ipa), it.answer.split("."));
        syncPlay(M.map, M.fig, true, b);
      });
    });
  }

  /* Labs 3 and 4, Trail 2: the ten sounds as a small table of their three clues.
     Each symbol is a button that shows the sound's picture and plays it. */
  function recapDetective(li) {
    var leg = L.legs[li];
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    var rows = leg.items.map(function (it, i) {
      return '<tr><td class="rc-ipa"><button type="button" class="cc-s cc-tap t" data-s="' + it.answer +
        '" aria-label="Show and play ' + esc(IPA_OF[it.answer]) + '">/' + esc(IPA_OF[it.answer]) + "/</button></td><td>" +
        esc(it.panel.place) + "</td><td>" + esc(it.panel.manner) + "</td><td>" + (it.panel.voiced ? "voiced" : "voiceless") +
        "</td><td>" + recapMark(li * L.per + i) + "</td></tr>";
    }).join("");
    return '<div class="recap"><h3>The ten sounds, solved</h3>' +
      '<p class="recap-note">Where, how, and voice, with your answers marked. <b>Tap a sound</b> to watch it ' +
      "being made and hear it.</p>" +
      '<div class="table-wrap"><table class="recap-table"><thead><tr><th>Sound</th><th>Where</th><th>How</th><th>Voice</th><th></th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table></div>" +
      '<div class="cc-show" id="ccShow" aria-live="polite"></div></div>';
  }
  function wireDetective(host, li) {
    var leg = L.legs[li], show = $("#ccShow", host);
    var IPA_OF = {};
    leg.tiles.forEach(function (t) { IPA_OF[t.slug] = t.ipa; });
    $$(".cc-tap", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var s = b.getAttribute("data-s");
        $$(".cc-tap", host).forEach(function (x) { x.classList.toggle("on", x === b); });
        show.innerHTML = '<p class="cc-show-head"><span class="ipa-keep">/' + esc(IPA_OF[s]) + "/</span></p>" +
          readFig(s, { noDesc: true });
        L.tieIPA(show);
        var F = wireFig(show, { sound: true });
        if (F) F.play(true, b);
        else if (L.audio.has("ipa_" + s)) L.audio.play("ipa_" + s, b);
      });
    });
  }

  var RECAPS = { ss: recapSystems, pw: recapPathway, af: recapArticulators, sd: recapDetective,
    vf: recapVowelChart, tm: recapTongue, wp: recapProcs, sp: recapProcs,
    cc: recapConsonants, tr: recapTranscribe };
  /* recaps that need wiring once they are on the page */
  var RECAP_WIRE = { cc: wireConsonants, af: wireArticulators, sd: wireDetective };

  /* ---------------------------------------------------------
     Checkpoint, after each leg
     --------------------------------------------------------- */
  // "Listen, then write each word in IPA" -> "listen, then write each word in IPA"
  function lowerFirst(str) { return str.charAt(0).toLowerCase() + str.slice(1); }

  function checkpoint(host, sc) {
    var leg = L.legs[sc.leg];
    var got = L.legGems(sc.leg), of = leg.items.length;
    var alts = L.legAlternates(sc.leg);
    var whole = got - alts * L.altCredit;
    var last = sc.leg === L.legs.length - 1;

    var gemRow = "";
    for (var i = 0; i < of; i++) {
      var draw = i < whole ? ART.gem() : i < whole + alts ? ART.gemHalf() : ART.gem({ cls: "off" });
      gemRow += draw.replace("<svg", '<svg style="animation-delay:' + Math.min(i * 45, 400) + 'ms"');
    }

    var line = got === of
      ? "Every one. That is the whole " + UNIT.toLowerCase() + " cleared."
      : got >= of * 0.7
        ? "Solid work."
        : got >= of * 0.4
          ? "Good effort." + (last ? "" : " Keep going.")
          : "This one was hard." + (last ? "" : " Every question ahead is worth a full gem.");

    host.innerHTML =
      '<div class="card cp">' +
      ART.chest(true, { cls: "chest" }) +
      "<h2>" + UNIT + " " + leg.n + " complete</h2>" +
      '<p class="cp-score">' + L.fmtGems(got) + " <small>of " + of + " gems</small></p>" +
      '<div class="gem-grid">' + gemRow + "</div>" +
      (alts ? '<p class="alt-line">' + (alts === 1
        ? "1 near miss on this " + UNIT.toLowerCase() + ", worth half a gem."
        : alts + " near misses on this " + UNIT.toLowerCase() + ", half a gem each.") + "</p>" : "") +
      "<p>" + esc(line) + "</p>" +
      (RECAPS[leg.id] ? RECAPS[leg.id](sc.leg) : "") +
      (last
        ? ""
        : '<p style="color:var(--muted);font-size:.94rem">Up next: <b>' +
          esc(L.legs[sc.leg + 1].title) + "</b>, " + esc(lowerFirst(L.legs[sc.leg + 1].subtitle)) + ".</p>") +
      "</div>" +
      actionBar(last ? "See your results" : "Continue to " + L.legs[sc.leg + 1].title);

    if (RECAP_WIRE[leg.id]) RECAP_WIRE[leg.id](host, sc.leg);
    L.rail.cheer();
    if (got >= of * 0.7) { L.sfx.cheer(); L.fx.burst($(".chest", host)); }
    onAct(function () { L.next(); });
  }

  /* ---------------------------------------------------------
     Finish
     --------------------------------------------------------- */
  function finish(host) {
    var G = L.bank.grading;
    var got = L.gems(), score = L.scoreOf(got), pts = L.pointsOf(got);
    var eff = L.graded(got);
    var tier = L.completion ? "full" : eff >= G.full_threshold ? "full" : eff >= 1 ? "part" : "none";
    var tierLabel = L.completion ? "Complete"
      : tier === "full" ? "Full credit" : tier === "part" ? "Partial credit" : "No gems yet";

    var rows = L.legs.map(function (leg, li) {
      var a = L.legAlternates(li);
      return "<tr><td>" + UNIT + " " + leg.n + " · " + esc(leg.title) +
        (a ? ' <span class="alt-tag">' + a + " near " + (a === 1 ? "miss" : "misses") + "</span>" : "") +
        '</td><td class="num">' + L.fmtGems(L.legGems(li)) + " / " + leg.items.length + "</td></tr>";
    }).join("");

    var alts = L.alternates();
    var whole = got - alts * L.altCredit;
    var gemRow = "";
    for (var i = 0; i < L.total; i++) {
      var draw = i < whole ? ART.gem() : i < whole + alts ? ART.gemHalf() : ART.gem({ cls: "off" });
      gemRow += draw.replace("<svg", '<svg style="animation-delay:' + Math.min(i * 16, 440) + 'ms"');
    }

    host.innerHTML =
      '<div class="card cp">' +
      ART.chest(true, { cls: "chest" }) +
      "<h2>" + esc(LABEL) + " complete</h2>" +
      '<p class="cp-score">' + L.fmtGems(got) + " <small>of " + L.total + " gems</small></p>" +
      '<div class="gem-grid">' + gemRow + "</div>" +
      (alts
        ? '<p class="alt-line">' + (alts === 1 ? "1 near miss, worth half a gem" : alts + " near misses at half a gem each") +
          // the rounding only matters where there is a grade: the Moodle version
          (!L.completion && L.mode === "scorm" && eff !== got
            ? ". Halves round up, so " + L.fmtGems(got) + " counts as <b>" + eff + "</b>.</p>"
            : ".</p>")
        : "") +
      (L.mode === "scorm" ? '<div><span class="tier ' + tier + '">' + esc(tierLabel) + "</span></div>" : "") +
      '<table class="tally"><thead><tr><th>Activity</th><th style="text-align:right">Gems</th></tr></thead>' +
      "<tbody>" + rows + "</tbody>" +
      '<tfoot><tr><td>Total</td><td class="num">' + L.fmtGems(got) + " / " + L.total +
      "</td></tr></tfoot></table>" +
      submitBlock(got, score, pts) +
      "</div>";

    L.rail.cheer();
    if (tier === "full") {
      L.sfx.finale();
      L.fx.finale($(".chest", host));
    } else {
      L.sfx.cheer();
      L.fx.burst($(".chest", host));
    }

    if (L.mode === "scorm") wireSubmit(got, score, pts);
  }

  function submitBlock(got, score, pts) {
    var G = L.bank.grading;
    if (L.mode !== "scorm") return "";
    var done = L.state.submitted;
    return '<div class="submit-box">' +
      '<div class="callout c-info"><span class="ic" aria-hidden="true">&#9432;</span>' +
      "<h4>One step left</h4><p>Your answers are not in the gradebook yet. Pressing the button below " +
      (L.completion
        ? "marks the lab complete and sends the full score of <b>" + score + " out of 100</b>. " +
          "Your gems are feedback and do not change it. "
        : "sends a score of <b>" + score + " out of 100</b>, which is worth <b>" + pts + " of " +
          G.full_points + " points</b> for this lab. ") +
      "You can only submit once.</p></div>" +
      '<button type="button" class="pb gem-btn wide" id="submitBtn"' + (done ? " disabled" : "") + ">" +
      (done ? "Already submitted" : "Submit my " + L.fmtGems(got) + " gems to Moodle") + "</button>" +
      '<div class="submit-msg' + (done ? " show ok" : "") + '" id="submitMsg" role="status" tabindex="-1">' +
      (done ? "This attempt was already submitted. Your score is in the gradebook." : "") +
      "</div></div>";
  }

  function wireSubmit(got, score, pts) {
    var btn = $("#submitBtn"), msg = $("#submitMsg");
    if (!btn || btn.disabled) return;
    btn.addEventListener("click", function () {
      btn.disabled = true;
      btn.textContent = "Submitting…";
      var r = L.commitGrade();
      msg.className = "submit-msg show " + (r.ok ? "ok" : (r.preview ? "ok" : "err"));
      if (r.preview) {
        msg.innerHTML = "<b>Preview mode.</b> No SCORM connection was found, so nothing was sent. " +
          "Your answers are saved in this browser. Open the activity from inside Moodle to record " +
          "a grade.";
      } else if (r.ok) {
        msg.innerHTML = "<b>Submitted.</b> A score of <b>" + r.score + " out of 100</b> was recorded" +
          (L.completion ? ", and the lab is marked complete. "
            : ", worth <b>" + pts + "</b> points for this lab. ") + "You can close this window.";
        L.fx.burst(btn);
        L.sfx.cheer();
      } else {
        msg.innerHTML = "<b>We could not confirm the submission.</b> Moodle reported a status of “" +
          esc(r.status || "unknown") + "”. Your answers are saved. Close this window, reopen the " +
          "activity, and try the button again. If it still fails, tell your instructor.";
      }
      btn.textContent = "Submitted";
      msg.focus && msg.focus();
    });
  }

  w.SCREENS = {
    intro: intro,
    concept: concept,
    item: item,
    checkpoint: checkpoint,
    finish: finish
  };
})(window, document);
