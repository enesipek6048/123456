/* =========================================
   GALERİ — lightbox + fotoğraf yükleme
   Sunucu (Vercel Blob) varsa oraya, yoksa
   bu cihazın tarayıcısına kaydeder.
========================================= */

const grid = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxDownloadBtn = document.getElementById("lightboxDownload");
const lightboxDeleteBtn = document.getElementById("lightboxDelete");
const addBtn = document.getElementById("galleryAdd");
const fileInput = document.getElementById("photoInput");
const statusEl = document.getElementById("galleryStatus");

const LS_PHOTOS = "ezel_gallery_photos";


/* ---------- İndirme ---------- */

function filenameFromSrc(src) {
    try {
        const path = new URL(src, location.href).pathname;
        const name = path.split("/").pop();
        if (name && /\.(jpe?g|png|webp)$/i.test(name)) return name;
    } catch (_) {
        // yoksay
    }
    return `ezel-foto-${Date.now()}.jpg`;
}

async function downloadImage(src, filename) {
    try {
        const res = await fetch(src, { mode: "cors" });
        if (!res.ok) throw new Error("fetch-failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (_) {
        // CORS vb. engellerse en azından yeni sekmede aç.
        window.open(src, "_blank");
    }
}

function makeDownloadBtn(getSrc) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dl-btn";
    btn.setAttribute("aria-label", "Fotoğrafı indir");
    btn.textContent = "⬇";
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const src = getSrc();
        downloadImage(src, filenameFromSrc(src));
    });
    return btn;
}

// Sayfada hazır duran (yüklemeden önceki) karelere de indir butonu ekle.
document.querySelectorAll("#gallery figure").forEach((fig) => {
    const img = fig.querySelector("img");
    if (img) fig.appendChild(makeDownloadBtn(() => img.src));
});


/* ---------- Lightbox ---------- */

let openFigure = null;

// Sadece sonradan yüklenenler silinebilir (sunucu blob'u veya bu cihazdaki kopya).
function isServerPhoto(src) {
    return /^https:\/\/[^/]+\.blob\.vercel-storage\.com\/gallery\//.test(src);
}

function isDeletable(src) {
    return isServerPhoto(src) || src.startsWith("data:");
}

grid.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    openFigure = img.closest("figure");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxDeleteBtn.hidden = !isDeletable(img.src) || openFigure.classList.contains("pending");
    lightbox.hidden = false;
});

function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    openFigure = null;
}

lightbox.addEventListener("click", closeLightbox);
lightboxDownloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    downloadImage(lightboxImg.src, filenameFromSrc(lightboxImg.src));
});
lightboxDeleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const fig = openFigure;
    const src = lightboxImg.src;
    if (!fig || !confirm("Bu fotoğraf galeriden silinsin mi?")) return;

    lightboxDeleteBtn.disabled = true;
    try {
        if (isServerPhoto(src)) {
            const res = await fetch("/api/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: src }),
            });
            if (!res.ok) throw new Error("delete-failed");
        } else {
            writeLocalPhotos(readLocalPhotos().filter((p) => p !== src));
        }
        fig.remove();
        closeLightbox();
        statusEl.textContent = "Silindi ✓";
        setTimeout(() => (statusEl.textContent = ""), 2500);
    } catch (_) {
        alert("Silinemedi, tekrar dene.");
    } finally {
        lightboxDeleteBtn.disabled = false;
    }
});
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
    fig.appendChild(makeDownloadBtn(() => img.src));
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
