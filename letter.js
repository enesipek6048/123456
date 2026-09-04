/* =========================================
   MEKTUP — yaz ve kaydet (Vercel Blob)
========================================= */

const area = document.getElementById("letterText");
const saveBtn = document.getElementById("letterSave");
const statusEl = document.getElementById("letterStatus");

async function load() {
    try {
        const res = await fetch("/api/letter");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.text === "string") area.value = data.text;
    } catch (_) {
        // Yerel statik sunucuda /api yok.
    }
}

async function save() {
    saveBtn.disabled = true;
    statusEl.textContent = "Kaydediliyor…";
    try {
        const res = await fetch("/api/letter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: area.value }),
        });
        if (!res.ok) {
            const out = await res.json().catch(() => ({}));
            throw new Error(out.error || "Kaydedilemedi.");
        }
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

load();
