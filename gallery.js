/* =========================================
   GALERİ — lightbox + fotoğraf yükleme
   Sunucu (Vercel Blob) varsa oraya, yoksa
   bu cihazın tarayıcısına kaydeder.
========================================= */

const grid = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const addBtn = document.getElementById("galleryAdd");
const fileInput = document.getElementById("photoInput");
const statusEl = document.getElementById("galleryStatus");

const LS_PHOTOS = "ezel_gallery_photos";


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

function readLocalPhotos() {
    try {
        return JSON.parse(localStorage.getItem(LS_PHOTOS) || "[]");
    } catch (_) {
        return [];
    }
}

function writeLocalPhotos(arr) {
    localStorage.setItem(LS_PHOTOS, JSON.stringify(arr));
}

async function loadUploaded() {
    let serverUrls = [];
    try {
        const res = await fetch("/api/photos");
        if (res.ok) {
            const data = await res.json();
            serverUrls = (data.photos || []).map((p) => p.url);
        }
    } catch (_) {
        // Sunucu yok — sorun değil.
    }
    serverUrls.forEach((u) => addFigure(u));

    // Bu cihaza kaydedilenler
    readLocalPhotos().forEach((src) => addFigure(src));
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

    // Sunucu için büyük, tarayıcı yedeği için daha küçük sürüm.
    let dataUrl, small;
    try {
        dataUrl = await resizeImage(file, 1600, 0.82);
        small = await resizeImage(file, 1000, 0.7);
    } catch (_) {
        statusEl.textContent =
            "Bu görsel açılamadı. JPEG veya PNG seç (iPhone HEIC desteklenmiyor).";
        return;
    }

    const fig = addFigure(small, true);
    statusEl.textContent = "Kaydediliyor…";

    // 1) Sunucuya dene
    try {
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl }),
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.url) {
            fig.classList.remove("pending");
            fig.querySelector("img").src = out.url;
            statusEl.textContent = "Eklendi ✓";
            setTimeout(() => (statusEl.textContent = ""), 2500);
            return;
        }
    } catch (_) {
        // sunucu yok — yerele düş
    }

    // 2) Bu cihaza kaydet
    try {
        const arr = readLocalPhotos();
        arr.push(small);
        writeLocalPhotos(arr);
        fig.classList.remove("pending");
        statusEl.textContent = "Bu cihaza kaydedildi.";
        setTimeout(() => (statusEl.textContent = ""), 3000);
    } catch (_) {
        fig.remove();
        statusEl.textContent =
            "Bu cihazın deposu dolu — daha fazla fotoğraf eklenemiyor.";
    }
});

loadUploaded();
