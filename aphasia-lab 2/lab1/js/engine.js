/* Case Lab engine.
   Eight clients (window.CASELAB.sets), answered one question at a time and forward only.
   SCORM copy (window.CASELAB_MODE = "scorm"): clients in order, eight questions each; results tables show raw scores
   and error notes, and the T and cut-off columns appear once question 2 is right. Progress is kept in SCORM 1.2
   suspend_data, and completion (passed, score 100) is recorded when the eighth client is finished.
   Web copy ("web"): a home page lists every client, and any client can be opened in any order; four questions each;
   each results row already carries its result (below the cut-off or within normal limits). Progress is kept quietly
   in localStorage, and "Start over" clears it. */
(function (w, d) {
  "use strict";
  var SETS = (w.CASELAB || {}).sets || [];
  var NS = SETS.length, NQ = NS ? SETS[0].questions.length : 0, TOTAL = NS * NQ;
  var MODE = w.CASELAB_MODE || "web", FREE = MODE !== "scorm";
  var STORE_KEY = "caselab_" + MODE + "_v1";
  var BLANK = new Array(NQ + 1).join("0");
  var LETTERS = "ABCD";
  /* Per client, one mark per question: "0" not yet answered, "w" tried and wrong so far, "1" right first try,
     "2" right later. seen: the model summary has been opened (the client is done). */
  var state = { started: false, marks: SETS.map(function () { return BLANK; }), seen: SETS.map(function () { return false; }), view: -1, recorded: false };
  /* Where progress goes: "lms" (SCORM API connected), "local" (localStorage: the web copy, or SCORM preview with no
     API), "none" (an LMS API was found but would not connect: keep progress in memory only, never in a shared browser). */
  var store = "local";
  var tabIndex = 0, shownOnce = false, startedAt = Date.now(), resetTimer = null;

  function $(id) { return d.getElementById(id); }
  function h(tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function btn(label, cls, fn) { var b = h("button", cls, label); b.type = "button"; if (fn) b.addEventListener("click", fn); return b; }
  function focus(el) { if (el) { try { el.focus({ preventScroll: true }); } catch (e) { } } }
  function shuffle(a, seed) { var r = seed || 1, x = a.slice(); for (var i = x.length - 1; i > 0; i--) { r = (r * 9301 + 49297) % 233280; var j = Math.floor(r / 233280 * (i + 1)); var t = x[i]; x[i] = x[j]; x[j] = t; } return x; }

  /* ------------------------------------------------------------------ progress */
  function mark(s, q) { return state.marks[s].charAt(q); }
  function setMark(s, q, m) { var a = state.marks[s].split(""); a[q] = m; state.marks[s] = a.join(""); }
  function isRight(m) { return m === "1" || m === "2"; }
  function currentQ(s) { for (var q = 0; q < NQ; q++) if (!isRight(mark(s, q))) return q; return NQ; }
  function setDone(s) { return currentQ(s) === NQ && state.seen[s]; }
  function firstOpen() { for (var s = 0; s < NS; s++) if (!setDone(s)) return s; return NS; }
  function setGems(s) { var g = 0, m = state.marks[s]; for (var i = 0; i < m.length; i++) g += m.charAt(i) === "1" ? 1 : m.charAt(i) === "2" ? 0.5 : 0; return g; }
  function gems() { var g = 0; for (var s = 0; s < NS; s++) g += setGems(s); return g; }
  function fmt(g) { return g % 1 ? g.toFixed(1) : String(g); }

  function serialize() { return JSON.stringify({ v: 1, st: state.started ? 1 : 0, m: state.marks, s: state.seen.map(function (x) { return x ? 1 : 0; }).join(""), r: state.recorded ? 1 : 0 }); }
  function restore(str) {
    try {
      var o = JSON.parse(str);
      if (!o || o.v !== 1 || !o.m || o.m.length !== NS) return false;
      if (o.m.some(function (m) { return !/^[0w12]+$/.test(String(m)) || String(m).length !== NQ; })) return false;
      state.started = !!o.st; state.marks = o.m.map(String);
      state.seen = SETS.map(function (_, s) { return String(o.s || "").charAt(s) === "1"; });
      state.recorded = !!o.r;
      return true;
    } catch (e) { return false; }
  }
  function persist() {
    if (store === "lms") { w.SCORM.setSuspend(serialize()); w.SCORM.setLocation(String(state.view)); w.SCORM.commit(); }
    else if (store === "local") { try { w.localStorage.setItem(STORE_KEY, serialize()); } catch (e) { } }
  }

  /* ------------------------------------------------------------------ top bar */
  function renderChips() {
    var nav = $("chips"); nav.innerHTML = "";
    var open = firstOpen();
    SETS.forEach(function (set, s) {
      var done = setDone(s), locked = !FREE && (s > open || !state.started);
      var b = btn(String(s + 1), "chip" + (done ? " done" : "") + (s === state.view ? " on" : "") + (locked ? " locked" : ""), function () { if (!locked) show(s); });
      b.title = !locked ? "Client " + (s + 1) + ": " + set.name + (done ? " (done)" : "")
        : s === 0 ? "Client 1 opens when you start" : "Client " + (s + 1) + " opens after client " + s;
      b.setAttribute("aria-label", b.title);
      if (locked) b.setAttribute("aria-disabled", "true");
      if (s === state.view) b.setAttribute("aria-current", "step");
      nav.appendChild(b);
    });
    $("gemCount").textContent = fmt(gems()) + " / " + TOTAL;
  }

  /* ------------------------------------------------------------------ screens */
  function screen(id) { ["startScreen", "setScreen", "finishScreen"].forEach(function (x) { if ($(x)) $(x).hidden = x !== id; }); }
  function show(s) {
    if (FREE && s >= NS) s = -1;
    state.view = s; persist(); renderChips();
    var inSet = s >= 0 && s < NS;
    d.body.classList.toggle("fit", inSet);           /* the full-window, two-panel layout is for a client only */
    if ($("homeBtn")) $("homeBtn").hidden = !inSet;
    if (s === -1) { screen("startScreen"); if (FREE) renderHome(); }
    else if (s >= NS) { screen("finishScreen"); renderFinish(); }
    else { screen("setScreen"); renderSet(s); }
    w.scrollTo(0, 0);
    if (shownOnce) focus(inSet ? $("setName") : s === -1 ? ($("clientsH") || $("startH")) : $("finishH"));
    shownOnce = true;
  }

  /* ------------------------------------------------------------------ home page of the web copy: every client, any order */
  function status(s) {
    if (setDone(s)) return { cls: "done", text: "Done · " + fmt(setGems(s)) + " of " + NQ + " gems" };
    var q = currentQ(s);
    if (q === NQ) return { cls: "going", text: "Model summary next" };
    if (state.marks[s] !== BLANK) return { cls: "going", text: "Question " + (q + 1) + " of " + NQ };
    return { cls: "", text: "Not started" };
  }
  function renderHome() {
    var grid = $("clientGrid"), nDone = 0;
    grid.innerHTML = "";
    SETS.forEach(function (set, s) {
      var st = status(s); if (st.cls === "done") nDone++;
      var c = btn("", "ccard" + (st.cls ? " " + st.cls : ""), function () { show(s); });
      c.innerHTML = '<span class="cnum">Client ' + (s + 1) + "</span>" +
        '<span class="cname">' + esc(set.name) + "</span>" +
        '<span class="cwho">' + esc(set.card.who) + "</span>" +
        '<span class="cquote">' + esc(set.card.quote) + "</span>" +
        '<span class="ctags">' + set.card.tags.map(function (g) { return '<span class="ctag">' + esc(g) + "</span>"; }).join("") + "</span>" +
        '<span class="cstatus">' + (st.cls === "done" ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : "") + esc(st.text) + "</span>";
      c.setAttribute("aria-label", "Client " + (s + 1) + ", " + set.name + ", " + set.card.who + ". " + st.text);
      grid.appendChild(c);
    });
    $("homeProgress").textContent = nDone + " of " + NS + " clients done";
    $("resetBtn").hidden = state.marks.every(function (m) { return m === BLANK; });
    disarmReset();
    var banner = $("doneBanner");
    banner.hidden = nDone < NS;
    if (nDone === NS) banner.innerHTML = "All eight clients done, with <strong>" + fmt(gems()) + " of " + TOTAL + "</strong> gems. Open any client to look over its results and model summary again.";
  }
  function disarmReset() {
    var r = $("resetBtn");
    if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    r.textContent = "Start over"; r.classList.remove("armed");
  }
  function onReset() {
    var r = $("resetBtn");
    if (!resetTimer) { r.textContent = "Clear all progress?"; r.classList.add("armed"); resetTimer = setTimeout(disarmReset, 4000); return; }
    disarmReset();
    state.marks = SETS.map(function () { return BLANK; }); state.seen = SETS.map(function () { return false; });
    show(-1);
  }

  /* ------------------------------------------------------------------ one client */
  function revealed(s) { return MODE === "scorm" && isRight(mark(s, 0)) && isRight(mark(s, 1)); }
  function renderSet(s) {
    var set = SETS[s];
    $("setKicker").textContent = "Client " + (s + 1) + " of " + NS;
    $("setName").textContent = set.name;
    $("setBio").innerHTML = set.bio.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    tabIndex = 0; buildTabs(s); renderQuestion(s); renderFound(s);
    [].forEach.call(d.querySelectorAll(".panel"), function (p) { p.scrollTop = 0; });
  }

  /* Tabs: one Tab stop for the row (roving tabindex), arrow keys between tabs, focus kept on the chosen tab. */
  function buildTabs(s) {
    var tabs = SETS[s].tabs, row = $("tabs");
    row.innerHTML = "";
    tabs.forEach(function (t, i) {
      var b = btn(esc(t.title), "tab", function () { selectTab(s, i, false); });
      b.id = "tab-" + i; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "tabBody");
      b.addEventListener("keydown", function (e) {
        var n = tabs.length, j = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
        if (j >= 0) { e.preventDefault(); selectTab(s, j, true); }
      });
      row.appendChild(b);
    });
    selectTab(s, tabIndex, false);
  }
  function selectTab(s, i, moveFocus) {
    tabIndex = i;
    [].forEach.call($("tabs").children, function (b, j) {
      var on = j === i;
      b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
    });
    $("tabBody").setAttribute("aria-labelledby", "tab-" + i);
    renderTabBody(s);
    if (moveFocus) focus($("tabs").children[i]);
  }
  function renderTabBody(s) {
    var t = SETS[s].tabs[tabIndex];
    var pub = t.rows[0].v != null, rev = !pub && revealed(s);
    var html = t.sample ? '<p class="sample"><span>Sample</span>' + esc(t.sample) + "</p>" : "";
    html += '<div class="tablewrap"><table class="res' + (rev ? " rev" : "") + (pub ? " pub" : "") + '"><thead><tr><th>Subtest</th><th class="num">Raw</th>' +
      (rev ? '<th class="num">T</th><th class="num">Cut-off</th>' : "") + (pub ? "<th>Result</th>" : "") + "<th>What the errors look like</th></tr></thead><tbody>";
    t.rows.forEach(function (r) {
      html += "<tr><td>" + esc(r.label) + '</td><td class="num" data-l="Raw">' + esc(r.raw) + "</td>" +
        (rev ? '<td class="num" data-l="T">' + r.T + '</td><td class="num cut' + (r.cut.length > 10 ? " long" : "") + '" data-l="Cut-off">' + cutHtml(r.cut) + "</td>" : "") +
        (pub ? '<td class="verdict"><span class="vtag' + (/^below/i.test(r.v) ? " below" : "") + '">' + esc(r.v) + "</span></td>" : "") +
        '<td class="note">' + esc(r.note) + "</td></tr>";
    });
    html += "</tbody></table></div>";
    if (MODE === "scorm" && !rev) html += '<p class="tabnote">The T-scores and cut-offs appear after question 2.</p>';
    $("tabBody").innerHTML = html;
  }

  function cutHtml(c) {                     /* "1 or fewer (T 56)" may break only before its T-score */
    return esc(c).replace(/ \(T /, "\u0001").replace(/ /g, "&nbsp;").replace("\u0001", " (T&nbsp;");
  }

  function renderFound(s) {
    var list = $("foundList"), n = 0;
    list.innerHTML = "";
    SETS[s].questions.forEach(function (q, i) { if (q.found && isRight(mark(s, i))) { list.appendChild(h("li", null, esc(q.found))); n++; } });
    $("found").hidden = n === 0;
  }

  /* ------------------------------------------------------------------ questions */
  function renderQuestion(s) {
    var qi = currentQ(s), body = $("qBody"), next = $("qNext");
    body.innerHTML = "";
    if (qi === NQ) { renderSummary(s); return; }
    var q = SETS[s].questions[qi];
    $("qH").textContent = "Question " + (qi + 1) + " of " + NQ;
    next.hidden = false; next.disabled = true; next.onclick = null;
    var card = h("div", "qcard");
    card.appendChild(h("p", "stem", esc(q.stem)));
    var api = ({ single: single, tf: truefalse, match: matching, fill: filling })[q.type](q, card, s, qi);
    var check = btn("Check", "btn", null);
    var fb = h("div", "fb"); fb.setAttribute("role", "status");
    var row = h("div", "row"); row.appendChild(check);
    card.appendChild(row); card.appendChild(fb);
    body.appendChild(card);
    check.addEventListener("click", function () {
      var res = api.check();
      if (res === null) { fb.className = "fb show no"; fb.innerHTML = "<p>" + api.empty + "</p>"; return; }
      if (res === true) {
        var m = mark(s, qi) === "w" ? "2" : "1"; setMark(s, qi, m);
        api.lock(); check.disabled = true;
        fb.className = "fb show ok";
        fb.innerHTML = '<p class="ttl">' + (m === "1" ? "Right, first try: one gem" : "Right: half a gem") + "</p>" + (q.explain ? "<p>" + esc(q.explain) + "</p>" : "");
        persist(); renderChips(); renderFound(s);
        if (MODE === "scorm" && qi === 1) renderTabBody(s);
        next.disabled = false;
        next.onclick = function () {
          renderQuestion(s);
          var p = d.querySelector(".panel.questions"); p.scrollTop = 0;
          if (p.getBoundingClientRect().top < 0) p.scrollIntoView();
          focus($("qH"));
        };
        fb.scrollIntoView({ block: "nearest" });
        focus(next);
      } else {
        if (mark(s, qi) === "0") { setMark(s, qi, "w"); persist(); }
        fb.className = "fb show no";
        fb.innerHTML = '<p class="ttl">Not yet</p>' + (res ? "<p>" + esc(res) + "</p>" : "");
        fb.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function choiceList(labels, card) {
    var list = h("div", "opts"), picked = -1, items = [];
    labels.forEach(function (o, i) {
      var b = btn('<span class="k">' + LETTERS.charAt(i) + "</span><span>" + esc(o) + "</span>", "opt");
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (list.classList.contains("done")) return;
        picked = i;
        items.forEach(function (x, j) { x.setAttribute("aria-pressed", String(j === i)); x.classList.remove("wrong"); x.removeAttribute("aria-invalid"); });
      });
      items.push(b); list.appendChild(b);
    });
    card.appendChild(list);
    return {
      get: function () { return picked; },
      judge: function (i, ok) { items[i].classList.add(ok ? "right" : "wrong"); if (!ok) items[i].setAttribute("aria-invalid", "true"); },
      lock: function () { list.classList.add("done"); },
      list: list
    };
  }

  function single(q, card) {
    var cl = choiceList(q.options.map(function (o) { return o.t; }), card);
    return {
      empty: "Choose an answer first.",
      check: function () {
        var i = cl.get(); if (i < 0) return null;
        cl.judge(i, q.options[i].ok);
        return q.options[i].ok ? true : q.options[i].fb || "";
      },
      lock: cl.lock
    };
  }

  function truefalse(q, card) {
    var cl = choiceList(["True", "False"], card);
    cl.list.classList.add("tf");
    return {
      empty: "Choose True or False first.",
      check: function () {
        var i = cl.get(); if (i < 0) return null;
        var ok = (i === 0) === q.answer;
        cl.judge(i, ok);
        return ok ? true : q.fb;
      },
      lock: cl.lock
    };
  }

  function matching(q, card) {
    var picks = q.rows.map(function () { return null; }), rows = [];
    var box = h("div", "match"), group = "";
    q.rows.forEach(function (r, ri) {
      if (r.g && r.g !== group) { group = r.g; box.appendChild(h("p", "mgroup", esc(group))); }
      var row = h("div", "mrow"); row.appendChild(h("span", "mterm", esc(r.t)));
      var grp = h("div", "mchoices"); grp.setAttribute("role", "group"); grp.setAttribute("aria-label", (r.g ? r.g + ": " : "") + r.t);
      q.choices.forEach(function (c) {
        var b = btn(esc(c), "pill"); b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          if (box.classList.contains("done")) return;
          picks[ri] = c; row.classList.remove("wrong"); grp.removeAttribute("aria-invalid");
          [].forEach.call(grp.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        });
        grp.appendChild(b);
      });
      row.appendChild(grp); box.appendChild(row); rows.push({ row: row, grp: grp });
    });
    card.appendChild(box);
    return {
      empty: "Choose an answer for every row first.",
      check: function () {
        if (picks.some(function (p) { return p === null; })) return null;
        var wrong = 0;
        q.rows.forEach(function (r, ri) {
          var bad = picks[ri] !== r.a;
          rows[ri].row.classList.toggle("wrong", bad);
          if (bad) { rows[ri].grp.setAttribute("aria-invalid", "true"); wrong++; } else rows[ri].grp.removeAttribute("aria-invalid");
        });
        if (!wrong) return true;
        return "Look again at the row" + (wrong > 1 ? "s" : "") + " marked ✕, comparing each score with its cut-off.";
      },
      lock: function () { box.classList.add("done"); rows.forEach(function (r) { r.row.classList.add("right"); }); }
    };
  }

  function filling(q, card, s, qi) {
    var answers = q.parts.filter(function (_, i) { return i % 2 === 1; });
    var bank = shuffle(answers.concat(q.decoys), 7 + s * 13 + qi);
    var held = answers.map(function () { return null; }), sel = null, dragging = null;
    card.appendChild(h("p", "hint", "Drag each phrase into a blank, or tap a phrase and then a blank. Tap a filled blank to take its phrase back. Some phrases are left over."));
    var para = h("p", "fillpara"), slots = [];
    function done() { return para.classList.contains("done"); }
    q.parts.forEach(function (t, i) {
      if (i % 2 === 0) { para.appendChild(d.createTextNode(t)); return; }
      var bi = (i - 1) / 2, slot = btn("", "slot");
      slot.setAttribute("aria-label", "Blank " + (bi + 1) + ": empty");
      slot.addEventListener("click", function () { if (done()) return; if (sel !== null) place(sel, bi); else if (held[bi] !== null) release(bi); });
      slot.addEventListener("dragover", function (e) { if (dragging === null || done()) return; e.preventDefault(); slot.classList.add("over"); });
      slot.addEventListener("dragleave", function () { slot.classList.remove("over"); });
      slot.addEventListener("drop", function (e) {
        slot.classList.remove("over");
        if (dragging === null || done()) return;
        e.preventDefault(); place(dragging, bi); dragging = null;
      });
      slots.push(slot); para.appendChild(slot);
    });
    var chips = h("div", "bank"), chipEls = [];
    bank.forEach(function (t, ci) {
      var c = btn(esc(t), "phrase"); c.draggable = true; c.setAttribute("aria-pressed", "false");
      c.addEventListener("click", function () {
        if (done() || c.classList.contains("used")) return;
        sel = sel === ci ? null : ci;
        chipEls.forEach(function (x, j) { x.setAttribute("aria-pressed", String(j === sel)); });
      });
      c.addEventListener("dragstart", function (e) {
        if (done() || c.classList.contains("used")) { e.preventDefault(); return; }
        dragging = ci; e.dataTransfer.setData("text/plain", t); e.dataTransfer.effectAllowed = "move";
      });
      c.addEventListener("dragend", function () { dragging = null; });
      chipEls.push(c); chips.appendChild(c);
    });
    function place(ci, bi) {
      if (held[bi] !== null) release(bi);
      var prev = held.indexOf(ci); if (prev >= 0) release(prev);
      held[bi] = ci; slots[bi].textContent = bank[ci];
      slots[bi].classList.add("filled"); slots[bi].classList.remove("wrong"); slots[bi].removeAttribute("aria-invalid");
      slots[bi].setAttribute("aria-label", "Blank " + (bi + 1) + ": " + bank[ci]);
      chipEls[ci].classList.add("used"); chipEls[ci].setAttribute("aria-disabled", "true");
      sel = null; chipEls.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    }
    function release(bi) {
      var ci = held[bi]; if (ci === null) return;
      held[bi] = null; slots[bi].textContent = "";
      slots[bi].classList.remove("filled", "wrong"); slots[bi].removeAttribute("aria-invalid");
      slots[bi].setAttribute("aria-label", "Blank " + (bi + 1) + ": empty");
      chipEls[ci].classList.remove("used"); chipEls[ci].removeAttribute("aria-disabled");
    }
    card.appendChild(para); card.appendChild(chips);
    return {
      empty: "Fill every blank first.",
      check: function () {
        if (held.some(function (x) { return x === null; })) return null;
        var wrong = 0;
        held.forEach(function (ci, bi) {
          var bad = bank[ci] !== answers[bi];
          slots[bi].classList.toggle("wrong", bad);
          if (bad) { slots[bi].setAttribute("aria-invalid", "true"); wrong++; }
        });
        return wrong ? "The blank" + (wrong > 1 ? "s" : "") + " marked ✕ need" + (wrong > 1 ? "" : "s") + " another phrase." : true;
      },
      lock: function () { para.classList.add("done"); slots.forEach(function (x) { x.classList.add("right"); x.disabled = true; }); chips.hidden = true; }
    };
  }

  /* ------------------------------------------------------------------ end of a client */
  function renderSummary(s) {
    var set = SETS[s], body = $("qBody");
    $("qH").textContent = "Model summary";
    $("qNext").hidden = true;
    body.innerHTML = "";
    var card = h("div", "qcard summary");
    card.appendChild(h("p", "lead", "The full chart summary for " + esc(set.name) + ":"));
    card.appendChild(h("blockquote", "model", esc(set.summary)));
    if (!state.seen[s]) { state.seen[s] = true; persist(); renderChips(); }
    var row = h("div", "row");
    if (FREE) {
      var nxt = -1;
      for (var k = 1; k < NS && nxt < 0; k++) if (!setDone((s + k) % NS)) nxt = (s + k) % NS;
      if (nxt >= 0) row.appendChild(btn("Next client: " + esc(SETS[nxt].name) + " &#8594;", "btn go", function () { show(nxt); }));
      row.appendChild(btn("All clients", nxt >= 0 ? "btn ghost" : "btn go", function () { show(-1); }));
    } else {
      var last = s === NS - 1;
      row.appendChild(btn(last ? "Finish" : "Next client &#8594;", "btn go", function () { show(last ? NS : s + 1); }));
    }
    card.appendChild(row);
    body.appendChild(card);
    if (firstOpen() === NS) record();
  }

  function record() {                       /* SCORM completion; the web copy has nothing to record */
    if (state.recorded || FREE) return;
    state.recorded = store === "lms" ? !!w.SCORM.setPassedComplete() : true;
    persist();
  }

  function renderFinish() {
    if (firstOpen() < NS) { show(firstOpen()); return; }
    record();
    $("finishGems").innerHTML = "You earned <strong>" + fmt(gems()) + " of " + TOTAL + "</strong> gems.";
    $("finishMsg").textContent = store === "lms"
      ? (state.recorded ? "Your completion is recorded." : "Moodle did not confirm your completion. Your progress is saved; open the activity again to finish.")
      : store === "none" ? "This page is not connected to Moodle, so nothing was recorded." : "Your progress is saved in this browser.";
  }

  /* ------------------------------------------------------------------ start */
  function sessionTime() {
    var t = Math.round((Date.now() - startedAt) / 1000);
    function p(x) { return (x < 10 ? "0" : "") + x; }
    return p(Math.min(9999, Math.floor(t / 3600))) + ":" + p(Math.floor(t % 3600 / 60)) + ":" + p(t % 60);
  }
  function rerenderFromStorage(e) {          /* another tab saved progress: show it here too */
    if (e.key !== STORE_KEY || !e.newValue || !restore(e.newValue)) return;
    renderChips();
    if (state.view === -1) { if (FREE) renderHome(); }
    else if (state.view < NS) renderSet(state.view);
    else renderFinish();
  }
  function init() {
    if (MODE === "scorm") {
      var lms = w.SCORM ? w.SCORM.init() : false;
      if (lms) {
        store = "lms";
        var sus = w.SCORM.getSuspend();
        if (sus) restore(sus);
        var st = w.SCORM.getStatus();
        state.recorded = st === "passed" || st === "completed";      /* the LMS, not suspend_data, says whether the pass is recorded */
      } else if (w.SCORM && w.SCORM.apiFound()) {
        store = "none";
        $("previewBanner").textContent = "This page could not connect to Moodle, so your answers will not be saved. Close this window and open the activity again.";
        $("previewBanner").classList.add("show");
      } else {
        $("previewBanner").classList.add("show");
      }
    }
    if (store === "local") {
      try { var saved = w.localStorage.getItem(STORE_KEY); if (saved) restore(saved); } catch (e) { }
      w.addEventListener("storage", rerenderFromStorage);
    }
    if ($("startBtn")) $("startBtn").addEventListener("click", function () { state.started = true; show(0); });
    if ($("homeBtn")) $("homeBtn").addEventListener("click", function () { show(-1); });
    if ($("resetBtn")) $("resetBtn").addEventListener("click", onReset);
    w.addEventListener("pagehide", function (e) {
      try {
        persist();
        if (store === "lms") {
          w.SCORM.setSessionTime(sessionTime()); w.SCORM.setExitSuspend();
          if (e.persisted) w.SCORM.commit();                          /* kept in the back/forward cache: stay connected */
          else w.SCORM.finish("suspend");
        }
      } catch (err) { }
    });
    if (FREE || !state.started) show(-1);
    else show(firstOpen() >= NS ? NS : firstOpen());
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init); else init();
})(window, document);
