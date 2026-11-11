// Dilated AF — single-page logic. Depends on data.js.
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const fmt = (x) => x.toFixed(1);
  const r1 = (x) => Math.round(x * 10) / 10;

  const TIMING_LABEL = { diastole: "end-diastole", systole: "mid-systole" };
  const CONVENTION_LABEL = { leading: "leading edge", inside: "inner edge" };
  const SEX_LABEL = { male: "male", female: "female" };
  const BASE_SEGMENTS = ["SOV", "STJ", "AAO"];
  const CUSP_SEGMENTS = ["RCOR", "LCOR", "NONCOR"];

  // ---- persistence of non-patient settings (best effort) ----
  const PREFS = ["timing", "convention", "reportRef", "includeZ"];
  function loadPrefs() {
    try {
      PREFS.forEach((k) => {
        const v = localStorage.getItem("daf." + k);
        if (v === null) return;
        const el = $(k);
        if (el.type === "checkbox") el.checked = v === "1";
        else el.value = v;
      });
    } catch (e) {}
  }
  function savePrefs() {
    try {
      PREFS.forEach((k) => {
        const el = $(k);
        localStorage.setItem("daf." + k, el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value);
      });
    } catch (e) {}
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
      reportRef: $("reportRef").value,
      includeZ: $("includeZ").checked,
    };
  }

  const waseApplies = (s) => s.timing === "diastole" && s.convention === "leading";
  const activeSegments = (s) =>
    s.timing === "diastole" && s.convention === "inside" ? BASE_SEGMENTS.concat(CUSP_SEGMENTS) : BASE_SEGMENTS;

  // ---- reference lookup ----
  // Returns { name, label, mean, sd, lln, uln } or null.
  function getRef(which, seg, s) {
    let m;
    if (which === "WASE") {
      if (!waseApplies(s) || !WASE[seg]) return null;
      m = WASE[seg][s.ageGroup][s.sex];
      return mkRef("WASE", `WASE, ${SEX_LABEL[s.sex]} ${s.ageGroup.replace("-", "–")} y, end-diastole, leading edge`, m);
    }
    const t = NORRE[s.timing][s.convention][seg];
    if (!t) return null;
    m = t[s.sex];
    return mkRef("NORRE", `NORRE, ${SEX_LABEL[s.sex]}, ${TIMING_LABEL[s.timing]}, ${CONVENTION_LABEL[s.convention]}`, m);
  }
  function mkRef(name, label, m) {
    return { name, label, mean: m.mean, sd: m.sd, lln: r1(m.mean - 2 * m.sd), uln: r1(m.mean + 2 * m.sd) };
  }

  // Which reference drives the report statement for this segment.
  function reportRefFor(seg, s) {
    if (s.reportRef === "WASE") {
      const w = getRef("WASE", seg, s);
      if (w) return w;
    }
    return getRef("NORRE", seg, s);
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

  const zText = (z) => (z >= 0 ? "+" : "−") + Math.abs(z).toFixed(1);

  function statement(seg, ev, ref, s) {
    const { noun, verb } = SEGMENTS[seg];
    const extra = `${ev.pct}% of expected` + (s.includeZ ? `; z = ${zText(ev.z)}` : "");
    let body;
    if (ev.status === "dilated") {
      body = `is dilated: ${fmt(ev.index)} mm/m (upper limit of normal ${fmt(ref.uln)} mm/m, equivalent to ${fmt(ev.ulnMm)} mm at this patient's height; ${extra})`;
    } else if (ev.status === "small") {
      body = `is small: ${fmt(ev.index)} mm/m (lower limit of normal ${fmt(ref.lln)} mm/m, equivalent to ${fmt(ev.llnMm)} mm at this patient's height; ${extra})`;
    } else {
      body = `is within normal limits: ${fmt(ev.index)} mm/m (normal range ${fmt(ref.lln)}–${fmt(ref.uln)} mm/m; ${extra})`;
    }
    body = body.replace(/^is /, verb + " ");
    return `When indexed to height, the ${noun} ${body}. Reference: ${ref.label}.`;
  }

  // ---- rendering ----
  const STATUS_LABEL = { dilated: "Dilated", small: "Small", normal: "Normal" };

  // Body of an empty card: normal range in mm at this height.
  function rangesHtml(seg, s, heightM) {
    const refs = ["NORRE", "WASE"].map((w) => getRef(w, seg, s)).filter(Boolean);
    return `<p class="ranges">Normal at ${fmt(heightM * 100)} cm: ` +
      refs.map((ref) => `${ref.name} <strong>${fmt(ref.lln * heightM)}–${fmt(ref.uln * heightM)} mm</strong>`).join(" · ") +
      `</p>`;
  }

  // Body of a measured card. Returns { summary, body, status, text }.
  function measuredHtml(seg, mm, s, heightM) {
    const refs = ["NORRE", "WASE"].map((w) => getRef(w, seg, s)).filter(Boolean);
    const rRef = reportRefFor(seg, s);
    const rEv = evaluate(mm, heightM, rRef);
    const text = statement(seg, rEv, rRef, s);

    const rows = refs
      .map((ref) => {
        const ev = evaluate(mm, heightM, ref);
        const mark = ref.name === rRef.name && refs.length > 1 ? ' <span class="muted" title="Used in report text">•</span>' : "";
        const st = ev.status === "normal" ? "" : ` class="st-${ev.status}"`;
        return `<tr>
          <th scope="row">${ref.name}${mark}</th>
          <td>${fmt(ref.mean)}<small class="muted">${fmt(ev.expectedMm)} mm</small></td>
          <td>${fmt(ref.lln)}–${fmt(ref.uln)}<small class="muted">${fmt(ev.llnMm)}–${fmt(ev.ulnMm)} mm</small></td>
          <td${st}>${ev.pct}%</td>
          <td${st}>${zText(ev.z)}</td>
        </tr>`;
      })
      .join("");

    return {
      status: rEv.status,
      text,
      summary: `<strong class="idx">${fmt(rEv.index)} mm/m</strong>
        <span class="badge ${rEv.status}">${STATUS_LABEL[rEv.status]}</span>
        <span class="muted">${rEv.pct}% of expected</span>`,
      body: `
        <div class="overflow-auto">
          <table class="seg-table">
            <thead><tr><th>Ref</th><th>Expected<small class="muted">mm/m</small></th><th>Normal range<small class="muted">mm/m</small></th><th>% exp</th><th>z</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="statement">${text}</p>
        <button type="button" class="copy-btn secondary outline" data-text="${encodeURIComponent(text)}">Copy to clipboard</button>`,
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
    savePrefs();

    // conditional UI
    const cusps = s.timing === "diastole" && s.convention === "inside";
    document.querySelectorAll(".cusp").forEach((el) => (el.hidden = !cusps));
    document.querySelectorAll("#images img").forEach((img) => {
      const key = img.dataset.show;
      img.hidden = !(key === `${s.timing}_${s.convention}` || (key === "sax" && cusps));
    });
    $("diagramLabel").textContent = `${TIMING_LABEL[s.timing]}, ${CONVENTION_LABEL[s.convention]}`;
    const waseOk = waseApplies(s);
    $("reportRef").querySelector('option[value="WASE"]').disabled = !waseOk;
    $("refNote").hidden = waseOk || s.reportRef !== "WASE";

    // height echo
    const cmTyped = !isNaN(parseFloat($("heightCm").value));
    $("heightEcho").textContent = s.heightCm && !cmTyped ? `= ${fmt(s.heightCm)} cm` : "";

    const heightOk = s.heightCm && s.heightCm >= 100 && s.heightCm <= 250;
    $("awaiting").hidden = !!heightOk;
    const heightM = heightOk ? s.heightCm / 100 : null;

    const statements = [];
    activeSegments(s).forEach((seg) => {
      if (!heightOk) return setCard(seg, null, "", "");
      const mm = parseFloat($(seg).value);
      if (isNaN(mm) || mm <= 0) return setCard(seg, null, "", rangesHtml(seg, s, heightM));
      const r = measuredHtml(seg, mm, s, heightM);
      statements.push(r.text);
      setCard(seg, r.status, r.summary, r.body);
    });

    $("copyAll").dataset.text = encodeURIComponent(statements.join("\n"));
    $("copyAllWrap").hidden = statements.length < 2;
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

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const ok = await copyText(decodeURIComponent(btn.dataset.text || ""));
    const orig = btn.dataset.label || btn.textContent;
    btn.dataset.label = orig;
    btn.textContent = ok ? "Copied ✓" : "Copy failed — select the text manually";
    setTimeout(() => (btn.textContent = orig), 1500);
  });

  // ---- wiring ----
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
  $("aortaForm").addEventListener("input", update);
  $("aortaForm").addEventListener("change", update);
  $("aortaForm").addEventListener("submit", (e) => e.preventDefault());
  $("clearBtn").addEventListener("click", () => {
    ["heightCm", "heightFeet", "heightInches"].concat(BASE_SEGMENTS, CUSP_SEGMENTS).forEach((id) => ($(id).value = ""));
    update();
    $("heightCm").focus();
  });

  // diagram open/closed (open by default; remembered)
  try {
    if (localStorage.getItem("daf.diagramOpen") === "0") $("diagram").open = false;
  } catch (e) {}
  $("diagram").addEventListener("toggle", () => {
    try {
      localStorage.setItem("daf.diagramOpen", $("diagram").open ? "1" : "0");
    } catch (e) {}
  });

  loadPrefs();
  update();
})();
