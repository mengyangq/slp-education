/* ============================================================
   Phonetics Labs, drawn assets
   Everything the labs display is inline SVG authored here: no
   image files, no icon font, no third-party media to license.
   All shapes live in a 48x48 box unless noted.
   ============================================================ */
(function (w) {
  "use strict";

  function svg(inner, opts) {
    opts = opts || {};
    var vb = opts.viewBox || "0 0 48 48";
    var cls = opts.cls ? ' class="' + opts.cls + '"' : "";
    var extra = opts.attrs || "";
    return '<svg viewBox="' + vb + '"' + cls + ' aria-hidden="true" focusable="false" ' +
      extra + ">" + inner + "</svg>";
  }

  /* ---------------------------------------------------------
     Zodiac guides, one per lab, in order.
     Lab 1 rat, 2 ox, 3 tiger, 4 rabbit, 5 dragon, 6 snake,
     7 horse, 8 goat, 9 monkey, 10 rooster, then the two
     extra-credit labs, 11 dog and 12 pig.
     --------------------------------------------------------- */
  var ZODIAC = [
    "rat", "ox", "tiger", "rabbit", "dragon", "snake",
    "horse", "goat", "monkey", "rooster", "dog", "pig"
  ];

  var ZODIAC_LABEL = {
    rat: "Rat", ox: "Ox", tiger: "Tiger", rabbit: "Rabbit", dragon: "Dragon",
    snake: "Snake", horse: "Horse", goat: "Goat", monkey: "Monkey",
    rooster: "Rooster", dog: "Dog", pig: "Pig"
  };

  /* Shared face parts so every animal reads as the same family. */
  function eyes(cx1, cx2, cy, r) {
    r = r || 2.1;
    return '<circle cx="' + cx1 + '" cy="' + cy + '" r="' + r + '" fill="#23262D"/>' +
      '<circle cx="' + (cx1 + 0.7) + '" cy="' + (cy - 0.8) + '" r="' + (r * 0.36) + '" fill="#fff"/>' +
      '<circle cx="' + cx2 + '" cy="' + cy + '" r="' + r + '" fill="#23262D"/>' +
      '<circle cx="' + (cx2 + 0.7) + '" cy="' + (cy - 0.8) + '" r="' + (r * 0.36) + '" fill="#fff"/>';
  }
  function smile(d) {
    return '<path d="' + d + '" fill="none" stroke="#23262D" stroke-width="1.4" ' +
      'stroke-linecap="round"/>';
  }

  var GUIDES = {
    rat: function (c) {
      return (
        // tail
        '<path d="M12 34 C4 34 4 24 9 22" fill="none" stroke="' + c.mid + '" stroke-width="2.6" stroke-linecap="round"/>' +
        // body
        '<ellipse cx="24" cy="31" rx="12" ry="9.5" fill="' + c.base + '"/>' +
        '<ellipse cx="26" cy="33.5" rx="8" ry="6" fill="' + c.light + '"/>' +
        // ears
        '<circle cx="19" cy="15.5" r="6" fill="' + c.base + '"/>' +
        '<circle cx="19" cy="15.5" r="3.4" fill="' + c.pink + '"/>' +
        '<circle cx="31" cy="15.5" r="6" fill="' + c.base + '"/>' +
        '<circle cx="31" cy="15.5" r="3.4" fill="' + c.pink + '"/>' +
        // head
        '<circle cx="25" cy="22" r="10" fill="' + c.base + '"/>' +
        '<ellipse cx="27.5" cy="25" rx="6" ry="4.6" fill="' + c.light + '"/>' +
        eyes(22, 29, 21) +
        '<ellipse cx="31.8" cy="25.4" rx="1.9" ry="1.5" fill="' + c.pink + '"/>' +
        // whiskers
        '<path d="M33 24.4 L38 23.2 M33 26.2 L38 26.8" stroke="' + c.mid + '" stroke-width="1" stroke-linecap="round"/>' +
        smile("M28 27.6 q2 1.6 3.6 .2")
      );
    },
    ox: function (c) {
      return (
        // horns, pale and curved so they read at rail size
        '<path d="M13 16 C4 14 3 5 12 7 C16 8 17.5 11 17.5 14 Z" fill="#F0E7D8"/>' +
        '<path d="M35 16 C44 14 45 5 36 7 C32 8 30.5 11 30.5 14 Z" fill="#F0E7D8"/>' +
        // ears, tucked under the horns
        '<ellipse cx="13.5" cy="18" rx="3.4" ry="2.4" fill="' + c.mid + '" transform="rotate(-24 13.5 18)"/>' +
        '<ellipse cx="34.5" cy="18" rx="3.4" ry="2.4" fill="' + c.mid + '" transform="rotate(24 34.5 18)"/>' +
        '<ellipse cx="24" cy="32" rx="12" ry="9" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="22" rx="11" ry="10" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="26.5" rx="6.4" ry="4.8" fill="' + c.pink + '"/>' +
        '<circle cx="21.6" cy="26.4" r="1.1" fill="' + c.mid + '"/>' +
        '<circle cx="26.4" cy="26.4" r="1.1" fill="' + c.mid + '"/>' +
        eyes(20, 28, 19.5)
      );
    },
    tiger: function (c) {
      return (
        '<ellipse cx="24" cy="32" rx="11.5" ry="9" fill="' + c.base + '"/>' +
        '<circle cx="16" cy="14" r="4.6" fill="' + c.base + '"/><circle cx="16" cy="14" r="2.4" fill="' + c.pink + '"/>' +
        '<circle cx="32" cy="14" r="4.6" fill="' + c.base + '"/><circle cx="32" cy="14" r="2.4" fill="' + c.pink + '"/>' +
        '<circle cx="24" cy="21" r="11" fill="' + c.base + '"/>' +
        '<path d="M17 14.5 l1.4 4 M24 12.4 l0 4.2 M31 14.5 l-1.4 4" stroke="' + c.mid + '" stroke-width="1.7" stroke-linecap="round"/>' +
        '<path d="M13.6 22 l3.4 .6 M13.6 25.4 l3.4 -.2 M34.4 22 l-3.4 .6 M34.4 25.4 l-3.4 -.2" stroke="' + c.mid + '" stroke-width="1.5" stroke-linecap="round"/>' +
        '<ellipse cx="24" cy="24.6" rx="5.4" ry="4" fill="' + c.light + '"/>' +
        eyes(20.5, 27.5, 20) +
        '<path d="M22.4 24 h3.2 l-1.6 1.8 z" fill="' + c.pink + '"/>' +
        smile("M24 25.8 v1.4 M21.4 27.6 q2.6 1.8 5.2 0")
      );
    },
    rabbit: function (c) {
      return (
        '<ellipse cx="18.5" cy="11" rx="3.6" ry="9" fill="' + c.base + '" transform="rotate(-8 18.5 11)"/>' +
        '<ellipse cx="18.5" cy="11.5" rx="1.8" ry="6.4" fill="' + c.pink + '" transform="rotate(-8 18.5 11.5)"/>' +
        '<ellipse cx="29.5" cy="11" rx="3.6" ry="9" fill="' + c.base + '" transform="rotate(8 29.5 11)"/>' +
        '<ellipse cx="29.5" cy="11.5" rx="1.8" ry="6.4" fill="' + c.pink + '" transform="rotate(8 29.5 11.5)"/>' +
        '<ellipse cx="24" cy="33" rx="11" ry="8.6" fill="' + c.base + '"/>' +
        '<circle cx="24" cy="24" r="10" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="27.4" rx="5.6" ry="4.2" fill="' + c.light + '"/>' +
        eyes(20.6, 27.4, 23) +
        '<path d="M22.6 26.6 h2.8 l-1.4 1.6 z" fill="' + c.pink + '"/>' +
        smile("M24 28.2 v1.2 M21.8 29.6 q2.2 1.6 4.4 0")
      );
    },
    dragon: function (c) {
      return (
        '<path d="M15 12 l2.6 -6 3 6 z" fill="' + c.light + '"/>' +
        '<path d="M33 12 l-2.6 -6 -3 6 z" fill="' + c.light + '"/>' +
        '<path d="M11 30 q-6 3 -3 8 q4 3 7 -1" fill="' + c.light + '"/>' +
        '<ellipse cx="25" cy="31" rx="12" ry="9" fill="' + c.base + '"/>' +
        '<path d="M14 24 q10 -5 20 0 q-2 -6 -10 -6 q-8 0 -10 6 z" fill="' + c.mid + '"/>' +
        '<ellipse cx="24" cy="22" rx="11" ry="9.6" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="26.6" rx="7" ry="4.6" fill="' + c.light + '"/>' +
        '<circle cx="21.4" cy="26.4" r="1.1" fill="' + c.mid + '"/>' +
        '<circle cx="26.6" cy="26.4" r="1.1" fill="' + c.mid + '"/>' +
        eyes(20, 28, 19.6)
      );
    },
    snake: function (c) {
      return (
        '<path d="M13 38 q14 3 16 -6 q2 -8 -6 -9 q-7 -1 -6 -7 q1 -5 8 -5" fill="none" stroke="' + c.base + '" stroke-width="7.5" stroke-linecap="round"/>' +
        '<path d="M13 38 q14 3 16 -6" fill="none" stroke="' + c.light + '" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
        '<circle cx="32" cy="11" r="6.6" fill="' + c.base + '"/>' +
        eyes(30, 34.6, 9.6, 1.8) +
        '<path d="M37 13 l5 1 M37 13 l4.4 3" stroke="' + c.pink + '" stroke-width="1.4" stroke-linecap="round"/>'
      );
    },
    horse: function (c) {
      return (
        '<path d="M16 14 q-4 8 -2 18 q-4 -2 -5 -9 q-1 -8 7 -9 z" fill="' + c.mid + '"/>' +
        '<path d="M17 12 l1 -6 3 5 z" fill="' + c.base + '"/>' +
        '<path d="M31 12 l-1 -6 -3 5 z" fill="' + c.base + '"/>' +
        '<path d="M18 14 q12 -3 15 6 q3 9 -2 14 q-6 5 -12 0 q-5 -6 -1 -20 z" fill="' + c.base + '"/>' +
        '<ellipse cx="27" cy="32" rx="6" ry="4.6" fill="' + c.light + '"/>' +
        '<circle cx="25" cy="32" r="1" fill="' + c.mid + '"/><circle cx="29.4" cy="32" r="1" fill="' + c.mid + '"/>' +
        eyes(21, 30, 21)
      );
    },
    goat: function (c) {
      return (
        '<path d="M16 15 q-6 -3 -7 -9 q6 1 8 7" fill="' + c.light + '"/>' +
        '<path d="M32 15 q6 -3 7 -9 q-6 1 -8 7" fill="' + c.light + '"/>' +
        '<ellipse cx="11" cy="21" rx="4.4" ry="2.6" fill="' + c.mid + '" transform="rotate(-18 11 21)"/>' +
        '<ellipse cx="37" cy="21" rx="4.4" ry="2.6" fill="' + c.mid + '" transform="rotate(18 37 21)"/>' +
        '<ellipse cx="24" cy="24" rx="10" ry="10.4" fill="' + c.base + '"/>' +
        '<path d="M21 33.5 q3 6 6 0 q-3 2 -6 0 z" fill="' + c.light + '"/>' +
        '<ellipse cx="24" cy="28.4" rx="5" ry="3.6" fill="' + c.light + '"/>' +
        eyes(20.6, 27.4, 22.6) +
        '<circle cx="22.6" cy="28" r=".9" fill="' + c.mid + '"/><circle cx="25.4" cy="28" r=".9" fill="' + c.mid + '"/>'
      );
    },
    monkey: function (c) {
      return (
        '<circle cx="12" cy="23" r="5.4" fill="' + c.base + '"/><circle cx="12" cy="23" r="3" fill="' + c.pink + '"/>' +
        '<circle cx="36" cy="23" r="5.4" fill="' + c.base + '"/><circle cx="36" cy="23" r="3" fill="' + c.pink + '"/>' +
        '<ellipse cx="24" cy="33" rx="10.6" ry="8.4" fill="' + c.base + '"/>' +
        '<circle cx="24" cy="22" r="10.6" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="25" rx="7.4" ry="6.6" fill="' + c.light + '"/>' +
        eyes(20.6, 27.4, 21.4) +
        '<circle cx="22.6" cy="26" r=".9" fill="' + c.mid + '"/><circle cx="25.4" cy="26" r=".9" fill="' + c.mid + '"/>' +
        smile("M21 28.4 q3 2.6 6 0")
      );
    },
    rooster: function (c) {
      return (
        '<path d="M18 12 q1 -5 4 -3 q1 -4 4 -1 q2 -3 4 1 q-4 3 -12 3 z" fill="' + c.pink + '"/>' +
        '<path d="M12 36 q-5 -4 -3 -10 q3 -6 8 -4" fill="' + c.light + '"/>' +
        '<ellipse cx="25" cy="30" rx="11" ry="10" fill="' + c.base + '"/>' +
        '<circle cx="24" cy="19" r="8.4" fill="' + c.base + '"/>' +
        '<path d="M32 19 l7 2.6 -7 2.6 z" fill="' + c.pink + '"/>' +
        '<path d="M28 24.6 q1.6 4 -1 4.6 q-1.6 -1.6 -.6 -4.6 z" fill="' + c.pink + '"/>' +
        eyes(23, 29, 17.6, 1.8)
      );
    },
    dog: function (c) {
      return (
        '<ellipse cx="13.5" cy="24" rx="4.4" ry="8.6" fill="' + c.mid + '" transform="rotate(12 13.5 24)"/>' +
        '<ellipse cx="34.5" cy="24" rx="4.4" ry="8.6" fill="' + c.mid + '" transform="rotate(-12 34.5 24)"/>' +
        '<ellipse cx="24" cy="33" rx="10.6" ry="8" fill="' + c.base + '"/>' +
        '<circle cx="24" cy="22" r="10.4" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="26.6" rx="6.4" ry="4.8" fill="' + c.light + '"/>' +
        eyes(20.4, 27.6, 21) +
        '<ellipse cx="24" cy="26" rx="2.2" ry="1.7" fill="#23262D"/>' +
        smile("M24 27.8 v1.2 M21.4 29 q2.6 2 5.2 0")
      );
    },
    pig: function (c) {
      return (
        '<path d="M15 15 l-2 -6 6 3 z" fill="' + c.base + '"/>' +
        '<path d="M33 15 l2 -6 -6 3 z" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="33" rx="11" ry="8.4" fill="' + c.base + '"/>' +
        '<circle cx="24" cy="23" r="10.6" fill="' + c.base + '"/>' +
        '<ellipse cx="24" cy="27" rx="6" ry="4.4" fill="' + c.pink + '"/>' +
        '<ellipse cx="21.8" cy="27" rx="1.2" ry="1.7" fill="' + c.mid + '"/>' +
        '<ellipse cx="26.2" cy="27" rx="1.2" ry="1.7" fill="' + c.mid + '"/>' +
        eyes(20.4, 27.6, 21.4)
      );
    }
  };

  /* Each animal gets its own warm coat so the twelve are told apart at a glance. */
  var COAT = {
    rat:     { base: "#A9B3C4", light: "#D6DDE7", mid: "#7C8798", pink: "#F0AFB8" },
    ox:      { base: "#8E7259", light: "#C6AE94", mid: "#6A523D", pink: "#E4A8A0" },
    tiger:   { base: "#E8A33D", light: "#FBE3BC", mid: "#8F5A12", pink: "#F0AFB8" },
    rabbit:  { base: "#E4DAD0", light: "#FFFFFF", mid: "#B6A897", pink: "#F0AFB8" },
    dragon:  { base: "#4FA98A", light: "#B8E3D2", mid: "#2F7860", pink: "#F0AFB8" },
    snake:   { base: "#7FA84F", light: "#CBE3AC", mid: "#55762F", pink: "#E06A7A" },
    horse:   { base: "#B07A4A", light: "#E3C4A2", mid: "#7A5128", pink: "#F0AFB8" },
    goat:    { base: "#DCD3C6", light: "#FFFFFF", mid: "#A79B89", pink: "#F0AFB8" },
    monkey:  { base: "#A87545", light: "#EBC9A3", mid: "#7A5128", pink: "#F0AFB8" },
    rooster: { base: "#D8B44E", light: "#F3DFA5", mid: "#9A7A1C", pink: "#E0564C" },
    dog:     { base: "#C79A62", light: "#EFDCC0", mid: "#98703C", pink: "#F0AFB8" },
    pig:     { base: "#EFA9B4", light: "#FBD7DC", mid: "#C4707E", pink: "#F6C3CA" }
  };

  function zodiac(name, opts) {
    opts = opts || {};
    var fn = GUIDES[name] || GUIDES.rat;
    var coat = COAT[name] || COAT.rat;
    return svg(fn(coat), { cls: opts.cls, attrs: opts.attrs });
  }

  /* Raw inner markup, for embedding inside a larger SVG such as the path rail. */
  function zodiacInner(name) {
    var fn = GUIDES[name] || GUIDES.rat;
    return fn(COAT[name] || COAT.rat);
  }

  /* ---------------------------------------------------------
     Gem
     Each lab may re-cut the stone: window.LAB_GEM picks the
     shape and colour set, and everything that draws a gem, the
     tally, the rail nodes, the checkpoint rows, follows. Lab 1
     is the cyan diamond (the default); Lab 2 sets "amber", Lab 3
     "ruby", Lab 4 "carrot", Lab 5 "pearl", Lab 6 "apple", Lab 7
     "pumpkin", Lab 8 "candycorn", Lab 9 "peach", Lab 10 "goldegg".
     --------------------------------------------------------- */
  var GEMS = {
    diamond: { lite: "#7BE0F0", base: "#1FB6D4", deep: "#0E7E96", pale: "#A6ECF7", flat: "#BFF1FA" },
    amber:   { lite: "#FFD170", base: "#F0A92E", deep: "#A8720C", pale: "#FFE3A3", flat: "#FFE9BC" },
    ruby:    { lite: "#FF8FA3", base: "#E23D5B", deep: "#8E1230", pale: "#FFC2CD", flat: "#FFD5DC" },
    carrot:  { lite: "#FFB066", base: "#F2752B", deep: "#A8450C", pale: "#FFD2A8", flat: "#FFE0C2" },
    pearl:   { lite: "#FFFFFF", base: "#D9C7EA", deep: "#7A5E9E", pale: "#F5EFFB", flat: "#EDE3F7" },
    apple:   { lite: "#FF8A73", base: "#E0392B", deep: "#961C12", pale: "#FFC2B5", flat: "#FFD9D0" },
    pumpkin: { lite: "#FFBE5C", base: "#F28A1C", deep: "#A84E06", pale: "#FFDDA6", flat: "#FFE6BF" },
    candycorn: { lite: "#FFA24A", base: "#F2731B", deep: "#B04A08", pale: "#FFF8EC", flat: "#FFE9D2" },
    peach:   { lite: "#FFD3A6", base: "#F7946B", deep: "#D2475A", pale: "#FFE6CF", flat: "#FFE9D9" },
    goldegg: { lite: "#FFE48A", base: "#EDB422", deep: "#A87108", pale: "#FFF4C9", flat: "#FFF0B8" }
  };
  function gemTheme() {
    return GEMS[w.LAB_GEM] || GEMS.diamond;
  }
  /* The cut, as path segments in the shared 36x28 box. The diamond is the
     Lab 1 brilliant; the amber is a honey-gold hexagonal cut; the ruby (Lab 3)
     is a rose-red teardrop, point up. */
  function gemCut() {
    var c = gemTheme();
    if (w.LAB_GEM === "goldegg") {
      /* Lab 10: a golden egg, for the chicken's lab. Narrower at the top, a
         shadow down its right side, a bright highlight and a small sparkle. */
      var egg = "M18 2.2 C23.6 2.2 27.6 10.4 27.6 17 C27.6 23 23.4 27.4 18 27.4 C12.6 27.4 8.4 23 8.4 17 " +
        "C8.4 10.4 12.4 2.2 18 2.2 Z";
      var side = "M18 2.2 C23.6 2.2 27.6 10.4 27.6 17 C27.6 23 23.4 27.4 18 27.4 C22.4 25 24.6 20 24.4 15 " +
        "C24.2 9.4 21.6 4.4 18 2.2 Z";
      return {
        outline: egg,
        round: true,
        facets:
          '<path d="' + side + '" fill="' + c.deep + '" opacity=".3"/>' +
          '<ellipse cx="13.6" cy="10.8" rx="2.2" ry="4.2" transform="rotate(20 13.6 10.8)" fill="#FFFFFF" opacity=".85"/>' +
          '<circle cx="12.4" cy="17.6" r="1" fill="#FFFFFF" opacity=".5"/>' +
          '<path d="M29.6 3.2 l.7 1.8 1.8 .7 -1.8 .7 -.7 1.8 -.7 -1.8 -1.8 -.7 1.8 -.7 z" fill="#FFF6C8"/>',
        flat:
          '<path d="' + egg + '" fill="' + c.lite + '"/>' +
          '<path d="' + side + '" fill="' + c.base + '"/>'
      };
    }
    if (w.LAB_GEM === "peach") {
      /* Lab 9: a peach, the Monkey King's fruit. Round with a dip at the top, a
         crease down one side, a rosy blush over the other, and a stem with one
         leaf; like the apple's stalk, the stem and leaf are the cut's crown, drawn
         on every version. */
      var body = "M18 8.2 C15.8 6.2 9.6 5.6 7 10.4 C5 14.4 6 20.6 10.4 24.4 C12.6 26.3 15.4 27.4 18 27.6 " +
        "C20.6 27.4 23.4 26.3 25.6 24.4 C30 20.6 31 14.4 29 10.4 C26.4 5.6 20.2 6.2 18 8.2 Z";
      var blush = "M18 8.2 C20.2 6.2 26.4 5.6 29 10.4 C31 14.4 30 20.6 25.6 24.4 C23.4 26.3 20.6 27.4 18 27.6 " +
        "C22.6 23.2 23.4 13.6 18 8.2 Z";
      var leaf =
        '<path d="M18 8.8 C17.8 6.8 18.2 5 19.2 3.6" fill="none" stroke="#7A4A22" stroke-width="1.5" stroke-linecap="round"/>' +
        '<path d="M18.8 5.4 C20.4 2.2 25.2 1.2 28.2 2.6 C26.4 6 22 7.4 18.8 5.4 Z" fill="#4FA060"/>' +
        '<path d="M19.8 5 C22.2 4 24.6 3.2 27 2.8" fill="none" stroke="#2F7A45" stroke-width=".8" stroke-linecap="round" opacity=".7"/>';
      return {
        outline: body,
        crown: leaf,
        round: true,
        facets:
          '<path d="' + blush + '" fill="' + c.deep + '" opacity=".32"/>' +
          '<ellipse cx="24" cy="13.4" rx="4.6" ry="3.8" fill="#E8505B" opacity=".28"/>' +
          '<path d="M18 8.6 C15.4 12.4 15.2 19.2 17.4 26.6" fill="none" stroke="' + c.deep + '" stroke-width="1" ' +
          'stroke-linecap="round" opacity=".5"/>' +
          '<ellipse cx="11.8" cy="13.2" rx="2.2" ry="3.8" transform="rotate(22 11.8 13.2)" fill="#FFFFFF" opacity=".7"/>' +
          leaf,
        flat:
          '<path d="' + body + '" fill="' + c.lite + '"/>' +
          '<path d="' + blush + '" fill="' + c.base + '"/>' + leaf
      };
    }
    if (w.LAB_GEM === "candycorn") {
      /* Lab 8: a candy corn, for Halloween. A rounded triangle, point up, in its
         three bands: a white tip, the orange middle (the stone's own colour, so
         the half gem and the flat node read as orange) and a yellow base. The
         bands are drawn on the whole gem and the flat node; the half gem keeps
         them inside its filled half (inHalf). */
      var kernel = "M18 1.8 C19.7 1.8 21 3.1 22 5.3 L29.7 22.2 C30.8 24.6 29.5 26.7 26.6 26.9 " +
        "C21 27.4 15 27.4 9.4 26.9 C6.5 26.7 5.2 24.6 6.3 22.2 L14 5.3 C15 3.1 16.3 1.8 18 1.8 Z";
      var tip = "M18 1.8 C19.7 1.8 21 3.1 22 5.3 L24.4 10.6 C20.2 11.6 15.8 11.6 11.6 10.6 L14 5.3 " +
        "C15 3.1 16.3 1.8 18 1.8 Z";
      var base = "M7.8 19.2 C14.4 20.5 21.6 20.5 28.2 19.2 L29.7 22.2 C30.8 24.6 29.5 26.7 26.6 26.9 " +
        "C21 27.4 15 27.4 9.4 26.9 C6.5 26.7 5.2 24.6 6.3 22.2 Z";
      var bands = '<path d="' + tip + '" fill="#FFFBF2"/><path d="' + base + '" fill="#FFD23F"/>';
      return {
        outline: kernel,
        round: true,
        inHalf: bands,
        facets:
          bands +
          '<path d="M22 5.3 L29.7 22.2 C30.8 24.6 29.5 26.7 26.6 26.9 C24.8 27.1 23 27.2 21.2 27.2 ' +
          'C24.4 21 24.6 12 22 5.3 Z" fill="' + c.deep + '" opacity=".22"/>' +
          '<path d="M13.2 8.6 C11.6 12.4 10.2 16.4 9.4 20.2" fill="none" stroke="#FFFFFF" stroke-width="1.5" ' +
          'stroke-linecap="round" opacity=".7"/>',
        flat:
          '<path d="' + kernel + '" fill="' + c.base + '"/>' + bands
      };
    }
    if (w.LAB_GEM === "pumpkin") {
      /* Lab 7: a pumpkin, for Halloween. Five lobes split by four grooves, a
         stubby stem with a leaf and a curl of vine; like the apple's stalk, the
         stem is the cut's crown, drawn on every version. The jack-o'-lantern
         face is saved for the celebration. */
      var gourd = "M18 8.4 C20.6 6.6 24.8 6.4 27.4 7.6 C31.4 9.2 33 13.2 32.8 17.2 " +
        "C32.6 22.4 29.6 26.2 25.2 26.4 C22.8 26.9 20.2 26.9 18 26.4 C15.8 26.9 13.2 26.9 10.8 26.4 " +
        "C6.4 26.2 3.4 22.4 3.2 17.2 C3 13.2 4.6 9.2 8.6 7.6 C11.2 6.4 15.4 6.6 18 8.4 Z";
      var rightSide = "M18 8.4 C20.6 6.6 24.8 6.4 27.4 7.6 C31.4 9.2 33 13.2 32.8 17.2 " +
        "C32.6 22.4 29.6 26.2 25.2 26.4 C22.8 26.9 20.2 26.9 18 26.4 C20.2 22 20.4 12.4 18 8.4 Z";
      var stem =
        '<path d="M16.4 3.9 C14.4 2.2 11.6 2.4 10.4 4.4 C12.6 5.8 15 5.6 16.4 3.9 Z" fill="#3E9A68"/>' +
        '<path d="M19.4 3.6 C21.4 1.6 24.8 1.8 25.4 4 C25.8 5.6 24 6.2 23.2 5" fill="none" stroke="#3E9A68" stroke-width="1.1" stroke-linecap="round"/>' +
        '<path d="M16.5 8.8 C16.3 6.4 16.5 4 17.3 2.2 C18.1 1.7 19.4 1.9 19.9 2.5 C19.1 4.4 19.1 6.6 19.6 8.8 Z" fill="#6A5A24"/>';
      var grooves =
        '<path d="M11.8 7.2 C8.4 11 8.4 22.2 11.4 26.5 M24.2 7.2 C27.6 11 27.6 22.2 24.6 26.5 ' +
        'M15.4 7.6 C13.2 12 13.2 21.8 15.2 26.8 M20.6 7.6 C22.8 12 22.8 21.8 20.8 26.8" ' +
        'fill="none" stroke="' + c.deep + '" stroke-width="1" stroke-linecap="round" opacity=".45"/>';
      return {
        outline: gourd,
        crown: stem,
        round: true,
        facets:
          '<path d="M24.2 7.2 C27.6 11 27.6 22.2 24.6 26.5 C29.6 26.2 32.6 22.4 32.8 17.2 C33 13.2 31.4 9.2 27.4 7.6 ' +
          'C26.4 7.2 25.3 7.1 24.2 7.2 Z" fill="' + c.deep + '" opacity=".28"/>' +
          grooves +
          '<ellipse cx="8" cy="14.4" rx="1.6" ry="4" transform="rotate(12 8 14.4)" fill="#FFFFFF" opacity=".55"/>' +
          '<ellipse cx="17.6" cy="13" rx="1" ry="2.6" fill="#FFFFFF" opacity=".35"/>' + stem,
        flat:
          '<path d="' + gourd + '" fill="' + c.lite + '"/>' +
          '<path d="' + rightSide + '" fill="' + c.base + '"/>' + stem
      };
    }
    if (w.LAB_GEM === "apple") {
      /* Lab 6: the snake's apple, the food in the game Snake. Round with a
         dimple at the top, a brown stem and one leaf; like the carrot's sprig,
         the stem and leaf are the cut's crown, drawn on every version. */
      var fruit = "M18 8.8 C15.4 6.6 9 6.2 7 11.8 C5.2 17 8.4 26.6 13.4 26.8 C15.4 26.9 16.4 26 18 26 " +
        "C19.6 26 20.6 26.9 22.6 26.8 C27.6 26.6 30.8 17 29 11.8 C27 6.2 20.6 6.6 18 8.8 Z";
      var stalk =
        '<path d="M18 9.2 C17.8 6.8 18.4 4.6 19.8 2.8" fill="none" stroke="#7A4A22" stroke-width="1.7" stroke-linecap="round"/>' +
        '<path d="M19.2 5 C20.6 2 24.6 1.2 27.2 2.4 C25.6 5.6 22 6.6 19.2 5 Z" fill="#3E9A68"/>';
      return {
        outline: fruit,
        crown: stalk,
        round: true,
        facets:
          '<path d="M18 26 C19.6 26 20.6 26.9 22.6 26.8 C27.6 26.6 30.8 17 29 11.8 C28 9 26 7.6 23.8 7.4 ' +
          'C27 10.6 27.4 18.6 22.6 24.4 C21 26 19.4 26 18 26 Z" fill="' + c.deep + '" opacity=".3"/>' +
          '<ellipse cx="12" cy="13" rx="2.6" ry="4.2" transform="rotate(18 12 13)" fill="#FFFFFF" opacity=".75"/>' +
          '<circle cx="14.4" cy="19.6" r="1" fill="#FFFFFF" opacity=".4"/>' + stalk,
        flat:
          '<path d="' + fruit + '" fill="' + c.lite + '"/>' +
          '<path d="M18 26 C19.6 26 20.6 26.9 22.6 26.8 C27.6 26.6 30.8 17 29 11.8 C28 9 26 7.6 23.8 7.4 ' +
          'C27 10.6 27.4 18.6 22.6 24.4 C21 26 19.4 26 18 26 Z" fill="' + c.base + '"/>' + stalk
      };
    }
    if (w.LAB_GEM === "pearl") {
      /* Lab 5: the dragon's pearl. Round, so it has no facets: its depth is a
         soft shadow crescent, a lavender-and-rose sheen along the rim and a
         bright highlight. */
      var orb = "M18 2.5 A11.5 11.5 0 1 1 17.98 2.5 Z";
      return {
        outline: orb,
        facets:
          '<path d="M27.6 7.6 A11.5 11.5 0 0 1 8.2 20.4 A13 13 0 0 0 27.6 7.6 Z" fill="' + c.deep + '" opacity=".3"/>' +
          '<path d="M9.2 21.2 A11.5 11.5 0 0 0 26.8 21.2" fill="none" stroke="#F4B8D4" stroke-width="1.4" opacity=".7"/>' +
          '<path d="M28.6 10.6 A11.5 11.5 0 0 1 28.4 18.6" fill="none" stroke="#A8E4E4" stroke-width="1.3" opacity=".75"/>' +
          '<path d="' + orb + '" fill="none" stroke="#B9A2D6" stroke-width=".9"/>' +
          '<ellipse cx="13.6" cy="9.4" rx="4.2" ry="2.7" transform="rotate(-32 13.6 9.4)" fill="#FFFFFF" opacity=".95"/>' +
          '<circle cx="22.4" cy="19.2" r="1.3" fill="#FFFFFF" opacity=".55"/>',
        round: true,
        flat:
          '<path d="' + orb + '" fill="' + c.flat + '"/>' +
          '<path d="M27.6 7.6 A11.5 11.5 0 0 1 8.2 20.4 A13 13 0 0 0 27.6 7.6 Z" fill="' + c.base + '"/>' +
          '<ellipse cx="13.6" cy="9.4" rx="4.2" ry="2.7" transform="rotate(-32 13.6 9.4)" fill="#FFFFFF"/>'
      };
    }
    if (w.LAB_GEM === "carrot") {
      /* Lab 4: a faceted carrot, point down, with a sprig of leaves. The
         leaves are the cut's "crown": drawn on top of every version of the
         stone, including the half gem, because without them it is a cone. */
      var root = "M10.5 10 C10.5 6.6 25.5 6.6 25.5 10 C25.5 15.5 21.5 22 18 27 C14.5 22 10.5 15.5 10.5 10 Z";
      var crown =
        '<path d="M18 8.4 C16.4 5.6 14.6 3.4 12 2.2 C12.4 5.4 14.6 7.6 18 8.4 Z ' +
        'M18 8.4 C17 5.4 17.2 2.8 18 0.8 C18.8 2.8 19 5.4 18 8.4 Z ' +
        'M18 8.4 C19.6 5.6 21.4 3.4 24 2.2 C23.6 5.4 21.4 7.6 18 8.4 Z" fill="#3E9A68"/>';
      return {
        outline: root,
        crown: crown,
        facets:
          '<path d="M10.5 10 C10.5 7.6 14 7.2 18 7.4 L18 27 C14.5 22 10.5 15.5 10.5 10 Z" fill="' + c.pale + '" opacity=".7"/>' +
          '<path d="M18 7.4 C22 7.2 25.5 7.6 25.5 10 C25.5 15.5 21.5 22 18 27 Z" fill="' + c.deep + '" opacity=".26"/>' +
          '<path d="M13 12.2 H17 M19.5 15.4 H23 M14.6 18 H17.4" fill="none" stroke="' + c.deep + '" stroke-width="1.1" stroke-linecap="round" opacity=".5"/>' +
          crown,
        flat:
          '<path d="' + root + '" fill="' + c.lite + '"/>' +
          '<path d="M18 7.4 C22 7.2 25.5 7.6 25.5 10 C25.5 15.5 21.5 22 18 27 Z" fill="' + c.base + '"/>' +
          crown
      };
    }
    if (w.LAB_GEM === "ruby") {
      var tear = "M18 1.5 C23 8 30 12.5 30 18.5 C30 24 24.6 27 18 27 C11.4 27 6 24 6 18.5 C6 12.5 13 8 18 1.5 Z";
      return {
        outline: tear,
        facets:
          '<path d="M18 1.5 C13 8 6 12.5 6 18.5 C6 21 7 23 9 24.5 L18 10 Z" fill="' + c.pale + '" opacity=".85"/>' +
          '<path d="M18 10 L27 24.5 C29 23 30 21 30 18.5 C30 12.5 23 8 18 1.5 Z" fill="' + c.deep + '" opacity=".28"/>' +
          '<path d="M13.5 14 L22.5 14 L24 19.5 L18 23.5 L12 19.5 Z" fill="' + c.lite + '" opacity=".6"/>' +
          '<path d="M11 9 C13 7 15 5.5 16.5 4.5" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>',
        flat:
          '<path d="' + tear + '" fill="' + c.lite + '"/>' +
          '<path d="M18 10 L27 24.5 C29 23 30 21 30 18.5 C30 12.5 23 8 18 1.5 Z" fill="' + c.base + '"/>' +
          '<path d="M18 1.5 C13 8 6 12.5 6 18.5 L18 10 Z" fill="' + c.flat + '"/>'
      };
    }
    if (w.LAB_GEM === "amber") {
      return {
        outline: "M18 1.5 L29 7.5 L29 20.5 L18 26.5 L7 20.5 L7 7.5 Z",
        facets:
          '<path d="M18 1.5 L29 7.5 L18 10 L7 7.5 Z" fill="' + c.pale + '" opacity=".9"/>' +
          '<path d="M29 7.5 L29 20.5 L18 26.5 L18 10 Z" fill="' + c.deep + '" opacity=".30"/>' +
          '<path d="M7 7.5 L18 10 L18 26.5 L7 20.5 Z" fill="' + c.lite + '" opacity=".55"/>' +
          '<path d="M13 11.4 L23 11.4 L23 18.6 L18 21.4 L13 18.6 Z" fill="' + c.pale + '" opacity=".5"/>',
        flat:
          '<path d="M18 1.5 L29 7.5 L29 20.5 L18 26.5 L7 20.5 L7 7.5 Z" fill="' + c.lite + '"/>' +
          '<path d="M29 7.5 L29 20.5 L18 26.5 L18 10 Z" fill="' + c.base + '"/>' +
          '<path d="M18 1.5 L29 7.5 L18 10 L7 7.5 Z" fill="' + c.flat + '"/>'
      };
    }
    return {
      outline: "M12 3 h12 l6 8 -12 14 -12 -14 z",
      facets:
        '<path d="M12 3 l6 8 -12 0 z" fill="' + c.pale + '" opacity=".85"/>' +
        '<path d="M24 3 l-6 8 12 0 z" fill="' + c.deep + '" opacity=".35"/>' +
        '<path d="M18 11 h0 l0 14 -12 -14 z" fill="#5FD3E8" opacity=".55"/>' +
        '<path d="M18 11 l12 0 -12 14 z" fill="' + c.deep + '" opacity=".22"/>',
      flat:
        '<path d="M12 3 h12 l6 8 -12 14 -12 -14 z" fill="' + c.lite + '"/>' +
        '<path d="M18 11 l12 0 -12 14 z" fill="' + c.base + '"/>' +
        '<path d="M12 3 l6 8 -12 0 z" fill="' + c.flat + '"/>'
    };
  }

  /* A half gem, for a near miss. The right half is drawn as an outline only,
     so the shape still reads as a gem at 20px while clearly being half won. */
  function gemHalf(opts) {
    opts = opts || {};
    var c = gemTheme(), cut = gemCut();
    var id = "gh" + Math.round(Math.random() * 1e6);
    var inner =
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + c.lite + '"/><stop offset="1" stop-color="' + c.base + '"/>' +
      '</linearGradient>' +
      '<clipPath id="' + id + 'c"><rect x="0" y="0" width="18" height="28"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + 'c)">' +
      '<path d="' + cut.outline + '" fill="url(#' + id + ')"/>' + (cut.inHalf || "") +
      "</g>" +
      '<path d="' + cut.outline + '" fill="none" stroke="' + c.base + '" ' +
      'stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M18 2.5 v23" stroke="' + c.deep + '" stroke-width="1.1" opacity=".5"/>' +
      (cut.crown || "");
    return svg(inner, { viewBox: "0 0 36 28", cls: opts.cls, attrs: opts.attrs });
  }

  function gem(opts) {
    opts = opts || {};
    var c = gemTheme(), cut = gemCut();
    var id = "g" + Math.round(Math.random() * 1e6);
    var inner =
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + c.lite + '"/><stop offset="1" stop-color="' + c.base + '"/>' +
      '</linearGradient></defs>' +
      '<path d="' + cut.outline + '" fill="url(#' + id + ')"/>' +
      cut.facets;
    return svg(inner, { viewBox: "0 0 36 28", cls: opts.cls, attrs: opts.attrs });
  }

  /* Compact gems for the rail nodes, drawn flat so they stay crisp at 10px. */
  function gemFlatHalf(cx, cy, s) {
    s = s || 1;
    var c = gemTheme(), cut = gemCut();
    var id = "nh" + Math.round(Math.random() * 1e6);
    return '<g transform="translate(' + cx + ',' + cy + ') scale(' + (s * 0.26) + ') translate(-18,-14)">' +
      '<clipPath id="' + id + '"><rect x="0" y="0" width="18" height="28"/></clipPath>' +
      '<g clip-path="url(#' + id + ')">' +
      '<path d="' + cut.outline + '" fill="' + c.lite + '"/>' + (cut.inHalf || "") +
      (cut.crown || cut.round ? "" : '<path d="M12 3 l6 8 -12 0 z" fill="' + c.flat + '"/>') + "</g>" +
      '<path d="' + cut.outline + '" fill="none" stroke="' + c.lite + '" stroke-width="2"/>' +
      (cut.crown || "") + "</g>";
  }

  function gemFlat(cx, cy, s) {
    s = s || 1;
    var cut = gemCut();
    return '<g transform="translate(' + cx + ',' + cy + ') scale(' + (s * 0.26) + ') translate(-18,-14)">' +
      cut.flat + "</g>";
  }

  /* ---------------------------------------------------------
     Treasure chest, for checkpoints and the finish screen
     --------------------------------------------------------- */
  function chest(open, opts) {
    opts = opts || {};
    var glow = open
      ? '<g opacity=".9">' +
      '<path d="M24 20 l2.4 6.4 6.4 2.4 -6.4 2.4 -2.4 6.4 -2.4 -6.4 -6.4 -2.4 6.4 -2.4 z" fill="#FFE9A8"/>' +
      '<circle cx="15" cy="21" r="2.2" fill="#FFF3C9"/><circle cx="34" cy="24" r="1.7" fill="#FFF3C9"/>' +
      '</g>'
      : "";
    var lid = open
      ? '<path d="M9 26 q0 -13 15 -13 q15 0 15 13 l0 2 -30 0 z" fill="#A8763C" transform="rotate(-24 9 28)"/>'
      : '<path d="M9 28 q0 -13 15 -13 q15 0 15 13 l0 2 -30 0 z" fill="#A8763C"/>' +
      '<rect x="8" y="26" width="32" height="4" rx="1.6" fill="#7A5227"/>';
    return svg(
      '<ellipse cx="24" cy="43" rx="17" ry="3" fill="rgba(0,0,0,.09)"/>' +
      glow +
      '<rect x="8" y="28" width="32" height="14" rx="3" fill="#8A5D2E"/>' +
      '<rect x="8" y="30.5" width="32" height="3" fill="#6B4520"/>' +
      lid +
      '<rect x="21" y="27" width="6" height="8" rx="1.6" fill="#F3C64B"/>' +
      '<circle cx="24" cy="31" r="1.5" fill="#7A5227"/>',
      { viewBox: "0 0 48 48", cls: opts.cls, attrs: opts.attrs });
  }

  /* ---------------------------------------------------------
     Speaker glyph for every audio control
     --------------------------------------------------------- */
  function speaker() {
    return svg(
      '<path d="M4 9 h4 l6 -5 v16 l-6 -5 H4 z" fill="currentColor"/>' +
      '<path d="M17 8.5 a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M20 5.5 a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".65"/>',
      { viewBox: "0 0 24 24" });
  }

  /* ---------------------------------------------------------
     Objects for the Morpheme Builder worked example.
     A cat, a hat and a cup, so plural can be demonstrated on
     more than one noun. Drawing them rather than photographing
     them keeps the package free of third-party media.
     --------------------------------------------------------- */
  var OBJECTS = {
    cat: '<ellipse cx="24" cy="43" rx="12" ry="2.6" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M34 42 q7 -3 5 -9" fill="none" stroke="#8E8377" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse cx="24" cy="34" rx="10.5" ry="9" fill="#A79A8B"/>' +
      '<path d="M15 17 l1 -8 7 5 z" fill="#A79A8B"/><path d="M33 17 l-1 -8 -7 5 z" fill="#A79A8B"/>' +
      '<path d="M16.6 15.6 l.6 -4 3.6 2.6 z" fill="#F0AFB8"/><path d="M31.4 15.6 l-.6 -4 -3.6 2.6 z" fill="#F0AFB8"/>' +
      '<circle cx="24" cy="21" r="10" fill="#BCAF9F"/>' +
      '<ellipse cx="24" cy="24.5" rx="5.6" ry="4" fill="#E2D8CB"/>' +
      '<ellipse cx="20.4" cy="20" rx="1.7" ry="2.3" fill="#23262D"/>' +
      '<ellipse cx="27.6" cy="20" rx="1.7" ry="2.3" fill="#23262D"/>' +
      '<circle cx="21" cy="19.2" r=".6" fill="#fff"/><circle cx="28.2" cy="19.2" r=".6" fill="#fff"/>' +
      '<path d="M22.6 23.4 h2.8 l-1.4 1.6 z" fill="#F0AFB8"/>' +
      '<path d="M24 25 v1.2 M21.6 26.4 q2.4 1.8 4.8 0" fill="none" stroke="#23262D" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M13.6 23 l-4.6 -1.4 M13.6 25.4 l-4.6 .8 M34.4 23 l4.6 -1.4 M34.4 25.4 l4.6 .8" stroke="#8E8377" stroke-width="1" stroke-linecap="round"/>',
    hat: '<ellipse cx="24" cy="41" rx="16" ry="3" fill="rgba(0,0,0,.08)"/>' +
      '<ellipse cx="24" cy="34" rx="18" ry="5.4" fill="#5B62D6"/>' +
      '<path d="M13 34 q0 -20 11 -20 q11 0 11 20 z" fill="#6E75E4"/>' +
      '<ellipse cx="24" cy="14.5" rx="11" ry="3.4" fill="#8087F0"/>' +
      '<rect x="12.6" y="28" width="22.8" height="5" rx="1" fill="#3A40A8"/>',
    cup: '<ellipse cx="22" cy="42" rx="13" ry="2.6" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M33 18 q8 0 8 7 q0 7 -8 7" fill="none" stroke="#D4529A" stroke-width="4"/>' +
      '<path d="M10 14 h24 v18 q0 8 -12 8 q-12 0 -12 -8 z" fill="#E36FAA"/>' +
      '<ellipse cx="22" cy="14" rx="12" ry="3.6" fill="#F2A7CC"/>' +
      '<ellipse cx="22" cy="14.5" rx="9" ry="2.4" fill="#B9427F"/>'
  };

  function object(kind, opts) {
    opts = opts || {};
    return svg(OBJECTS[kind] || OBJECTS.cat, { cls: opts.cls, attrs: opts.attrs });
  }

  function objectRow(kind, n) {
    var out = "";
    for (var i = 0; i < n; i++) out += object(kind);
    return out;
  }


  /* ---------------------------------------------------------
     The speech machine (Lab 2)
     A midsagittal view of the vocal tract and chest, drawn as
     ten separately addressable regions so labels can be placed
     on it, plus a small spot illustration for each of the three
     speech-production systems.
     --------------------------------------------------------- */
  /* The figure ships as a raster illustration (img/sagittal.jpg) with an
     SVG overlay of invisible hotspot polygons, one per region, traced in the
     image's own pixel space. Swapping in a better illustration is: replace
     the image, retrace these polygons and anchors. */
  var SAG_W = 800, SAG_H = 1200, SAG_IMG = "img/sagittal.jpg";

  /* Anchor points for label pins, one per region, in figure coordinates. */
  var SAG_ANCHOR = {
    nasal_cavity: [250, 230], hard_palate: [260, 292], oral_cavity: [265, 324],
    tongue: [285, 385], lips: [180, 340], pharynx: [383, 350],
    larynx: [360, 520], vocal_folds: [378, 566], trachea: [382, 680],
    lungs: [560, 850]
  };

  /* Hotspots in draw order: later entries sit on top where they overlap, so
     the vocal folds win over the larynx, the trachea over the lung gap, and
     the tongue over the floor of the oral cavity. Polygons are stored as
     corner points and drawn with softly rounded corners; an entry may also
     be a ready-made path (the vocal folds are an ellipse). */
  var SAG_HOTSPOTS = [
    ["lungs", [[112, 720], [155, 622], [300, 600], [430, 610], [560, 600],
      [660, 640], [690, 760], [680, 1050], [600, 1110], [200, 1115],
      [130, 1040], [108, 850]]],
    ["pharynx", [[355, 258], [400, 262], [408, 320], [405, 400], [398, 470],
      [390, 540], [360, 545], [362, 470], [368, 380], [358, 310]]],
    ["larynx", [[335, 505], [395, 498], [412, 530], [410, 585], [395, 605],
      [345, 605], [328, 560]]],
    ["vocal_folds",
      "M378 540 C394 540 406 552 406 566 C406 581 394 592 378 592 " +
      "C362 592 350 581 350 566 C350 552 362 540 378 540 Z"],
    ["trachea", [[358, 608], [402, 608], [408, 680], [415, 745], [440, 790],
      [415, 808], [390, 780], [370, 700], [355, 650]]],
    ["nasal_cavity", [[152, 260], [160, 220], [185, 195], [235, 175],
      [300, 170], [346, 182], [358, 220], [352, 268], [330, 286], [240, 290],
      [175, 283]]],
    ["hard_palate", [[176, 282], [280, 276], [350, 280], [355, 300],
      [280, 302], [180, 306]]],
    ["oral_cavity", [[185, 305], [345, 303], [360, 332], [340, 352],
      [240, 350], [195, 338]]],
    ["tongue", [[215, 360], [240, 337], [300, 327], [350, 335], [368, 365],
      [365, 405], [330, 432], [260, 436], [220, 412], [205, 388]]],
    ["lips", [[158, 295], [200, 300], [212, 340], [202, 392], [163, 382],
      [148, 335]]]
  ];

  /* A closed polygon with its corners rounded off: step back a little along
     each edge and turn through the vertex on a quadratic curve. Keeps the
     traced shape honest while losing the sharp points. */
  function roundedPoly(pts, r) {
    var d = "", n = pts.length;
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      var v1x = p1[0] - p0[0], v1y = p1[1] - p0[1];
      var v2x = p2[0] - p1[0], v2y = p2[1] - p1[1];
      var l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
      var r1 = Math.min(r, l1 / 2.4), r2 = Math.min(r, l2 / 2.4);
      var ax = p1[0] - (v1x / l1) * r1, ay = p1[1] - (v1y / l1) * r1;
      var bx = p1[0] + (v2x / l2) * r2, by = p1[1] + (v2y / l2) * r2;
      d += (i ? "L" : "M") + ax.toFixed(1) + " " + ay.toFixed(1) +
        "Q" + p1[0] + " " + p1[1] + " " + bx.toFixed(1) + " " + by.toFixed(1);
    }
    return d + "Z";
  }

  function sagittal(labels, opts) {
    opts = opts || {};
    var hots = "";
    for (var i = 0; i < SAG_HOTSPOTS.length; i++) {
      var shape = SAG_HOTSPOTS[i][1];
      var d = typeof shape === "string" ? shape : roundedPoly(shape, 16);
      hots += '<path class="rgn" data-v="' + SAG_HOTSPOTS[i][0] + '" d="' + d + '"/>';
    }
    return '<div class="sagittal sag-fig' + (opts.cls ? " " + opts.cls : "") + '">' +
      '<img src="' + SAG_IMG + '" alt="" draggable="false">' +
      '<svg class="sag-hots" viewBox="0 0 ' + SAG_W + " " + SAG_H + '" aria-hidden="true">' +
      hots + "</svg></div>";
  }

  /* An arrow's head, for the airflow lines. */
  function arrowHead(x, y, ang, size) {
    var a = ang, s = size || 18;
    var p1x = x - s * Math.cos(a - 0.45), p1y = y - s * Math.sin(a - 0.45);
    var p2x = x - s * Math.cos(a + 0.45), p2y = y - s * Math.sin(a + 0.45);
    return '<path class="flow-head" d="M' + p1x.toFixed(1) + " " + p1y.toFixed(1) + " L" + x + " " + y +
      " L" + p2x.toFixed(1) + " " + p2y.toFixed(1) + '"/>';
  }

  /* ---------------------------------------------------------
     Lab 6: drawing helpers for the air and the vocal folds,
     shared by the consonant mouth (ART.cmouth, further down)
     and the key to its marks
     --------------------------------------------------------- */
  // the same line, re-walked so the points sit `step` apart
  function evenPts(pts, step) {
    var out = [pts[0]], carry = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var seg = Math.hypot(b[0] - a[0], b[1] - a[1]), pos = step - carry;
      while (pos <= seg) {
        var t = pos / seg;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        pos += step;
      }
      carry = seg - (pos - step);
    }
    var last = pts[pts.length - 1];
    if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > step * 0.3) out.push(last);
    return out;
  }
  function polyD(pts) {
    return pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
  }
  function normalAt(pts, i) {
    var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  }
  // the hiss: the same route, wobbling either side of itself
  function squigglePts(pts, amp, wave) {
    var s = 0;
    return pts.map(function (p, i) {
      if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      var nn = normalAt(pts, i), a = amp * Math.sin(s / wave * Math.PI * 2) * Math.min(1, s / 18);
      return [p[0] + nn[0] * a, p[1] + nn[1] * a];
    });
  }
  function headAt(pts, cls, size) {
    var a = pts[pts.length - 2], b = pts[pts.length - 1];
    return arrowHead(+b[0].toFixed(1), +b[1].toFixed(1), Math.atan2(b[1] - a[1], b[0] - a[0]), size)
      .replace('class="flow-head"', 'class="pv-head' + (cls ? " " + cls : "") + '"');
  }
  var BURST_RAYS = "M-30 -18 L-19 -11 M-33 6 L-20 4 M-24 26 L-15 17 M30 -18 L19 -11 M33 6 L20 4 M24 26 L15 17";
  function burstMark(x, y, live, k) {
    // the outer group places and sizes it; the inner one is free for CSS to scale
    return '<g transform="translate(' + x.toFixed(0) + "," + y.toFixed(0) + ") scale(" + (k || 1) + ')">' +
      '<g class="burst' + (live ? " pv-pop" : "") + '"><circle r="13"/><path d="' + BURST_RAYS + '"/></g></g>';
  }
  function sealMark(x, y, k) {
    return '<g transform="translate(' + x.toFixed(0) + "," + y.toFixed(0) + ") scale(" + (k || 1) + ')"><g class="burst seal">' +
      '<circle r="13"/><path d="M-9 -9 L9 9 M-9 9 L9 -9"/></g></g>';
  }

  /* The vocal folds seen from above, front at the top: two pale bands that
     meet at the front. Apart in a V, with the dark glottis between them, for
     a voiceless sound; together and vibrating, with the buzz drawn either
     side, for a voiced one. */
  function foldsArt(cx, cy, R, voiced) {
    var ax = cx, ay = cy - 0.62 * R, py = cy + 0.5 * R;
    var spread = voiced ? 0.05 * R : 0.4 * R;
    function band(side) {
      var px = cx + side * spread;
      var ox = px + side * 0.2 * R, oy = py + 0.06 * R;
      var mx = (ax + px) / 2 + side * 0.3 * R, my = (ay + py) / 2;
      return '<path class="pv-band ' + (side < 0 ? "pv-bl" : "pv-br") + '" d="M' + ax.toFixed(1) + " " + ay.toFixed(1) +
        " L" + px.toFixed(1) + " " + py.toFixed(1) + " L" + ox.toFixed(1) + " " + oy.toFixed(1) +
        " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + ax.toFixed(1) + " " + ay.toFixed(1) + 'Z"/>' +
        '<ellipse class="pv-ary" cx="' + (ox - side * 0.06 * R).toFixed(1) + '" cy="' + (oy + 0.12 * R).toFixed(1) +
        '" rx="' + (0.13 * R).toFixed(1) + '" ry="' + (0.11 * R).toFixed(1) + '"/>';
    }
    var gap = voiced
      ? '<path class="pv-slit" d="M' + ax + " " + (ay + 4) + " L" + (cx - 0.035 * R).toFixed(1) + " " + py.toFixed(1) +
        " L" + (cx + 0.035 * R).toFixed(1) + " " + py.toFixed(1) + ' Z"/>'
      : '<path class="pv-glottis" d="M' + ax + " " + (ay + 3) + " L" + (cx - spread + 2).toFixed(1) + " " + py.toFixed(1) +
        " L" + (cx + spread - 2).toFixed(1) + " " + py.toFixed(1) + ' Z"/>';
    var buzz = "";
    if (voiced) {
      [-1, 1].forEach(function (side) {
        for (var k = 0; k < 3; k++) {
          var rr = 0.42 * R + k * 0.15 * R, x0 = cx + side * 0.06 * R;
          buzz += '<path class="pv-buzz b' + k + '" d="M' + (x0 + side * rr * Math.cos(0.55)).toFixed(1) + " " +
            (cy - rr * Math.sin(0.55)).toFixed(1) + " A" + rr.toFixed(1) + " " + rr.toFixed(1) + " 0 0 " +
            (side > 0 ? 1 : 0) + " " + (x0 + side * rr * Math.cos(0.55)).toFixed(1) + " " +
            (cy + rr * Math.sin(0.55)).toFixed(1) + '"/>';
        }
      });
    }
    return '<g class="pv-folds ' + (voiced ? "on" : "off") + '">' +
      '<circle class="pv-disc" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' +
      '<ellipse class="pv-throat" cx="' + cx + '" cy="' + (cy - 0.02 * R).toFixed(1) + '" rx="' + (0.62 * R).toFixed(1) +
      '" ry="' + (0.74 * R).toFixed(1) + '"/>' +
      gap + band(-1) + band(1) + buzz + "</g>";
  }

  // a moving stream: a faint base line, and the dots that travel along it
  function stream(d, cls) {
    // the base carries pvb-* twins of the classes, so no rule for the dots can reach it
    return '<path class="pv-base ' + cls.replace(/\bpv-/g, "pvb-") + '" d="' + d + '"/><path class="' + cls + '" d="' + d + '"/>';
  }

  /* The key to the marks, one small picture per manner, drawn with the same
     marks as the figure so a student can match them at a glance. */
  function mannerIcon(kind) {
    var y = 38, inner = "";
    var line = function (d, cls) { return stream(d, cls || "pv-air"); };
    var arrow = function (x, yy, ang) { return arrowHead(x, yy, ang).replace('class="flow-head"', 'class="pv-head"'); };
    var sq = "M84 " + y + " C88 30 92 30 96 " + y + " S104 46 108 " + y + " S116 30 120 " + y + " S128 46 132 " + y;
    if (kind === "stop") {
      inner = line("M8 " + y + " H70", "pv-air pv-press-line") + '<path class="pv-puff" d="M80 ' + y + ' H138"/>' +
        burstMark(76, y, true);
    } else if (kind === "fric") {
      inner = line("M8 " + y + " H76") + line(sq, "pv-hiss") + arrow(140, y, 0) +
        '<circle class="contact" cx="78" cy="' + y + '" r="10"/>';
    } else if (kind === "affric") {
      inner = line("M8 " + y + " H70", "pv-air pv-press-line") + line(sq, "pv-hiss pv-late") +
        arrow(140, y, 0).replace('class="pv-head"', 'class="pv-head pv-late"') + burstMark(76, y, true);
    } else if (kind === "nasal") {
      inner = line("M8 " + y + " H52 C70 " + y + " 74 8 98 8 H136") + arrow(140, 8, 0) + sealMark(100, y);
    } else if (kind === "lateral") {
      inner = line("M8 " + y + " H60") + line("M60 " + y + " C72 " + y + " 74 22 92 22 H136", "pv-air pv-side") +
        line("M60 " + y + " C72 " + y + " 74 54 92 54 H136", "pv-air pv-side") + arrow(140, 38, 0) + sealMark(84, y);
    } else if (kind === "approx") {
      inner = line("M8 " + y + " H134", "pv-air pv-wide") + arrow(140, y, 0) +
        '<circle class="contact open" cx="76" cy="' + y + '" r="16"/>';
    }
    return '<svg class="mk-ico pv-live" viewBox="0 0 150 64" aria-hidden="true" focusable="false">' +
      '<g class="sd-overlay pv-overlay">' + inner + "</g></svg>";
  }
  function foldsIcon(voiced) {
    return '<svg class="mk-ico mk-folds pv-live" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<g class="pv-overlay">' + foldsArt(60, 60, 46, voiced) + "</g></svg>";
  }

  /* ---------------------------------------------------------
     Spot illustrations for the three systems
     --------------------------------------------------------- */
  function systemIcon(kind, opts) {
    opts = opts || {};
    return '<img class="sys-img' + (opts.cls ? " " + opts.cls : "") +
      '" src="img/sys_' + kind + '.jpg" alt="" draggable="false">';
  }

  /* ---------------------------------------------------------
     Small pictures for the Word Builder words. Flat, friendly,
     one 48x48 box each, same family as the Lab 1 objects.
     --------------------------------------------------------- */
  /* The ten Word Builder words ship as generated pictures in img/. The bee,
     used only by the worked example, stays drawn. */
  var WORD_IMG = { me: 1, shoe: 1, go: 1, say: 1, key: 1, boat: 1, lace: 1,
    loose: 1, toast: 1, steam: 1 };
  /* A build that lists the pictures it actually ships (window.LAB_IMAGES,
     Lab 3 onward) overrides that static list, so a missing picture simply
     falls back to a drawn icon, or to nothing, instead of a broken image.
     The list is written into items.js, which loads AFTER this file, so it is
     read when a picture is first asked for, never at load time. */
  var WORD_IMG_READY = false;
  function wordImages() {
    if (!WORD_IMG_READY && w.LAB_IMAGES) {
      WORD_IMG = {};
      w.LAB_IMAGES.forEach(function (f) {
        var m = /^w_([a-z]+)\.(jpg|png)$/.exec(f);
        if (m) WORD_IMG[m[1]] = m[2];
      });
      WORD_IMG_READY = true;
    }
    return WORD_IMG;
  }

  var WORD_ICONS = {
    egg: '<ellipse cx="24" cy="42" rx="13" ry="2.6" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M24 6 C33 6 38 20 38 29 C38 37 32 42 24 42 C16 42 10 37 10 29 C10 20 15 6 24 6 Z" fill="#F6E7C8"/>' +
      '<path d="M24 6 C33 6 38 20 38 29 C38 33 36 37 33 39 C36 30 33 14 24 8 Z" fill="#E6D2AA" opacity=".7"/>' +
      '<ellipse cx="18" cy="17" rx="3" ry="5" fill="#FFFFFF" opacity=".75" transform="rotate(-12 18 17)"/>',
    bee: '<ellipse cx="24" cy="28" rx="12" ry="9" fill="#F3C64B"/>' +
      '<path d="M18 20.4 L18 36 M24 19 L24 37 M30 20.4 L30 36" stroke="#3B3F49" stroke-width="3.4" stroke-linecap="round"/>' +
      '<ellipse cx="17" cy="16" rx="6" ry="8" fill="#CFE4F5" opacity=".9" transform="rotate(-24 17 16)"/>' +
      '<ellipse cx="31" cy="16" rx="6" ry="8" fill="#CFE4F5" opacity=".9" transform="rotate(24 31 16)"/>' +
      '<circle cx="36" cy="26" r="4.6" fill="#3B3F49"/>' +
      '<path d="M13 29 L7 30" stroke="#3B3F49" stroke-width="2" stroke-linecap="round"/>'
  };

  function wordIcon(name, opts) {
    opts = opts || {};
    var imgs = wordImages();
    if (imgs[name]) {
      var ext = imgs[name] === 1 ? "jpg" : imgs[name];
      return '<img class="w-img" src="img/w_' + name + "." + ext + '" alt="" draggable="false">';
    }
    // (the Lab 1 objects double as word icons: Lab 4's worked example builds "cat")
    if (!WORD_ICONS[name] && !OBJECTS[name]) return "";
    return svg(WORD_ICONS[name] || OBJECTS[name], { cls: opts.cls, attrs: opts.attrs });
  }


  /* ---------------------------------------------------------
     The moving mouth (Lab 5)
     A midsagittal section drawn as vector art, so that the
     tongue, the jaw and the lips can move. A pose is:
       h      tongue height, 0 low .. 1 high
       b      tongue backness, 0 front .. 1 back
       round  lip rounding, -0.3 spread .. 1 fully rounded
       tip    r-colouring, 0 .. 1 (the tip lifts toward the ridge)
       jaw    optional; left out, the jaw opens as the tongue drops
     The tongue is interpolated between the eight cardinal vowel
     positions (Daniel Jones's cardinal vowel diagrams, as drawn
     by Badseed on Wikimedia Commons, CC BY-SA 3.0), each
     resampled to the same twelve points, tip to root, so any
     two positions morph into each other exactly. Everything
     else in the figure is drawn for this course.
     --------------------------------------------------------- */
  var MX = 0, MY = 40, MW = 384, MH = 360;       // the crop of the 400x400 drawing space
  var PIVOT = [326, 104];                        // where the jaw hinges, projected onto the midline

  function spline(pts, closed, t) {
    t = t == null ? 0.5 : t;
    var n = pts.length, d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (!closed) {
        if (i === 0) p0 = p1;
        if (i + 2 >= n) p3 = p2;
      }
      var c1x = p1[0] + (p2[0] - p0[0]) * t / 3, c1y = p1[1] + (p2[1] - p0[1]) * t / 3;
      var c2x = p2[0] - (p3[0] - p1[0]) * t / 3, c2y = p2[1] - (p3[1] - p1[1]) * t / 3;
      d += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) +
        " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d + (closed ? " Z" : "");
  }
  function rotAbout(p, ang, c0) {
    var s = Math.sin(ang), c = Math.cos(ang);
    var x = p[0] - c0[0], y = p[1] - c0[1];
    return [c0[0] + x * c - y * s, c0[1] + x * s + y * c];
  }
  function mix(a, b, t) { return a + (b - a) * t; }
  function mixPts(A, B, t) {
    return A.map(function (p, i) { return [mix(p[0], B[i][0], t), mix(p[1], B[i][1], t)]; });
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  /* The upper surface of the tongue, tip to the vallecula at the foot of the
     epiglottis, for the eight cardinal vowels. Front column low to high, then
     back column low to high. */
  /* Adjusted 2026-10-20 after an independent review: in the source drawings the low front
     vowel peaked almost where the back vowels do, and the back vowels peaked under the hard
     palate, so the highest point (the dot) did not follow the vowel chart. The low front shape's
     hump is carried forward, and the back shapes bunch up toward the soft palate. */
  var CARD = {
    F: [
      [[147, 208], [166, 195], [188, 184], [212, 176], [236, 172], [260, 174], [285, 180], [308, 195], [318, 217], [316, 241], [311, 266], [306, 290]],   // a
      [[139, 204], [161, 189], [185, 177], [210, 167], [236, 159], [262, 158], [287, 168], [306, 186], [317, 211], [316, 237], [311, 264], [306, 290]],   // ɛ
      [[136, 199], [155, 179], [179, 164], [205, 152], [232, 145], [260, 148], [286, 160], [305, 181], [316, 206], [317, 234], [312, 262], [306, 290]],   // e
      [[135, 198], [151, 173], [173, 151], [199, 135], [229, 128], [259, 132], [285, 148], [305, 171], [317, 199], [318, 230], [312, 260], [306, 290]]    // i
    ],
    B: [
      [[146, 208], [168, 197], [193, 190], [218, 186], [245, 181], [272, 174], [298, 172], [320, 188.4], [330, 215], [323, 241], [310, 264], [306, 290]],   // ɑ
      [[140, 205], [166, 193], [193, 183], [220, 176], [247, 168], [274, 158], [301, 156], [321, 178.2], [325, 210], [315, 235], [311, 263], [306, 290]],   // ɔ
      [[138, 201], [163, 184], [188, 172], [215, 163], [242, 156], [270, 149], [296, 148], [312, 173.6], [316, 207], [313, 235], [310, 262], [306, 290]],   // o
      [[137, 199], [160, 178], [185, 162], [212, 151], [241, 143], [270, 136], [296, 140], [310, 168.6], [315, 203], [315, 233], [308, 261], [306, 290]]    // u
    ]
  };
  var T_JAW = [1, 0.75, 0.45, 0.2, 0, 0, 0, 0, 0, 0, 0, 0];     // how far each point rides with the jaw
  // the underside, never outlined: it fades into the floor of the mouth
  var T_BASE = [[300, 318], [252, 336], [198, 338], [158, 322], [144, 284], [140, 246], [134, 224]];
  var B_JAW = [0, 0.2, 0.6, 1, 1, 1, 1];
  var FIBRE_ROOT = [152, 318];                  // the genioglossus fans out from the chin

  function columnAt(col, h) {
    var s = clamp01(h) * 3, i = Math.min(2, Math.floor(s));
    return mixPts(col[i], col[i + 1], s - i);
  }
  function jawOpen(pose) { return pose.jaw != null ? pose.jaw : 1 - clamp01(pose.h); }
  function jawAngle(pose) { return 0.036 - jawOpen(pose) * 0.09; }      // radians; negative drops the chin

  function tonguePts(pose) {
    if (pose.pts) {
      // Lab 6: a consonant shape gives its surface ready-made, already where the jaw puts it
      var a0 = jawAngle(pose);
      var rideK = function (p, wgt) { var q = rotAbout(p, a0, PIVOT); return [mix(p[0], q[0], wgt), mix(p[1], q[1], wgt)]; };
      return {
        up: pose.pts.map(function (p) { return [p[0], p[1]]; }),
        // ub moves the underside: a hollow opens under a tip that curls or lifts
        base: T_BASE.map(function (p, i) {
          var u = pose.ub ? pose.ub[i] : [0, 0];
          return rideK([p[0] + u[0], p[1] + u[1]], B_JAW[i]);
        }),
        root: rideK(FIBRE_ROOT, 1)
      };
    }
    var up = mixPts(columnAt(CARD.F, pose.h), columnAt(CARD.B, pose.h), clamp01(pose.b));
    if (pose.tip) {                         // r-colouring: the tip lifts toward the ridge
      var k = pose.tip;
      up[0] = [mix(up[0][0], 146, k), mix(up[0][1], 176, k)];
      up[1] = [mix(up[1][0], 160, k), mix(up[1][1], up[1][1] - 6, k)];
    }
    var ang = jawAngle(pose);
    function ride(p, wgt) { var q = rotAbout(p, ang, PIVOT); return [mix(p[0], q[0], wgt), mix(p[1], q[1], wgt)]; }
    return {
      up: up.map(function (p, i) { return ride(p, T_JAW[i]); }),
      base: T_BASE.map(function (p, i) { return ride(p, B_JAW[i]); }),
      root: ride(FIBRE_ROOT, 1)
    };
  }
  function tonguePaths(pose) {
    var P = tonguePts(pose);
    var body = spline(P.up.concat(P.base), true, 0.55);
    // the outline: up from behind the lower teeth, round the tip, along the surface
    var line = spline([P.base[P.base.length - 1]].concat(P.up), false, 0.55);
    var fib = "";
    for (var i = 1; i <= 9; i++) {
      var s = P.up[i];
      var ex = mix(P.root[0], s[0], 0.86), ey = mix(P.root[1], s[1], 0.86);
      fib += "M" + P.root[0].toFixed(1) + " " + P.root[1].toFixed(1) +
        " Q" + mix(P.root[0], s[0], 0.5).toFixed(1) + " " + (mix(P.root[1], s[1], 0.5) + 8).toFixed(1) +
        " " + ex.toFixed(1) + " " + ey.toFixed(1);
    }
    return { body: body, line: line, fibres: fib };
  }
  /* The highest point of the tongue, the point the vowel chart plots. */
  function tonguePeak(pose) {
    var up = tonguePts(pose).up, best = null;
    function cr(a, b, c, d, t) {
      return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    }
    for (var i = 1; i < 8; i++) {
      var p0 = up[i - 1], p1 = up[i], p2 = up[i + 1], p3 = up[i + 2];
      for (var t = 0; t <= 1.0001; t += 0.05) {
        var x = cr(p0[0], p1[0], p2[0], p3[0], t), y = cr(p0[1], p1[1], p2[1], p3[1], t);
        if (!best || y < best[1]) best = [x, y];
      }
    }
    return best;
  }

  // lip rounding: each lip turns about its root, so the lips pout forward and close in
  var ULIP_HINGE = [76, 98], LLIP_HINGE = [90, 256];
  function lipT(pose, which) {
    var r = pose.round || 0, rp = Math.max(0, r);
    return which === "up"
      ? "translate(" + (-3 * rp).toFixed(2) + " " + (3 * rp).toFixed(2) + ") rotate(" + (13 * r).toFixed(2) + " " +
        ULIP_HINGE[0] + " " + ULIP_HINGE[1] + ")"
      : "translate(" + (-3 * rp).toFixed(2) + " " + (-5 * rp).toFixed(2) + ") rotate(" + (-14 * r).toFixed(2) + " " +
        LLIP_HINGE[0] + " " + LLIP_HINGE[1] + ")";
  }
  function jawT(pose) {
    return "rotate(" + (jawAngle(pose) * 180 / Math.PI).toFixed(2) + " " + PIVOT[0] + " " + PIVOT[1] + ")";
  }

  /* Where each vowel puts the tongue. Keyed by the audio manifest's slug; e and o
     are the starting points of the glides /eɪ/ and /oʊ/, which is how American
     English says them. The cardinal heights are 1, 2/3, 1/3 and 0. */
  var VOWEL_POSE = {
    iy:  { h: 1,    b: 0,    round: -0.3 },
    ih:  { h: 0.8,  b: 0.14, round: -0.1 },
    ey:  { h: 0.62, b: 0,    round: -0.15 },
    eh:  { h: 0.38, b: 0,    round: 0 },
    ae:  { h: 0.12, b: 0.16, round: 0 },
    er:  { h: 0.55, b: 0.5,  round: 0.3, tip: 0.8 },
    axr: { h: 0.55, b: 0.5,  round: 0.3, tip: 0.8 },
    ax:  { h: 0.5,  b: 0.5,  round: 0 },
    ah:  { h: 0.32, b: 0.56, round: 0 },
    uw:  { h: 1,    b: 1,    round: 1 },
    uh:  { h: 0.8,  b: 0.76, round: 0.55 },
    ow:  { h: 0.62, b: 1,    round: 0.85 },
    ao:  { h: 0.36, b: 1,    round: 0.6 },
    aa:  { h: 0,    b: 1,    round: 0 }
  };
  /* The heights the Tongue Mover offers. */
  var HEIGHT_OF = { high: 1, mid: 0.62, low: 0 };
  /* The glides: where the diphthongs, and American /e/ and /o/, end up. */
  var VOWEL_GLIDE = { ey: "ih", ow: "uh", ay: ["aa", "ih"], aw: ["aa", "uh"], oy: ["ao", "ih"] };
  var MOUTH_REST = { h: 0.5, b: 0.5, round: 0, tip: 0 };

  /* ---- the fixed anatomy, in the 400x400 drawing space ---- */
  // everything above the jaw, in section; its lower edge tucks inside the jaw and the lips
  var M_HEAD = "M46 36 C38 46 28 58 18 68 C10 76 10 86 18 90 C30 95 50 94 70 92 " +
    "C76 108 78 130 80 160 C82 172 88 180 100 182 L140 240 L190 300 L215 345 L236 358 " +
    "C242 364 246 368 246 370 C250 380 254 390 256 400 L400 400 L400 36 Z";
  var M_HEAD_EDGE = "M46 36 C38 46 28 58 18 68 C10 76 10 86 18 90 C30 95 50 94 70 92";
  var M_NECK_EDGE = "M246 370 C250 380 254 390 256 400";
  // the air: mouth and throat
  var M_AIR = "M58 196 C62 186 72 182 84 184 C92 184 98 182 104 182 L110 190 L118 188 " +
    "C122 178 126 170 132 164 C146 150 164 138 184 128 C204 120 228 116 252 114 C270 114 284 116 294 120 " +
    "C312 128 330 142 342 160 C348 172 350 186 352 202 C354 240 356 280 357 310 C356 340 352 370 352 400 " +
    "L318 400 C320 380 324 350 322 320 L304 292 L260 280 L180 262 L140 244 L112 236 L90 240 L66 232 Z";
  // the back wall of the throat, and the roof of the mouth up to the velum
  var M_WALLS = "M342 160 C348 172 350 186 352 202 C354 240 356 280 357 310 C356 340 352 370 352 400 " +
    "M313 298 C318 306 322 314 322 322 C324 350 320 380 318 400";
  // the jaw: lower lip, chin and the floor of the mouth, turning about the hinge
  var M_JAW = "M104 212 C96 208 88 206 80 208 C70 212 64 222 64 232 C64 242 70 250 84 254 " +
    "C88 262 86 272 86 282 C86 300 92 322 106 336 C122 350 146 358 176 362 C204 365 232 366 256 370 " +
    "C270 376 280 388 286 400 L310 400 L310 330 L300 300 L240 280 L170 262 L140 246 L134 222 L124 206 Z";
  var M_JAW_EDGE = "M84 254 C88 262 86 272 86 282 C86 300 92 322 106 336 C122 350 146 358 176 362 " +
    "C200 365 222 366 240 367";
  var M_CHIN_BONE = "M124 238 C118 258 114 282 118 304 C122 322 134 332 148 332 C158 330 160 318 158 304 " +
    "C154 282 148 260 142 240 Z";
  // the lips: skin, the red of the lip on its outer curve, and the outline
  var M_UPPER_LIP = "M70 92 C76 100 78 110 76 124 C74 138 68 150 62 162 C58 170 58 180 66 184 " +
    "C76 187 90 186 102 182 C104 166 104 146 100 128 C96 112 86 100 70 92 Z";
  var M_UPPER_VERM = "M62 162 C58 170 58 180 66 184 C76 187 90 186 102 182 C102 176 100 170 96 166 " +
    "C86 160 74 158 62 162 Z";
  var M_UPPER_LIP_EDGE = "M70 92 C76 100 78 110 76 124 C74 138 68 150 62 162 C58 170 58 180 66 184 " +
    "C76 187 90 186 102 182";
  var M_LOWER_LIP = "M106 214 C96 208 84 206 74 210 C64 214 60 224 62 234 C64 244 72 250 82 254 " +
    "C90 256 98 250 104 240 C108 232 110 222 106 214 Z";
  var M_LOWER_VERM = "M106 214 C96 208 84 206 74 210 C64 214 60 224 62 234 C63 238 66 242 70 245 " +
    "C80 236 94 226 106 220 Z";
  var M_LOWER_LIP_EDGE = "M106 214 C96 208 84 206 74 210 C64 214 60 224 62 234 C64 244 72 250 82 254";

  function mouthFixed() {
    return '' +
      // hard palate: the bone above the roof of the mouth
      '<path class="m-bone" d="M128 160 C142 146 162 132 186 122 C208 114 234 110 258 109 C272 109 284 111 292 114 ' +
      'L294 121 C284 117 270 115 252 115 C228 116 204 120 184 128 C164 138 146 150 132 164 Z"/>' +
      // velum, raised against the back wall, as it is for every oral vowel
      '<path class="m-velum" d="M290 114 C308 118 326 128 338 142 C346 152 350 162 352 174 L352 190 ' +
      'C348 190 346 196 343 202 C339 206 336 200 337 192 C331 172 318 152 304 140 C298 134 292 128 286 122 ' +
      'C282 118 284 114 290 114 Z"/>' +
      // alveolar ridge
      '<path class="m-gum" d="M112 170 C118 164 126 160 134 158 C130 164 128 170 125 178 C120 176 116 174 112 170 Z"/>' +
      // upper incisor
      '<path class="m-tooth" d="M100 160 C101 172 104 182 108 190 C110 194 115 194 117 190 C120 180 123 172 127 162 ' +
      'C119 156 107 155 100 160 Z"/>' +
      // epiglottis
      '<path class="m-velum" d="M304 294 C306 282 310 270 318 260 C322 256 327 259 324 264 C318 274 314 286 313 298 Z"/>';
  }

  function mouth(opts) {
    opts = opts || {};
    var pose = opts.pose || MOUTH_REST;
    var T = tonguePaths(pose), pk = tonguePeak(pose), jt = jawT(pose);
    return '<div class="mouth-fig' + (opts.cls ? " " + opts.cls : "") + '">' +
      '<svg class="m-svg" viewBox="' + MX + " " + MY + " " + MW + " " + MH + '" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="mTongueG" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="330">' +
      '<stop offset="0" stop-color="#E86A79"/><stop offset=".38" stop-color="#DD6272"/>' +
      '<stop offset=".78" stop-color="#EDA99E"/><stop offset="1" stop-color="#F3C2B1"/></linearGradient></defs>' +
      '<path class="m-flesh" d="' + M_HEAD + '"/>' +
      '<path class="m-air" d="' + M_AIR + '"/>' +
      '<path class="m-edge" d="' + M_WALLS + '"/>' +
      mouthFixed() +
      '<g class="m-jaw" transform="' + jt + '"><path class="m-flesh" d="' + M_JAW + '"/>' +
      '<path class="m-bone soft" d="' + M_CHIN_BONE + '"/></g>' +
      '<path class="m-tongue" d="' + T.body + '"/>' +
      '<path class="m-fibres" d="' + T.fibres + '"/>' +
      '<path class="m-tongue-line" d="' + T.line + '"/>' +
      '<g class="m-jaw" transform="' + jt + '">' +
      '<path class="m-tooth" d="M116 234 C115 224 115 214 118 205 C120 200 128 200 131 205 C134 214 135 224 136 232 Z"/>' +
      '<g class="m-llip" transform="' + lipT(pose, "lo") + '"><path class="m-flesh" d="' + M_LOWER_LIP + '"/>' +
      '<path class="m-lip" d="' + M_LOWER_VERM + '"/><path class="m-edge" d="' + M_LOWER_LIP_EDGE + '"/></g>' +
      '<path class="m-edge" d="' + M_JAW_EDGE + '"/></g>' +
      '<g class="m-ulip" transform="' + lipT(pose, "up") + '"><path class="m-flesh" d="' + M_UPPER_LIP + '"/>' +
      '<path class="m-lip" d="' + M_UPPER_VERM + '"/><path class="m-edge" d="' + M_UPPER_LIP_EDGE + '"/></g>' +
      '<path class="m-edge" d="' + M_HEAD_EDGE + '"/>' +
      '<path class="m-edge" d="' + M_NECK_EDGE + '"/>' +
      (opts.dot ? '<circle class="m-peak" r="5.5" cx="' + pk[0].toFixed(1) + '" cy="' + pk[1].toFixed(1) + '"/>' : "") +
      (opts.extra || "") +
      "</svg></div>";
  }

  /* Drives one drawn mouth. set() eases to a pose; glide() walks a list of
     poses, the way a diphthong moves; both call done() at the end. With
     reduced motion every move lands at once. */
  var REDUCE_MOTION = !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function poseFull(p) {
    return { h: p.h, b: p.b, round: p.round || 0, tip: p.tip || 0, jaw: jawOpen(p) };
  }
  function mouthCtl(fig, start) {
    var svg = fig.querySelector("svg");
    var body = svg.querySelector(".m-tongue"), line = svg.querySelector(".m-tongue-line");
    var fibres = svg.querySelector(".m-fibres");
    var jaws = [].slice.call(svg.querySelectorAll(".m-jaw"));
    var ulip = svg.querySelector(".m-ulip"), llip = svg.querySelector(".m-llip");
    var dot = svg.querySelector(".m-peak");
    var cur = poseFull(start || MOUTH_REST), raf = 0, token = 0, timer = 0;

    function draw(p) {
      var T = tonguePaths(p);
      body.setAttribute("d", T.body);
      line.setAttribute("d", T.line);
      fibres.setAttribute("d", T.fibres);
      var jt = jawT(p);
      jaws.forEach(function (g) { g.setAttribute("transform", jt); });
      ulip.setAttribute("transform", lipT(p, "up"));
      llip.setAttribute("transform", lipT(p, "lo"));
      if (dot) {
        var pk = tonguePeak(p);
        dot.setAttribute("cx", pk[0].toFixed(1));
        dot.setAttribute("cy", pk[1].toFixed(1));
      }
      fig.setAttribute("data-h", p.h.toFixed(2));
      fig.setAttribute("data-b", p.b.toFixed(2));
    }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    function tween(to, dur, done) {
      cancelAnimationFrame(raf);
      var from = cur, tgt = poseFull(to), my = ++token;
      if (REDUCE_MOTION || !dur) {
        cur = tgt; draw(cur);
        if (done) done();
        return;
      }
      var t0 = null;
      function frame(ts) {
        if (my !== token) return;
        if (t0 == null) t0 = ts;
        var k = Math.min(1, Math.max(0, (ts - t0) / dur)), e = ease(k), p = {};
        for (var key in tgt) p[key] = mix(from[key], tgt[key], e);
        cur = p; draw(p);
        if (k < 1) raf = requestAnimationFrame(frame);
        else if (done) done();
      }
      raf = requestAnimationFrame(frame);
    }

    draw(cur);
    return {
      pose: function () { return cur; },
      set: function (to, dur, done) { clearTimeout(timer); tween(to, dur == null ? 560 : dur, done); },
      /* poses: moved to in turn; gap: ms to hold on each before the next */
      glide: function (list, dur, gap, done) {
        var i = 0;
        clearTimeout(timer);
        (function step() {
          if (i >= list.length) { if (done) done(); return; }
          tween(list[i++], dur == null ? 560 : dur, function () {
            var my = token;
            timer = setTimeout(function () { if (my === token) step(); }, gap == null ? 140 : gap);
          });
        })();
      },
      stop: function () { token++; clearTimeout(timer); cancelAnimationFrame(raf); }
    };
  }

  /* A vowel's full movement: its pose, and for /e/, /o/ and the diphthongs,
     the glide to where it ends. */
  function vowelMoves(slug) {
    var g = VOWEL_GLIDE[slug];
    if (!g) return [VOWEL_POSE[slug]];
    if (typeof g === "string") return [VOWEL_POSE[slug], VOWEL_POSE[g]];
    return g.map(function (s) { return VOWEL_POSE[s]; });
  }

  /* ---------------------------------------------------------
     The vowel chart (Lab 5): the quadrilateral, in a 360x290
     box, with a place for every American English vowel. The
     screens lay real buttons over it at these points.
     --------------------------------------------------------- */
  var VC_W = 360, VC_H = 290, VC_Y = 18;
  var VC_POS = {
    iy: [40, 48],  uw: [300, 48],
    ih: [98, 78],  uh: [248, 78],
    ey: [74, 117], er: [158, 114], axr: [216, 114], ow: [300, 117],
    ax: [188, 158],
    eh: [108, 185], ah: [250, 185], ao: [300, 185],
    ae: [130, 228], aa: [300, 254],
    a: [196, 254]            // Lab 8: the open [a] of the made-up words, not an English vowel
  };
  var VC_IPA = { iy: "i", ih: "ɪ", ey: "e", eh: "ɛ", ae: "æ", er: "ɝ", axr: "ɚ", ax: "ə", ah: "ʌ",
    uw: "u", uh: "ʊ", ow: "o", ao: "ɔ", aa: "ɑ", a: "a" };
  function vowelChart(opts) {
    opts = opts || {};
    var tl = [40, 48], tr = [300, 48], br = [300, 254], bl = [142, 254];
    function at(y) { return tl[0] + (bl[0] - tl[0]) * (y - tl[1]) / (bl[1] - tl[1]); }
    var cm = 117, om = 185;                                     // close-mid and open-mid rows
    var mids = [[tl[0] + (tr[0] - tl[0]) / 2, tl[1]], [bl[0] + (br[0] - bl[0]) / 2, bl[1]]];
    var lines =
      '<path class="vc-frame" d="M' + tl + " L" + tr + " L" + br + " L" + bl + ' Z"/>' +
      '<path class="vc-grid" d="M' + at(cm).toFixed(1) + " " + cm + " L" + tr[0] + " " + cm +
      " M" + at(om).toFixed(1) + " " + om + " L" + tr[0] + " " + om +
      " M" + mids[0] + " L" + mids[1] + '"/>';
    var labels = opts.labels === false ? "" :
      '<text class="vc-ax" x="' + tl[0] + '" y="' + VC_Y + '" text-anchor="middle">Front</text>' +
      '<text class="vc-ax" x="' + mids[0][0] + '" y="' + VC_Y + '" text-anchor="middle">Central</text>' +
      '<text class="vc-ax" x="' + tr[0] + '" y="' + VC_Y + '" text-anchor="middle">Back</text>' +
      '<text class="vc-ax" x="' + (tr[0] + 28) + '" y="' + (tl[1] + 5) + '" text-anchor="start">High</text>' +
      '<text class="vc-ax" x="' + (tr[0] + 28) + '" y="' + ((cm + om) / 2 + 5) + '" text-anchor="start">Mid</text>' +
      '<text class="vc-ax" x="' + (tr[0] + 28) + '" y="' + (br[1] + 5) + '" text-anchor="start">Low</text>';
    return '<svg class="vc-svg" viewBox="0 0 ' + VC_W + " " + VC_H + '" aria-hidden="true" focusable="false">' +
      lines + labels + "</svg>";
  }

  /* =========================================================
     Lab 6: the consonant mouth
     Lab 5's drawn mouth, taught consonants. On top of the
     tongue, the jaw and lip rounding it adds: lips that close
     (/p b m/), a lower lip that meets the upper teeth (/f v/),
     a velum that lowers to open the way to the nose, with the
     nasal passage drawn in, and a tongue surface given shape by
     shape (CSHAPE) rather than mixed from the vowels. Over it:
     a glow at the place, the air (cAir), the vocal folds in a
     circle, and for /l/ a small view of the tongue from above.
     cmouthCtl moves it: into the sound, hold, release, back.
     ========================================================= */
  // the velum, raised against the back wall and lowered away from it; the two paths share
  // one sequence of commands so every number can be mixed between them
  var VEL_UP_D = "M290 114 C308 118 326 128 338 142 C346 152 350 162 352 174 L352 190 C348 190 346 196 343 202 " +
    "C339 206 336 200 337 192 C331 172 318 152 304 140 C298 134 292 128 286 122 C282 118 284 114 290 114 Z";
  var VEL_DOWN_D = "M290 114 C305 119 316 130 323 144 C329 157 331 172 330 188 L329 198 C327 206 323 213 318 217 " +
    "C314 220 310 215 312 207 C315 192 313 172 306 157 C300 145 293 133 286 122 C282 118 284 114 290 114 Z";
  function numsOf(d) { return d.match(/-?\d+(?:\.\d+)?/g).map(Number); }
  var VEL_UP_N = numsOf(VEL_UP_D), VEL_DOWN_N = numsOf(VEL_DOWN_D);
  function velumD(k) {
    var i = 0;
    return VEL_UP_D.replace(/-?\d+(?:\.\d+)?/g, function () {
      var v = mix(VEL_UP_N[i], VEL_DOWN_N[i], k); i++;
      return (Math.round(v * 10) / 10).toString();
    });
  }
  /* The nasal cavity, drawn at its real size: from the nostril up inside the nose, along
     the top of the figure, down the back into the space above the velum, and forward again
     over the hard palate. The three turbinates are the shelves on its side wall; the air
     through the nose takes the passage between the lower two. */
  var NASAL_AIR = "M27 93 C28 87 32 81 40 74 C50 65 64 58 84 56 C124 53 190 53 250 54 C290 56 316 64 332 80 " +
    "C344 94 350 116 352 140 L352 174 C346 160 338 148 326 136 C314 126 302 118 288 114 C262 108 230 106 200 106 " +
    "C160 105 120 103 92 99 C70 97 48 96 27 93 Z";
  var NASAL_EDGE = "M27 93 C28 87 32 81 40 74 C50 65 64 58 84 56 C124 53 190 53 250 54 C290 56 316 64 332 80 " +
    "C344 94 350 116 352 140 L352 174";
  var NASAL_TURB = "M112 98 C136 91 186 90 236 91 C262 92 284 95 296 100 C300 104 294 107 284 106 C252 103 196 102 150 103 " +
    "C130 104 114 103 112 98 Z " +
    "M150 77 C172 70 214 68 252 69 C274 70 292 73 302 78 C305 82 300 84 290 83 C258 80 214 79 176 81 C160 82 150 82 150 77 Z " +
    "M210 64 C226 58 254 57 276 59 C290 60 302 62 308 66 C309 69 305 71 297 70 C274 67 246 66 224 67 C212 68 206 67 210 64 Z";

  /* The mouth shapes. A shape gives the tongue's upper surface, tip to root (twelve
     points, as the vowels do), or a vowel position to borrow it from; how far the jaw is
     open; what the lips do; and where the sound is made (the glow and the marks sit at
     `at`). Drawn from the standard side views of each place of articulation. */
  var CSHAPE = {
    bilabial:    { v: { h: 0.5, b: 0.5 }, jaw: 0.12, close: 1, at: [82, 186] },
    labiodental: { v: { h: 0.5, b: 0.5 }, jaw: 0.16, labdent: 1, at: [106, 192] },
    dental:      { pts: [[98, 199], [115, 199], [136, 191], [159, 181], [185, 173], [212, 168], [240, 166],
                         [267, 169], [290, 179], [307, 197], [313, 241], [306, 290]], jaw: 0.62, at: [110, 197] },
    alv_stop:    { pts: [[127, 174], [136, 166], [152, 161], [176, 158], [203, 155], [231, 153], [258, 154],
                         [282, 163], [302, 181], [314, 207], [313, 248], [306, 290]], jaw: 0.22, at: [127, 172] },
    alv_fric:    { pts: [[126, 187], [137, 179], [153, 171], [176, 164], [203, 160], [231, 157], [259, 158],
                         [284, 166], [303, 184], [314, 209], [313, 249], [306, 290]], jaw: 0.06, at: [124, 182] },
    postalv:     { pts: [[133, 189], [141, 166], [151, 154], [169, 147], [193, 141], [220, 138], [248, 140],
                         [274, 149], [296, 167], [311, 193], [313, 240], [306, 290]], jaw: 0.06, round: 0.35,
                   ub: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [3, -4], [9, -12]], at: [146, 157] },
    postalv_stop:{ pts: [[131, 182], [138, 160], [150, 148], [169, 145], [193, 140], [220, 137], [248, 139],
                         [274, 148], [296, 166], [311, 193], [313, 240], [306, 290]], jaw: 0.1, round: 0.35,
                   ub: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [3, -4], [9, -12]], at: [143, 154] },
    retroflex:   { pts: [[143, 171], [153, 164], [166, 172], [186, 182], [210, 183], [236, 178], [261, 172],
                         [285, 174], [305, 188], [319, 210], [316, 242], [306, 290]], jaw: 0.28, round: 0.45,
                   ub: [[0, 0], [0, 0], [0, 0], [0, 0], [2, -4], [8, -12], [18, -28]], at: [150, 156] },
    palatal:     { pts: [[135, 197], [151, 172], [173, 149], [199, 133], [229, 126], [259, 130], [285, 147],
                         [305, 171], [317, 199], [318, 230], [312, 260], [306, 290]], jaw: 0.14, round: -0.25, at: [214, 122] },
    velar:       { pts: [[140, 207], [160, 198], [184, 189], [210, 178], [236, 161], [262, 140], [287, 125],
                         [305, 142], [322, 166], [325, 204], [316, 248], [306, 290]], jaw: 0.32, at: [296, 133] },
    labiovelar:  { pts: [[137, 200], [160, 177], [185, 158], [212, 144], [241, 136], [270, 127], [294, 137],
                         [310, 166], [316, 199], [315, 232], [308, 261], [306, 290]], jaw: 0.22, round: 1.15, at: [80, 190], at2: [296, 134] },
    glottal:     { v: { h: 0.38, b: 0.5 }, jaw: 0.55, at: null }
  };
  /* Every English consonant: its shape, how the air gets out, and its voicing. */
  var CONS = {
    p:  { s: "bilabial", f: "stop", vo: 0 },     b:  { s: "bilabial", f: "stop", vo: 1 },
    m:  { s: "bilabial", f: "nasal", vo: 1 },
    f:  { s: "labiodental", f: "fric", vo: 0 },  v:  { s: "labiodental", f: "fric", vo: 1 },
    th: { s: "dental", f: "fric", vo: 0 },       dh: { s: "dental", f: "fric", vo: 1 },
    t:  { s: "alv_stop", f: "stop", vo: 0 },     d:  { s: "alv_stop", f: "stop", vo: 1 },
    n:  { s: "alv_stop", f: "nasal", vo: 1 },    l:  { s: "alv_stop", f: "lateral", vo: 1 },
    s:  { s: "alv_fric", f: "fric", vo: 0 },     z:  { s: "alv_fric", f: "fric", vo: 1 },
    sh: { s: "postalv", f: "fric", vo: 0 },      zh: { s: "postalv", f: "fric", vo: 1 },
    ch: { s: "postalv_stop", f: "affric", vo: 0, to: "postalv" },
    jh: { s: "postalv_stop", f: "affric", vo: 1, to: "postalv" },
    r:  { s: "retroflex", f: "approx", vo: 1 },  y:  { s: "palatal", f: "approx", vo: 1 },
    k:  { s: "velar", f: "stop", vo: 0 },        g:  { s: "velar", f: "stop", vo: 1 },
    ng: { s: "velar", f: "nasal", vo: 1 },
    w:  { s: "labiovelar", f: "approx", vo: 1 },
    h:  { s: "glottal", f: "glottal", vo: 0 }
  };
  var C_REST = { v: { h: 0.5, b: 0.5 }, jaw: 0.45 };

  var UB_NONE = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
  function shapePose(sh, velum) {
    var pts = sh.pts ? sh.pts : tonguePts({ h: sh.v.h, b: sh.v.b, jaw: sh.jaw }).up;
    return { pts: pts.map(function (p) { return [p[0], p[1]]; }), jaw: sh.jaw, round: sh.round || 0,
      close: sh.close || 0, labdent: sh.labdent || 0, velum: velum || 0,
      ub: (sh.ub || UB_NONE).map(function (p) { return [p[0], p[1]]; }) };
  }
  function consPose(slug) {
    var c = CONS[slug];
    return shapePose(CSHAPE[c.s], c.f === "nasal" ? 1 : 0);
  }
  function restPose() { return shapePose(C_REST, 0); }
  function mixPose(a, b, t) {
    return { pts: a.pts.map(function (p, i) { return [mix(p[0], b.pts[i][0], t), mix(p[1], b.pts[i][1], t)]; }),
      jaw: mix(a.jaw, b.jaw, t), round: mix(a.round, b.round, t), close: mix(a.close, b.close, t),
      labdent: mix(a.labdent, b.labdent, t), velum: mix(a.velum, b.velum, t),
      ub: a.ub.map(function (p, i) { return [mix(p[0], b.ub[i][0], t), mix(p[1], b.ub[i][1], t)]; }) };
  }
  // the lips: Lab 5's rounding, then closing (the lower lip rises to meet the upper,
  // which comes down a little) and the lower lip tucking up under the upper teeth
  function cLipT(p, which) {
    var base = lipT({ round: p.round }, which);
    return which === "up"
      ? base + " translate(0 " + (3 * p.close - 5 * p.labdent).toFixed(2) + ")"
      : base + " translate(" + (7 * p.labdent - 2 * p.close).toFixed(2) + " " + (-15 * p.close - 16 * p.labdent).toFixed(2) + ")";
  }

  /* The roof of the oral cavity, back to front: the velum's underside, the hard palate,
     the ridge and the back of the upper teeth. The air midway between it and the tongue
     is the route the air takes through the mouth. */
  var ROOF = [[341, 206], [337, 192], [331, 172], [318, 152], [304, 140], [292, 128], [286, 120], [270, 114],
    [252, 114], [228, 116], [204, 120], [184, 128], [164, 138], [146, 150], [132, 164], [125, 178], [120, 186], [116, 192]];
  function yOn(line, x) {
    for (var i = 0; i < line.length - 1; i++) {
      var a = line[i], b = line[i + 1];
      if ((x <= a[0] && x >= b[0]) || (x >= a[0] && x <= b[0])) {
        var t = a[0] === b[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return null;
  }
  function tongueTop(pts, x) {
    // the upper surface, sampled along the same curve the drawing uses
    var best = null;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var t = 0; t <= 1; t += 0.05) {
        var t2 = t * t, t3 = t2 * t;
        var sx = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        var sy = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        if (Math.abs(sx - x) < 3 && (best == null || sy < best)) best = sy;
      }
    }
    return best;
  }
  // the channel's midline from x0 forward to x1
  function channel(pts, x0, x1) {
    var out = [];
    for (var x = x0; x >= x1; x -= 8) {
      var r = yOn(ROOF, x), t = tongueTop(pts, x);
      if (r != null && t != null) out.push([x, (r + t) / 2]);
    }
    return out;
  }
  var C_PHARYNX = [[337, 398], [336, 330], [334, 262], [331, 222], [326, 200]];
  // the postalveolar hiss: forward along the roof behind the ridge, then out past the teeth
  var C_POST_HISS = [[141, 160], [134, 167], [129, 176], [124, 187], [117, 198]];
  var C_EXIT = [[116, 197], [104, 196], [90, 194], [74, 193], [42, 193]];   // under the incisor's edge, over the lower lip, out
  var C_NOSE = [[337, 398], [337, 330], [341, 262], [343, 206], [346, 160], [345, 126], [334, 102], [312, 90],
    [270, 87], [220, 86], [170, 86], [124, 87], [84, 89], [56, 92], [36, 96], [22, 103]];

  /* The air for one consonant: what reaches the place (up), what leaves it (down), and
     for a nasal the way out through the nose. */
  function cRoutes(slug) {
    var c = CONS[slug], sh = CSHAPE[c.s], P = shapePose(sh).pts, at = sh.at, f = c.f;
    var R = { up: [], down: [], nose: null };
    if (f === "nasal") {
      R.nose = C_NOSE.map(function (p) { return p.slice(); });
      return R;
    }
    if (c.s === "glottal" || f === "approx") {
      var all = C_PHARYNX.concat(channel(P, 318, 140)).concat(C_EXIT);
      if (c.s === "labiovelar") all = C_PHARYNX.concat(channel(P, 318, 140)).concat([[112, 196], [90, 194], [70, 192], [42, 192]]);
      R.up = all;
      return R;
    }
    if (c.s === "velar") {
      // up the throat to just behind the closure; the puff leaves in front of it
      R.up = C_PHARYNX.slice(0, -1).concat([[332, 200], [329, 184], [324, 172]]);
      R.down = [[282, 121], [270, 121], [250, 124]].concat(channel(P, 242, 140)).concat(C_EXIT);
      return R;
    }
    var front = c.s === "bilabial" ? 120 : c.s === "labiodental" ? 120 : at[0] + 10;
    R.up = C_PHARYNX.concat(channel(P, 318, front));
    if (c.s === "bilabial") {
      R.up = R.up.concat([[112, 194], [98, 190]]);
      R.down = [[74, 188], [58, 188], [38, 189]];
    } else if (c.s === "labiodental") {
      R.up = R.up.concat([[112, 194]]);
      R.down = [[106, 189], [98, 184], [86, 184], [72, 185], [40, 186]];
    } else if (c.s === "dental") {
      R.up = R.up.concat([[at[0] + 8, at[1] - 4]]);
      R.down = [[at[0] - 2, at[1] - 3], [90, 196], [66, 197], [40, 198]];
    } else if (c.s === "postalv" || c.s === "postalv_stop") {
      R.up = R.up.concat([[at[0] + 4, at[1]]]);
      R.down = C_POST_HISS.concat(C_EXIT.slice(1));
    } else {
      R.up = R.up.concat([[at[0] + 4, at[1]]]);
      R.down = [[at[0] - 2, at[1] + 6], [120, 190]].concat(C_EXIT);
      if (f === "lateral") R.down = [[at[0] + 12, at[1] + 4], [130, 188], [118, 196]].concat(C_EXIT.slice(1));
    }
    return R;
  }

  function cMarkAt(f, at, k) {
    if (!at) return "";
    if (f === "stop" || f === "affric") return burstMark(at[0], at[1], true, k);
    if (f === "nasal" || f === "lateral") return sealMark(at[0], at[1], k);
    if (f === "fric") return '<circle class="contact" cx="' + at[0] + '" cy="' + at[1] + '" r="' + (6.5 * k / 0.6).toFixed(1) + '"/>';
    return '<circle class="contact open" cx="' + at[0] + '" cy="' + at[1] + '" r="' + (10 * k / 0.6).toFixed(1) + '"/>';
  }

  // the tongue from above, for /l/: sealed at the tip, the air flowing past both sides
  function topView() {
    var cx = 336, cy = 82, R = 34;
    return '<g class="cm-top">' +
      '<circle class="cm-top-disc" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' +
      '<path class="cm-top-teeth" d="M' + (cx + 22) + " " + (cy - 24) + " C" + (cx - 8) + " " + (cy - 26) + " " + (cx - 26) + " " +
        (cy - 14) + " " + (cx - 26) + " " + cy + " C" + (cx - 26) + " " + (cy + 14) + " " + (cx - 8) + " " + (cy + 26) + " " +
        (cx + 22) + " " + (cy + 24) + '"/>' +
      '<path class="cm-top-tongue" d="M' + (cx + 30) + " " + (cy - 14) + " C" + (cx + 4) + " " + (cy - 16) + " " + (cx - 18) + " " +
        (cy - 12) + " " + (cx - 18) + " " + cy + " C" + (cx - 18) + " " + (cy + 12) + " " + (cx + 4) + " " + (cy + 16) + " " +
        (cx + 30) + " " + (cy + 14) + ' Z"/>' +
      '<path class="cm-top-seal" d="M' + (cx - 19) + " " + (cy - 7) + " L" + (cx - 19) + " " + (cy + 7) + '"/>' +
      '<path class="pv-air pv-side cm-down" d="M' + (cx + 28) + " " + (cy - 20) + " C" + (cx + 2) + " " + (cy - 22) + " " +
        (cx - 14) + " " + (cy - 20) + " " + (cx - 24) + " " + (cy - 10) + '"/>' +
      '<path class="pv-air pv-side cm-down" d="M' + (cx + 28) + " " + (cy + 20) + " C" + (cx + 2) + " " + (cy + 22) + " " +
        (cx - 14) + " " + (cy + 20) + " " + (cx - 24) + " " + (cy + 10) + '"/>' +
      '<text class="cm-top-cap" x="' + cx + '" y="' + (cy + R + 13) + '" text-anchor="middle">from above</text></g>';
  }

  function cFolds(voiced) {
    var cx = 46, cy = 352, R = 34;
    return '<g class="cm-folds-inset">' +
      '<circle class="pv-frame" cx="' + cx + '" cy="' + cy + '" r="' + (R + 4) + '"/>' +
      foldsArt(cx, cy, R, voiced) +
      '<text class="pv-cap cm-cap" x="' + cx + '" y="' + (cy - R - 10) + '" text-anchor="middle">vocal folds</text></g>';
  }

  /* Everything drawn over the mouth for one consonant. Each piece carries a class the
     player times: cm-up (air reaching the place), cm-down (air leaving it: the hiss, the
     puff, the side streams), cm-nose, cm-press (pressure behind a closure). */
  function cAir(slug) {
    var c = CONS[slug], sh = CSHAPE[c.s], f = c.f, R = cRoutes(slug), K = 0.6;
    var out = "";
    if (sh.at) out += '<ellipse class="cm-glow" cx="' + sh.at[0] + '" cy="' + sh.at[1] + '" rx="17" ry="13"/>';
    if (sh.at2) out += '<ellipse class="cm-glow" cx="' + sh.at2[0] + '" cy="' + sh.at2[1] + '" rx="17" ry="13"/>';
    // /h/ is made at the vocal folds themselves, which the figure shows only in the inset:
    // the glow rings the inset instead (drawn first, so the inset sits on top of it)
    if (c.s === "glottal") out += '<circle class="cm-glow cm-glow-folds" cx="46" cy="352" r="44"/>';
    var g = function (pts, cls) { return pts && pts.length > 1 ? stream(polyD(evenPts(pts, 3)), cls) : ""; };
    var w = function (pts, cls, amp) { return pts && pts.length > 1 ? stream(polyD(squigglePts(evenPts(pts, 3), amp || 4.5, 11)), cls) : ""; };
    if (f === "nasal") {
      out += g(R.nose, "pv-air cm-nose") + headAt(R.nose, "cm-nose", 7);
    } else if (f === "glottal") {
      out += w(R.up, "pv-hiss cm-up") + headAt(R.up, "cm-up", 7);
    } else if (f === "approx") {
      out += g(R.up, "pv-air pv-wide cm-up") + headAt(R.up, "cm-up", 7);
    } else {
      out += g(R.up, "pv-air cm-up");
      if (f === "stop") {
        out += '<circle class="pv-press cm-press" cx="' + sh.at[0] + '" cy="' + sh.at[1] + '" r="20"/>' +
          '<path class="pv-puff cm-down" d="' + polyD(evenPts(R.down, 3)) + '"/>';
      } else if (f === "affric") {
        out += '<circle class="pv-press cm-press" cx="' + sh.at[0] + '" cy="' + sh.at[1] + '" r="20"/>' +
          w([[125, 191], [118, 196]].concat(C_EXIT.slice(1)), "pv-hiss pv-late cm-down") +
          headAt(C_EXIT, "pv-late cm-down", 7);
      } else if (f === "fric") {
        out += w(R.down, "pv-hiss cm-down", c.s === "labiodental" ? 2.6 : 0) + headAt(R.down, "cm-down", 7);
      } else if (f === "lateral") {
        out += g(R.down, "pv-air pv-side cm-down") + headAt(R.down, "cm-down", 7);
      }
    }
    out += cMarkAt(f, sh.at, K) + (sh.at2 ? cMarkAt(f, sh.at2, K) : "");
    if (f === "lateral") out += topView();
    out += cFolds(!!c.vo);
    return out;
  }

  function cmouthBody(pose) {
    var T = tonguePaths(pose), jt = jawT(pose);
    return '<path class="m-flesh" d="' + M_HEAD + '"/>' +
      '<path class="m-air" d="' + M_AIR + '"/>' +
      '<path class="m-air cm-nasal" d="' + NASAL_AIR + '"/><path class="cm-turb" d="' + NASAL_TURB + '"/>' +
      // the space the raised velum fills: open air once it drops for a nasal (independent review 2026-10-20)
      '<path class="m-air" d="' + VEL_UP_D + '"/><path class="m-air" d="M343 202 L352 189 L352 205 Z"/>' +
      '<path class="m-edge" d="' + NASAL_EDGE + '"/>' +
      '<path class="m-edge" d="' + M_WALLS.replace("M342 160 C348 172 350 186 352 202", "M352 174 L352 202") + '"/>' +
      mouthFixed().replace(/<path class="m-velum" d="M290 114[^"]*"\/>/, '<path class="m-velum cm-velum" d="' + velumD(pose.velum) + '"/>') +
      '<g class="m-jaw" transform="' + jt + '"><path class="m-flesh" d="' + M_JAW + '"/>' +
      '<path class="m-bone soft" d="' + M_CHIN_BONE + '"/></g>' +
      '<path class="m-tongue" d="' + T.body + '"/>' +
      '<path class="m-fibres" d="' + T.fibres + '"/>' +
      '<path class="m-tongue-line" d="' + T.line + '"/>' +
      '<g class="m-jaw" transform="' + jt + '">' +
      '<path class="m-tooth" d="M116 234 C115 224 115 214 118 205 C120 200 128 200 131 205 C134 214 135 224 136 232 Z"/>' +
      '<g class="m-llip" transform="' + cLipT(pose, "lo") + '"><path class="m-flesh" d="' + M_LOWER_LIP + '"/>' +
      '<path class="m-lip" d="' + M_LOWER_VERM + '"/><path class="m-edge" d="' + M_LOWER_LIP_EDGE + '"/></g>' +
      '<path class="m-edge" d="' + M_JAW_EDGE + '"/></g>' +
      '<g class="m-ulip" transform="' + cLipT(pose, "up") + '"><path class="m-flesh" d="' + M_UPPER_LIP + '"/>' +
      '<path class="m-lip" d="' + M_UPPER_VERM + '"/><path class="m-edge" d="' + M_UPPER_LIP_EDGE + '"/></g>' +
      '<path class="m-edge" d="' + M_HEAD_EDGE + '"/>' +
      '<path class="m-edge" d="' + M_NECK_EDGE + '"/>';
  }

  /* The figure for one consonant, drawn in its own position with the air and the vocal
     folds over it. opts.cls tags the wrapper. */
  function cmouth(slug, opts) {
    opts = opts || {};
    var c = CONS[slug];
    if (!c) return "";
    return '<div class="mouth-fig cm-fig' + (opts.cls ? " " + opts.cls : "") + '" data-c="' + slug + '" data-flow="' + c.f +
      '" data-voiced="' + (c.vo ? 1 : 0) + '">' +
      '<svg class="m-svg" viewBox="' + MX + " " + MY + " " + MW + " " + MH + '" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="mTongueG" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="330">' +
      '<stop offset="0" stop-color="#E86A79"/><stop offset=".38" stop-color="#DD6272"/>' +
      '<stop offset=".78" stop-color="#EDA99E"/><stop offset="1" stop-color="#F3C2B1"/></linearGradient></defs>' +
      '<g class="cm-body">' + cmouthBody(consPose(slug)) + "</g>" +
      '<g class="sd-overlay pv-overlay cm-overlay">' + cAir(slug) + "</g>" +
      "</svg></div>";
  }

  /* Plays one consonant on a drawn figure. The figure starts at rest, moves into the
     sound, holds it while the air does what it does, lets go, and settles back on the
     sound's own position, where it stays as a still picture. opts.cue(ms), when given,
     is called with the moment (ms from now) the sound should be heard: the release for a
     stop or an affricate, the start of the hold for everything else, so a recording can
     be lined up with the picture. opts.holdMs stretches the hold to fit a recording. */
  function cmouthCtl(fig, o) {
    o = o || {};
    var svg = fig.querySelector("svg");
    var slug = fig.getAttribute("data-c"), c = CONS[slug];
    var body = svg.querySelector(".m-tongue"), line = svg.querySelector(".m-tongue-line");
    var fibres = svg.querySelector(".m-fibres"), velum = svg.querySelector(".cm-velum");
    var jaws = [].slice.call(svg.querySelectorAll(".m-jaw"));
    var ulip = svg.querySelector(".m-ulip"), llip = svg.querySelector(".m-llip");
    // o.start "rest": the figure waits at rest until it plays (the articulator map)
    var home = consPose(slug), cur = o.start === "rest" ? restPose() : home, raf = 0, token = 0, timers = [];

    function draw(p) {
      var T = tonguePaths(p);
      body.setAttribute("d", T.body);
      line.setAttribute("d", T.line);
      fibres.setAttribute("d", T.fibres);
      velum.setAttribute("d", velumD(p.velum));
      var jt = jawT(p);
      jaws.forEach(function (g) { g.setAttribute("transform", jt); });
      ulip.setAttribute("transform", cLipT(p, "up"));
      llip.setAttribute("transform", cLipT(p, "lo"));
      if (o.onDraw) o.onDraw(p);
    }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function tween(to, dur, done) {
      cancelAnimationFrame(raf);
      var from = cur, my = token, t0 = null;
      function frame(ts) {
        if (my !== token) return;
        if (t0 == null) t0 = ts;
        var k = Math.min(1, Math.max(0, (ts - t0) / dur));
        cur = mixPose(from, to, ease(k)); draw(cur);
        if (k < 1) raf = requestAnimationFrame(frame);
        else if (done) done();
      }
      raf = requestAnimationFrame(frame);
    }
    function phase(name) {
      fig.classList.remove("ph-in", "ph-hold", "ph-rel", "ph-out");
      if (name) fig.classList.add(name);
    }
    function later(ms, fn) { var my = token; timers.push(setTimeout(function () { if (my === token) fn(); }, ms)); }
    function stop() {
      token++; cancelAnimationFrame(raf);
      timers.forEach(clearTimeout); timers = [];
      fig.classList.remove("playing"); phase(null);
      cur = home; draw(cur);
    }

    function play(opts) {
      opts = opts || {};
      stop();
      if (REDUCE_MOTION) {
        cur = home; draw(cur);
        if (opts.cue) opts.cue(0); if (opts.done) opts.done(); return;
      }
      var IN = 460, HOLD = Math.max(c.f === "stop" || c.f === "affric" ? 700 : 1150, opts.holdMs || 0);
      var REL = c.f === "affric" ? 760 : 420, BACK = 380, PAUSE = 450;
      var rest = restPose();
      if (c.f === "nasal") rest.velum = 0;
      cur = rest; draw(cur);
      fig.classList.add("playing");
      phase("ph-in");
      tween(home, IN);
      if (opts.cue) opts.cue(c.f === "stop" || c.f === "affric" ? IN + HOLD : IN);
      later(IN, function () { phase("ph-hold"); });
      later(IN + HOLD, function () {
        phase("ph-rel");
        if (c.f === "affric") tween(consPose(c.to === "postalv" ? "sh" : slug), REL * 0.7);
        else tween(mixPose(home, rest, c.f === "stop" ? 0.45 : 0.8), REL);
      });
      later(IN + HOLD + REL, function () { phase("ph-out"); });
      later(IN + HOLD + REL + PAUSE, function () {
        tween(home, BACK, function () {
          fig.classList.remove("playing"); phase(null);
          if (opts.done) opts.done();
        });
      });
    }

    draw(cur);
    return { play: play, stop: stop, slug: slug, pose: function () { return cur; } };
  }

  /* ---------------------------------------------------------
     The articulator map (Labs 3 and 4, Trail 1)
     The same drawn mouth, at rest, with the ten articulators as
     tap regions over it: six on the roof and the lips (fixed),
     three on the tongue's surface (they ride on the tongue as it
     moves), and the vocal-folds circle. The figure carries the
     sound's own air and folds, hidden until the map is switched
     on (class am-on), and plays from rest into the sound.
     --------------------------------------------------------- */
  // fixed regions, in the drawing's own units (viewBox 0 40 384 360)
  var AM_FIXED = {
    lips:     [[58, 154], [96, 160], [98, 196], [110, 210], [108, 232], [92, 254], [64, 252], [50, 230], [50, 178]],
    teeth:    [[96, 140], [119, 140], [121, 160], [118, 180], [116, 194], [108, 201], [100, 193], [95, 172]],
    alveolar: [[119, 140], [136, 135], [142, 158], [136, 172], [128, 188], [118, 188], [118, 180], [121, 160]],
    postalv:  [[136, 135], [147, 125], [160, 116], [170, 132], [168, 146], [150, 157], [142, 158]],
    palate:   [[160, 116], [190, 106], [226, 102], [262, 102], [290, 104], [288, 124], [262, 124], [228, 126],
               [198, 132], [170, 146], [170, 132]]
  };
  // the velum moves (it drops for a nasal), so its region is mixed between raised and lowered
  var AM_VELUM_UP = [[290, 100], [314, 106], [340, 124], [358, 150], [360, 196], [348, 214], [332, 212], [326, 186],
    [314, 160], [298, 142], [286, 130], [288, 124]];
  var AM_VELUM_DOWN = [[290, 100], [312, 108], [330, 126], [342, 152], [344, 190], [334, 224], [316, 230], [302, 214],
    [304, 188], [298, 162], [288, 140], [284, 126]];
  var AM_GLOTTIS = [46, 352, 40];
  // the tongue regions: stretches of its upper surface, by point index (0 = tip)
  var AM_TONGUE = { tip: [0, 1.2, 20], blade: [1.2, 3.2, 20], back: [5.0, 7.6, 22] };
  var AM_ORDER = ["lips", "teeth", "alveolar", "postalv", "palate", "velum", "tip", "blade", "back", "glottis"];
  // where a label sits, and the point of its region its leader line reaches; the
  // tongue's labels sit inside the tongue, offset from the middle of their stretch
  var AM_LABEL = { lips: [30, 266], teeth: [50, 136], alveolar: [72, 110], postalv: [120, 84],
    palate: [226, 64], velum: [322, 78], glottis: [128, 356] };
  var AM_ANCHOR = { lips: [78, 206], teeth: [108, 178], alveolar: [129, 165], postalv: [150, 146],
    palate: [226, 114], glottis: [70, 342] };
  var AM_TONGUE_LABEL = { tip: [-6, 74], blade: [14, 54], back: [-10, 32] };

  // a point and the inward normal at fractional index s along the drawn surface
  function surfAt(pts, s) {
    var n = pts.length, i = Math.max(0, Math.min(n - 2, Math.floor(s))), u = s - i, T = 0.55;
    var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    var c1 = [p1[0] + (p2[0] - p0[0]) * T / 3, p1[1] + (p2[1] - p0[1]) * T / 3];
    var c2 = [p2[0] - (p3[0] - p1[0]) * T / 3, p2[1] - (p3[1] - p1[1]) * T / 3];
    function bz(k, t) {
      var m = 1 - t;
      return m * m * m * p1[k] + 3 * m * m * t * c1[k] + 3 * m * t * t * c2[k] + t * t * t * p2[k];
    }
    var x = bz(0, u), y = bz(1, u), e = 0.01;
    var x2 = bz(0, Math.min(1, u + e)), y2 = bz(1, Math.min(1, u + e));
    var x1 = bz(0, Math.max(0, u - e)), y1 = bz(1, Math.max(0, u - e));
    var tx = x2 - x1, ty = y2 - y1, L = Math.hypot(tx, ty) || 1;
    return { p: [x, y], n: [-ty / L, tx / L], t: [tx / L, ty / L] };
  }
  function amBand(pts, spec) {
    var a = spec[0], b = spec[1], depth = spec[2], out = 8, top = [], bot = [];
    for (var s = a; s <= b + 1e-6; s += 0.2) {
      var q = surfAt(pts, s);
      top.push([q.p[0] - q.n[0] * out, q.p[1] - q.n[1] * out]);
      bot.push([q.p[0] + q.n[0] * depth, q.p[1] + q.n[1] * depth]);
    }
    if (a === 0) {                       // round the tip: reach a little past it
      var q0 = surfAt(pts, 0);
      top.unshift([q0.p[0] - q0.t[0] * 7 - q0.n[0] * 2, q0.p[1] - q0.t[1] * 7 - q0.n[1] * 2]);
    }
    return top.concat(bot.reverse());
  }
  function polyPath(pts) {
    return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + " Z";
  }
  function circlePts(cx, cy, r) {
    var out = [];
    for (var k = 0; k < 28; k++) { var a = k / 28 * 2 * Math.PI; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return out;
  }
  function amRegionD(v, pose) {
    if (AM_FIXED[v]) return roundedPoly(AM_FIXED[v], 6);
    if (v === "velum") return roundedPoly(mixPts(AM_VELUM_UP, AM_VELUM_DOWN, pose.velum || 0), 6);
    if (v === "glottis") return polyPath(circlePts(AM_GLOTTIS[0], AM_GLOTTIS[1], AM_GLOTTIS[2]));
    return polyPath(amBand(pose.pts, AM_TONGUE[v]));
  }
  // the label spot and the anchor of a region, for a pose
  function amSpot(v, pose) {
    if (AM_TONGUE[v]) {
      var sp = AM_TONGUE[v], q = surfAt(pose.pts, (sp[0] + sp[1]) / 2), off = AM_TONGUE_LABEL[v];
      var anchor = [q.p[0] + q.n[0] * 4, q.p[1] + q.n[1] * 4];
      return { anchor: anchor, label: [anchor[0] + off[0], anchor[1] + off[1]] };
    }
    if (v === "velum") {
      var k = pose.velum || 0;
      return { anchor: [mix(330, 318, k), mix(166, 192, k)], label: AM_LABEL[v] };
    }
    return { anchor: AM_ANCHOR[v], label: AM_LABEL[v] };
  }

  function amap(slug, opts) {
    opts = opts || {};
    var c = CONS[slug];
    if (!c) return "";
    var rest = restPose();
    var rgns = AM_ORDER.map(function (v) {
      return '<path class="rgn" data-v="' + v + '" d="' + amRegionD(v, rest) + '"/>';
    }).join("");
    return '<div class="mouth-fig cm-fig am-fig' + (opts.cls ? " " + opts.cls : "") + '" data-c="' + slug +
      '" data-flow="' + c.f + '" data-voiced="' + (c.vo ? 1 : 0) + '">' +
      '<svg class="m-svg" viewBox="' + MX + " " + MY + " " + MW + " " + MH + '" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="mTongueG" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="330">' +
      '<stop offset="0" stop-color="#E86A79"/><stop offset=".38" stop-color="#DD6272"/>' +
      '<stop offset=".78" stop-color="#EDA99E"/><stop offset="1" stop-color="#F3C2B1"/></linearGradient></defs>' +
      '<g class="cm-body">' + cmouthBody(rest) + "</g>" +
      '<g class="sd-overlay pv-overlay cm-overlay">' + cAir(slug) + "</g>" +
      '<g class="pv-overlay am-folds-rest">' + cFolds(false) + "</g>" +
      '<g class="am-rgns">' + rgns + "</g>" +
      "</svg>" +
      '<svg class="lead-svg am-leads" viewBox="' + MX + " " + MY + " " + MW + " " + MH + '" aria-hidden="true"></svg>' +
      '<div class="am-pins"></div></div>';
  }

  /* Drives a map: the mouth (from rest), the tongue regions riding on the tongue,
     and the labels with their leader lines. labels(list) shows [{v, text, cls}]. */
  function amapCtl(fig) {
    var svg = fig.querySelector(".m-svg"), leads = fig.querySelector(".am-leads"), pinHost = fig.querySelector(".am-pins");
    var moving = {};                       // the regions that ride on a moving part
    ["tip", "blade", "back", "velum"].forEach(function (v) { moving[v] = svg.querySelector('.rgn[data-v="' + v + '"]'); });
    var shown = [], pose = restPose();
    function pct(p) { return "left:" + (p[0] / MW * 100).toFixed(2) + "%;top:" + ((p[1] - MY) / MH * 100).toFixed(2) + "%"; }
    /* Each label at its spot, kept inside the figure and stepped clear of any label
       placed before it (up if it sits above that one, down otherwise), so a small
       screen or a crowded sound never stacks two labels; its leader line follows. */
    function place() {
      var figW = fig.clientWidth, k = figW ? MW / figW : 0, gap = 2 * k, boxes = [];
      shown.forEach(function (L) {
        var sp = amSpot(L.v, pose), lx = sp.label[0], ly = sp.label[1];
        if (k) {
          var bw = L.pin.offsetWidth * k, bh = L.pin.offsetHeight * k;
          var x0 = MX + bw / 2 + gap, x1 = MX + MW - bw / 2 - gap, y0 = MY + bh / 2 + gap, y1 = MY + MH - bh / 2 - gap;
          lx = Math.max(x0, Math.min(x1, lx)); ly = Math.max(y0, Math.min(y1, ly));
          for (var n = 0; n < 8; n++) {
            var hit = null;
            for (var i = 0; i < boxes.length; i++) {
              var b = boxes[i];
              if (Math.abs(b.x - lx) < (b.w + bw) / 2 + gap && Math.abs(b.y - ly) < (b.h + bh) / 2 + gap) { hit = b; break; }
            }
            if (!hit) break;
            var up = hit.y - (hit.h + bh) / 2 - gap, down = hit.y + (hit.h + bh) / 2 + gap;
            ly = (ly < hit.y && up >= y0) || down > y1 ? up : down;
          }
          boxes.push({ x: lx, y: ly, w: bw, h: bh });
        }
        L.line.setAttribute("x1", lx.toFixed(1)); L.line.setAttribute("y1", ly.toFixed(1));
        L.line.setAttribute("x2", sp.anchor[0].toFixed(1)); L.line.setAttribute("y2", sp.anchor[1].toFixed(1));
        L.dot.setAttribute("cx", sp.anchor[0].toFixed(1)); L.dot.setAttribute("cy", sp.anchor[1].toFixed(1));
        L.pin.setAttribute("style", pct([lx, ly]));
      });
    }
    var ctl = cmouthCtl(fig, { start: "rest", onDraw: function (p) {
      pose = p;
      Object.keys(moving).forEach(function (v) { moving[v].setAttribute("d", amRegionD(v, p)); });
      place();
    } });
    function labels(list) {
      leads.innerHTML = ""; pinHost.innerHTML = ""; shown = [];
      (list || []).forEach(function (it) {
        var ns = "http://www.w3.org/2000/svg";
        var line = document.createElementNS(ns, "line"), dot = document.createElementNS(ns, "circle");
        dot.setAttribute("r", "2.6");
        line.setAttribute("class", it.cls || ""); dot.setAttribute("class", it.cls || "");
        leads.appendChild(line); leads.appendChild(dot);
        var pin = document.createElement("span");
        pin.className = "sag-pin am-pin" + (it.cls ? " " + it.cls : "");
        pin.textContent = it.text;
        pinHost.appendChild(pin);
        shown.push({ v: it.v, line: line, dot: dot, pin: pin });
      });
      place();
    }
    return {
      play: function (opts) { fig.classList.add("am-on"); ctl.play(opts); },
      // straight to the sound's own still picture, no movement (a question seen again)
      show: function () { fig.classList.add("am-on"); ctl.stop(); },
      stop: ctl.stop,
      slug: ctl.slug,
      labels: labels,
      on: function () { fig.classList.add("am-on"); }
    };
  }

  w.ART = {
    zodiac: zodiac,
    zodiacInner: zodiacInner,
    ZODIAC: ZODIAC,
    ZODIAC_LABEL: ZODIAC_LABEL,
    gem: gem,
    gemHalf: gemHalf,
    gemFlat: gemFlat,
    gemFlatHalf: gemFlatHalf,
    chest: chest,
    speaker: speaker,
    object: object,
    objectRow: objectRow,
    sagittal: sagittal,
    sagAnchor: SAG_ANCHOR,
    sagW: SAG_W,
    sagH: SAG_H,
    systemIcon: systemIcon,
    wordIcon: wordIcon,
    mannerIcon: mannerIcon,
    cmouth: cmouth,
    cmouthCtl: cmouthCtl,
    amap: amap,
    amapCtl: amapCtl,
    cons: CONS,
    cshape: CSHAPE,
    foldsIcon: foldsIcon,
    mouth: mouth,
    mouthCtl: mouthCtl,
    heightOf: HEIGHT_OF,
    tonguePeak: tonguePeak,
    vowelPose: VOWEL_POSE,
    vowelMoves: vowelMoves,
    mouthRest: MOUTH_REST,
    vowelChart: vowelChart,
    vcPos: VC_POS,
    vcIPA: VC_IPA,
    vcW: VC_W,
    vcH: VC_H
  };
})(window);
