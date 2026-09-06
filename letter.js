/* =========================================
   MEKTUP — yazı + küçük çizim
   Sunucu (Vercel Blob) varsa oraya, yoksa
   bu cihazın tarayıcısına kaydeder.
========================================= */

const area = document.getElementById("letterText");
const saveBtn = document.getElementById("letterSave");
const statusEl = document.getElementById("letterStatus");

const canvas = document.getElementById("padCanvas");
const clearBtn = document.getElementById("padClear");
const ctx = canvas.getContext("2d");

const INK = "#2a2327";
const PAD_H = 240;

const LS_TEXT = "ezel_letter_text";
const LS_DRAW = "ezel_letter_drawing";


/* ---------- Çizim alanı ---------- */

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.getBoundingClientRect().width || 620;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(PAD_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, PAD_H);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
}

let drawing = false;
let last = null;

function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
});

function endStroke() {
    drawing = false;
    last = null;
}

canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
canvas.addEventListener("pointerleave", endStroke);

clearBtn.addEventListener("click", () => {
    const cssW = canvas.getBoundingClientRect().width || 620;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, PAD_H);
});


/* ---------- Yükle ---------- */

function drawFromUrl(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const w = canvas.getBoundingClientRect().width || 620;
            ctx.drawImage(img, 0, 0, w, PAD_H);
            resolve();
        };
        img.onerror = resolve;
        img.src = src;
    });
}

async function loadText() {
    try {
        const res = await fetch("/api/letter");
        if (res.ok) {
            const data = await res.json();
            if (typeof data.text === "string" && data.text !== "") {
                area.value = data.text;
                return;
            }
        }
    } catch (_) {}

    try {
        const t = localStorage.getItem(LS_TEXT);
        if (t != null) area.value = t;
    } catch (_) {}
}

async function loadDrawing() {
    try {
        const res = await fetch("/api/drawing");
        if (res.ok) {
            const data = await res.json();
            if (data.url) {
                await drawFromUrl(data.url);
                return;
            }
        }
    } catch (_) {}

    try {
        const d = localStorage.getItem(LS_DRAW);
        if (d) await drawFromUrl(d);
    } catch (_) {}
}


/* ---------- Kaydet ---------- */

async function save() {
    saveBtn.disabled = true;
    statusEl.textContent = "Kaydediliyor…";

    const text = area.value;
    const drawingData = canvas.toDataURL("image/png");

    // 1) Her hâlükârda bu cihaza yaz — böylece "hiçbir şey olmuyor" olmaz.
    let localOk = true;
    try {
        localStorage.setItem(LS_TEXT, text);
        localStorage.setItem(LS_DRAW, drawingData);
    } catch (_) {
        localOk = false;
    }

    // 2) Sunucuya (Vercel Blob) göndermeyi dene.
    let serverOk = false;
    try {
        const [r1, r2] = await Promise.all([
            fetch("/api/letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            }),
            fetch("/api/drawing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataUrl: drawingData }),
            }),
        ]);
        serverOk = r1.ok && r2.ok;
    } catch (_) {
        serverOk = false;
    }

    saveBtn.disabled = false;

    if (serverOk) {
        statusEl.textContent = "Kaydedildi ✓";
    } else if (localOk) {
        statusEl.textContent = "Bu cihaza kaydedildi.";
    } else {
        statusEl.textContent = "Kaydedilemedi.";
    }
    setTimeout(() => {
        statusEl.textContent = "";
    }, 4000);
}

saveBtn.addEventListener("click", save);

document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
    }
});


/* ---------- Başlat ---------- */

setupCanvas();
loadText();
loadDrawing();
