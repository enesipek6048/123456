/* =========================================
   MEKTUP — yazı + küçük çizim, kaydet (Vercel Blob)
========================================= */

const area = document.getElementById("letterText");
const saveBtn = document.getElementById("letterSave");
const statusEl = document.getElementById("letterStatus");

const canvas = document.getElementById("padCanvas");
const clearBtn = document.getElementById("padClear");
const ctx = canvas.getContext("2d");

const INK = "#2a2327";
const PAD_H = 240;


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

async function loadText() {
    try {
        const res = await fetch("/api/letter");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.text === "string") area.value = data.text;
    } catch (_) {}
}

async function loadDrawing() {
    try {
        const res = await fetch("/api/drawing");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.url) return;
        await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const cssW = canvas.getBoundingClientRect().width || 620;
                ctx.drawImage(img, 0, 0, cssW, PAD_H);
                resolve();
            };
            img.onerror = resolve;
            img.src = data.url;
        });
    } catch (_) {}
}


/* ---------- Kaydet ---------- */

async function save() {
    saveBtn.disabled = true;
    statusEl.textContent = "Kaydediliyor…";
    try {
        const results = await Promise.allSettled([
            fetch("/api/letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: area.value }),
            }),
            fetch("/api/drawing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataUrl: canvas.toDataURL("image/png") }),
            }),
        ]);

        const failed = results.filter(
            (r) => r.status === "rejected" || !r.value.ok
        );
        if (failed.length) throw new Error("Bir kısmı kaydedilemedi.");

        statusEl.textContent = "Kaydedildi ✓";
        setTimeout(() => {
            statusEl.textContent = "";
        }, 2500);
    } catch (err) {
        statusEl.textContent = "Hata: " + err.message;
    } finally {
        saveBtn.disabled = false;
    }
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
