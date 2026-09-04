/* =========================================
   GALERİ — lightbox + fotoğraf yükleme
========================================= */

const grid = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const addBtn = document.getElementById("galleryAdd");
const fileInput = document.getElementById("photoInput");
const statusEl = document.getElementById("galleryStatus");


/* ---------- Lightbox ---------- */

grid.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.hidden = false;
});

function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
}

lightbox.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
});


/* ---------- Yüklenmiş fotoğrafları getir ---------- */

async function loadUploaded() {
    try {
        const res = await fetch("/api/photos");
        if (!res.ok) return;
        const data = await res.json();
        (data.photos || []).forEach((p) => addFigure(p.url));
    } catch (_) {
        // Yerel statik sunucuda /api yok — sorun değil.
    }
}

function addFigure(src, pending) {
    const fig = document.createElement("figure");
    if (pending) fig.className = "pending";
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Kare";
    img.loading = "lazy";
    fig.appendChild(img);
    grid.appendChild(fig);
    return fig;
}


/* ---------- Yükleme ---------- */

function resizeImage(file, maxEdge = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            const scale = Math.min(1, maxEdge / Math.max(w, h));
            w = Math.round(w * scale);
            h = Math.round(h * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("format"));
        };
        img.src = url;
    });
}

addBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!file) return;

    statusEl.textContent = "Hazırlanıyor…";

    let dataUrl;
    try {
        dataUrl = await resizeImage(file);
    } catch (_) {
        statusEl.textContent =
            "Bu görsel açılamadı. JPEG veya PNG seç (iPhone HEIC desteklenmiyor).";
        return;
    }

    const fig = addFigure(dataUrl, true);
    statusEl.textContent = "Yükleniyor…";

    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || "Yükleme başarısız.");

        fig.classList.remove("pending");
        fig.querySelector("img").src = out.url;
        statusEl.textContent = "Eklendi ✓";
        setTimeout(() => {
            statusEl.textContent = "";
        }, 2500);
    } catch (err) {
        fig.remove();
        statusEl.textContent = "Yüklenemedi: " + err.message;
    }
});

loadUploaded();
