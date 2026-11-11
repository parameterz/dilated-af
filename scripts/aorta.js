// Dilated AF — single-page logic. Depends on data.js.
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const fmt = (x) => x.toFixed(1);
  const r1 = (x) => Math.round(x * 10) / 10;

  const TIMING_LABEL = { diastole: "end-diastole", systole: "mid-systole" };
  const CONVENTION_LABEL = { leading: "leading edge", inside: "inner edge" };
  const BASE_SEGMENTS = ["SOV", "STJ", "AAO"];
  const CUSP_SEGMENTS = ["RCOR", "LCOR", "NONCOR"];
  const STATUS_LABEL = { dilated: "Dilated", small: "Small", normal: "Normal" };

  // Optional pieces of the report statement, in fixed order.
  const CHIPS = [
    { key: "limit", label: "limit + mm at height", def: true },
    { key: "pct", label: "% expected", def: true },
    { key: "z", label: "z-score", def: false },
    { key: "ref", label: "reference", def: false },
  ];

  // ---- small localStorage helpers (best effort) ----
  const store = {
    get(k) {
      try {
        return localStorage.getItem("daf." + k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("daf." + k, v);
      } catch (e) {}
    },
  };

  // ---- settings (remembered) ----
  const chipOn = {};
  CHIPS.forEach((c) => {
    const v = store.get("chip." + c.key);
    chipOn[c.key] = v === null ? c.def : v === "1";
  });
  ["timing", "convention"].forEach((k) => {
    const v = store.get(k);
    if (v) $(k).value = v;
  });

  // ---- per-patient state ----
  let defaultRef = store.get("reportRef") || "NORRE"; // starting choice for each card
  let cardRef = {}; // seg -> "NORRE" | "WASE" chosen on that card
  let edits = {}; // seg -> { basis: generated text, text: user's edited text }

  function resetPatient() {
    defaultRef = store.get("reportRef") || "NORRE";
    cardRef = {};
    edits = {};
  }

  // ---- inputs ----
  function getHeightCm() {
    const cm = parseFloat($("heightCm").value);
    if (!isNaN(cm) && cm > 0) return cm;
    const ft = parseFloat($("heightFeet").value);
    const inch = parseFloat($("heightInches").value);
    if (isNaN(ft) && isNaN(inch)) return null;
    const total = (isNaN(ft) ? 0 : ft) * 30.48 + (isNaN(inch) ? 0 : inch) * 2.54;
    return total > 0 ? total : null;
  }

  function getState() {
    return {
      sex: $("sex").value,
      ageGroup: $("ageGroup").value,
      heightCm: getHeightCm(),
      timing: $("timing").value,
      convention: $("convention").value,
    };
  }

  const waseApplies = (s) => s.timing === "diastole" && s.convention === "leading";
  const activeSegments = (s) =>
    s.timing === "diastole" && s.convention === "inside" ? BASE_SEGMENTS.concat(CUSP_SEGMENTS) : BASE_SEGMENTS;

  // ---- reference lookup ----
  function getRef(which, seg, s) {
    if (which === "WASE") {
      if (!waseApplies(s) || !WASE[seg]) return null;
      return mkRef("WASE", `WASE, ${s.sex} ${s.ageGroup.replace("-", "–")} y, end-diastole, leading edge`, WASE[seg][s.ageGroup][s.sex]);
    }
    const t = NORRE[s.timing][s.convention][seg];
    if (!t) return null;
    return mkRef("NORRE", `NORRE, ${s.sex}, ${TIMING_LABEL[s.timing]}, ${CONVENTION_LABEL[s.convention]}`, t[s.sex]);
  }
  function mkRef(name, label, m) {
    return { name, label, mean: m.mean, sd: m.sd, lln: r1(m.mean - 2 * m.sd), uln: r1(m.mean + 2 * m.sd) };
  }

  // Reference that drives this card's statement.
  function reportRefFor(seg, s) {
    const want = cardRef[seg] || defaultRef;
    return getRef(want, seg, s) || getRef("NORRE", seg, s);
  }

  // ---- evaluation ----
  function evaluate(mm, heightM, ref) {
    const index = r1(mm / heightM);
    const status = index > ref.uln ? "dilated" : index < ref.lln ? "small" : "normal";
    return {
      index,
      status,
      pct: Math.round((index / ref.mean) * 100),
      z: (index - ref.mean) / ref.sd,
      expectedMm: r1(ref.mean * heightM),
      llnMm: r1(ref.lln * heightM),
      ulnMm: r1(ref.uln * heightM),
    };
  }

  const zText = (z) => {
    const v = r1(z);
    return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(1);
  };

  function statement(seg, ev, ref) {
    const { noun, verb } = SEGMENTS[seg];
    const verdict = { dilated: "dilated", small: "small", normal: "within normal limits" }[ev.status];
    const parts = [];
    if (chipOn.limit) {
      if (ev.status === "dilated")
        parts.push(`upper limit of normal ${fmt(ref.uln)} mm/m, equivalent to ${fmt(ev.ulnMm)} mm at this patient's height`);
      else if (ev.status === "small")
        parts.push(`lower limit of normal ${fmt(ref.lln)} mm/m, equivalent to ${fmt(ev.llnMm)} mm at this patient's height`);
      else
        parts.push(`normal range ${fmt(ref.lln)}–${fmt(ref.uln)} mm/m, equivalent to ${fmt(ev.llnMm)}–${fmt(ev.ulnMm)} mm at this patient's height`);
    }
    if (chipOn.pct) parts.push(`${ev.pct}% of expected`);
    if (chipOn.z) parts.push(`z = ${zText(ev.z)}`);
    let text = `When indexed to height, the ${noun} ${verb} ${verdict}: ${fmt(ev.index)} mm/m`;
    if (parts.length) text += ` (${parts.join("; ")})`;
    text += ".";
    if (chipOn.ref) text += ` Reference: ${ref.label}.`;
    return text;
  }

  // ---- rendering ----
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function rangesHtml(seg, s, heightM) {
    const refs = ["NORRE", "WASE"].map((w) => getRef(w, seg, s)).filter(Boolean);
    return (
      `<p class="ranges">Normal at ${fmt(heightM * 100)} cm: ` +
      refs.map((ref) => `${ref.name} <strong>${fmt(ref.lln * heightM)}–${fmt(ref.uln * heightM)} mm</strong>`).join(" · ") +
      `</p>`
    );
  }

  const chipsHtml = () =>
    `<div class="chips" aria-label="Statement contents">` +
    CHIPS.map(
      (c) => `<button type="button" class="chip${chipOn[c.key] ? " on" : ""}" data-chip="${c.key}" aria-pressed="${chipOn[c.key]}">${c.label}</button>`
    ).join("") +
    `</div>`;

  function measuredHtml(seg, mm, s, heightM) {
    const refs = ["NORRE", "WASE"].map((w) => getRef(w, seg, s)).filter(Boolean);
    const rRef = reportRefFor(seg, s);
    const rEv = evaluate(mm, heightM, rRef);
    const generated = statement(seg, rEv, rRef);

    // keep a manual edit only while the generated text it was based on is unchanged
    let shown = generated;
    let edited = false;
    if (edits[seg]) {
      if (edits[seg].basis === generated) {
        shown = edits[seg].text;
        edited = true;
      } else delete edits[seg];
    }

    const pickable = refs.length > 1;
    const rows = refs
      .map((ref) => {
        const ev = evaluate(mm, heightM, ref);
        const st = ev.status === "normal" ? "" : ` class="st-${ev.status}"`;
        const chosen = ref.name === rRef.name;
        const name = pickable
          ? `<label class="ref-pick"><input type="radio" name="ref-${seg}" value="${ref.name}"${chosen ? " checked" : ""} /> ${ref.name}</label>`
          : ref.name;
        return `<tr class="${pickable && chosen ? "chosen" : ""}">
          <th scope="row">${name}</th>
          <td>${fmt(ref.mean)}<small class="muted">${fmt(ev.expectedMm)} mm</small></td>
          <td>${fmt(ref.lln)}–${fmt(ref.uln)}<small class="muted">${fmt(ev.llnMm)}–${fmt(ev.ulnMm)} mm</small></td>
          <td${st}>${ev.pct}%</td>
          <td${st}>${zText(ev.z)}</td>
        </tr>`;
      })
      .join("");

    return {
      status: rEv.status,
      summary: `<strong class="idx">${fmt(rEv.index)} mm/m</strong>
        <span class="badge ${rEv.status}">${STATUS_LABEL[rEv.status]}</span>
        <span class="muted">${rEv.pct}% of expected</span>`,
      body: `
        <div class="overflow-auto">
          <table class="seg-table">
            <thead><tr><th>Ref${pickable ? '<small class="muted">for report</small>' : ""}</th><th>Expected<small class="muted">mm/m</small></th><th>Normal range<small class="muted">mm/m</small></th><th>% exp</th><th>z</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="statement" contenteditable="true" spellcheck="false" data-seg="${seg}" data-basis="${encodeURIComponent(generated)}">${esc(shown)}</p>
        <div class="stmt-tools">
          ${chipsHtml()}
          <span class="edited-flag"${edited ? "" : " hidden"}>edited · <a href="#" class="reset-edit" data-seg="${seg}">reset</a></span>
        </div>
        <button type="button" class="copy-btn secondary outline">Copy to clipboard</button>`,
    };
  }

  function setCard(seg, status, summary, body) {
    const card = $("card-" + seg);
    card.classList.remove("dilated", "small", "normal");
    if (status) card.classList.add(status);
    card.querySelector(".seg-summary").innerHTML = summary;
    card.querySelector(".seg-body").innerHTML = body;
  }

  function update() {
    const s = getState();
    store.set("timing", s.timing);
    store.set("convention", s.convention);

    const cusps = s.timing === "diastole" && s.convention === "inside";
    document.querySelectorAll(".cusp").forEach((el) => (el.hidden = !cusps));
    document.querySelectorAll("#images img").forEach((img) => {
      const key = img.dataset.show;
      img.hidden = !(key === `${s.timing}_${s.convention}` || (key === "sax" && cusps));
    });
    $("diagramLabel").textContent = `${TIMING_LABEL[s.timing]}, ${CONVENTION_LABEL[s.convention]}`;

    const cmTyped = !isNaN(parseFloat($("heightCm").value));
    $("heightEcho").textContent = s.heightCm && !cmTyped ? `= ${fmt(s.heightCm)} cm` : "";

    const heightOk = s.heightCm && s.heightCm >= 100 && s.heightCm <= 250;
    $("awaiting").hidden = !!heightOk;
    const heightM = heightOk ? s.heightCm / 100 : null;

    let measured = 0;
    activeSegments(s).forEach((seg) => {
      if (!heightOk) return setCard(seg, null, "", "");
      const mm = parseFloat($(seg).value);
      if (isNaN(mm) || mm <= 0) return setCard(seg, null, "", rangesHtml(seg, s, heightM));
      const r = measuredHtml(seg, mm, s, heightM);
      measured++;
      setCard(seg, r.status, r.summary, r.body);
    });
    $("copyAllWrap").hidden = measured < 2;
  }

  // ---- clipboard ----
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e2) {}
      document.body.removeChild(ta);
      return ok;
    }
  }

  const visibleStatements = () =>
    [...document.querySelectorAll(".seg-card:not([hidden]) .statement")].map((p) => p.innerText.trim()).filter(Boolean);

  // ---- events ----
  document.addEventListener("click", async (e) => {
    const chip = e.target.closest(".chip");
    if (chip) {
      const k = chip.dataset.chip;
      chipOn[k] = !chipOn[k];
      store.set("chip." + k, chipOn[k] ? "1" : "0");
      update();
      return;
    }
    const reset = e.target.closest(".reset-edit");
    if (reset) {
      e.preventDefault();
      delete edits[reset.dataset.seg];
      update();
      return;
    }
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const text = btn.id === "copyAll" ? visibleStatements().join("\n") : btn.closest(".seg-card").querySelector(".statement").innerText.trim();
    const ok = await copyText(text);
    const orig = btn.dataset.label || btn.textContent;
    btn.dataset.label = orig;
    btn.textContent = ok ? "Copied ✓" : "Copy failed — select the text manually";
    setTimeout(() => (btn.textContent = orig), 1500);
  });

  function onFormEvent(e) {
    const t = e.target;
    // editing a statement: remember the edit, don't re-render (keeps the cursor)
    if (t.classList && t.classList.contains("statement")) {
      if (e.type !== "input") return;
      const seg = t.dataset.seg;
      const basis = decodeURIComponent(t.dataset.basis);
      const text = t.innerText;
      if (text.trim() === basis) delete edits[seg];
      else edits[seg] = { basis, text };
      t.closest(".seg-card").querySelector(".edited-flag").hidden = !edits[seg];
      return;
    }
    // choosing the report reference on a card
    if (t.type === "radio" && t.name && t.name.startsWith("ref-")) {
      if (e.type !== "change") return;
      cardRef[t.name.slice(4)] = t.value;
      store.set("reportRef", t.value); // becomes the starting choice for the next patient
      update();
      return;
    }
    update();
  }
  $("aortaForm").addEventListener("input", onFormEvent);
  $("aortaForm").addEventListener("change", onFormEvent);
  $("aortaForm").addEventListener("submit", (e) => e.preventDefault());

  // Enter in a statement shouldn't add line breaks
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList && e.target.classList.contains("statement")) {
      e.preventDefault();
      e.target.blur();
    }
  });

  $("heightCm").addEventListener("input", () => {
    if ($("heightCm").value !== "") {
      $("heightFeet").value = "";
      $("heightInches").value = "";
    }
  });
  ["heightFeet", "heightInches"].forEach((id) =>
    $(id).addEventListener("input", () => {
      if ($(id).value !== "") $("heightCm").value = "";
    })
  );

  $("clearBtn").addEventListener("click", () => {
    ["heightCm", "heightFeet", "heightInches"].concat(BASE_SEGMENTS, CUSP_SEGMENTS).forEach((id) => ($(id).value = ""));
    resetPatient();
    update();
    $("heightCm").focus();
  });

  // diagram open/closed (open by default; remembered)
  if (store.get("diagramOpen") === "0") $("diagram").open = false;
  $("diagram").addEventListener("toggle", () => store.set("diagramOpen", $("diagram").open ? "1" : "0"));

  update();
})();
