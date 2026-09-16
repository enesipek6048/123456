/* =========================================
   GALERİ — lightbox + fotoğraf/video yükleme
   Fotoğraflar: sunucu (Vercel Blob) varsa oraya,
   yoksa bu cihazın tarayıcısına kaydedilir.
   Videolar: doğrudan Vercel Blob'a yüklenir.
========================================= */

const grid = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxVideo = document.getElementById("lightboxVideo");
const lightboxDownloadBtn = document.getElementById("lightboxDownload");
const lightboxDeleteBtn = document.getElementById("lightboxDelete");
const addBtn = document.getElementById("galleryAdd");
const fileInput = document.getElementById("photoInput");
const addVideoBtn = document.getElementById("galleryAddVideo");
const videoInput = document.getElementById("videoInput");
const statusEl = document.getElementById("galleryStatus");

const LS_PHOTOS = "ezel_gallery_photos";
const BLOB_CLIENT = "https://esm.sh/@vercel/blob@2.8.0/client";

function isVideo(src) {
    return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(src);
}

// Karenin asıl adresi (video karelerinde küçük resim için #t eklenir).
function srcOf(fig) {
    return fig.dataset.src || fig.querySelector("img").src;
}

function flash(text, ms) {
    statusEl.textContent = text;
    setTimeout(() => {
        if (statusEl.textContent === text) statusEl.textContent = "";
    }, ms);
}


/* ---------- İndirme ---------- */

function filenameFromSrc(src) {
    try {
        const path = new URL(src, location.href).pathname;
        const name = path.split("/").pop();
        if (name && /\.(jpe?g|png|webp|mp4|mov|webm|m4v)$/i.test(name)) return name;
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
    btn.setAttribute("aria-label", "İndir");
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
    const fig = e.target.closest("figure");
    if (!fig || fig.classList.contains("pending")) return;
    const src = srcOf(fig);
    openFigure = fig;

    if (isVideo(src)) {
        lightboxImg.hidden = true;
        lightboxVideo.hidden = false;
        lightboxVideo.src = src;
        lightboxVideo.play().catch(() => {});
    } else {
        lightboxVideo.hidden = true;
        lightboxImg.hidden = false;
        lightboxImg.src = src;
        lightboxImg.alt = "Kare";
    }
    lightboxDeleteBtn.hidden = !isDeletable(src);
    lightbox.hidden = false;
});

function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();
    openFigure = null;
}

lightbox.addEventListener("click", closeLightbox);
// Video kontrollerine dokunmak lightbox'ı kapatmasın.
lightboxVideo.addEventListener("click", (e) => e.stopPropagation());
lightboxDownloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!openFigure) return;
    const src = srcOf(openFigure);
    downloadImage(src, filenameFromSrc(src));
});
lightboxDeleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const fig = openFigure;
    if (!fig) return;
    const src = srcOf(fig);
    const what = isVideo(src) ? "video" : "fotoğraf";
    if (!confirm(`Bu ${what} galeriden silinsin mi?`)) return;

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
        flash("Silindi ✓", 2500);
    } catch (_) {
        alert("Silinemedi, tekrar dene.");
    } finally {
        lightboxDeleteBtn.disabled = false;
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
});


/* ---------- Yüklenmiş fotoğraf/videoları getir ---------- */

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

function setFigureSrc(fig, src) {
    fig.dataset.src = src;
    const video = fig.querySelector("video");
    if (video) video.src = src + "#t=0.1";
    else fig.querySelector("img").src = src;
}

function addFigure(src, pending, kind) {
    const fig = document.createElement("figure");
    if (pending) fig.className = "pending";
    fig.dataset.src = src;

    if (kind === "video" || isVideo(src)) {
        fig.classList.add("is-video");
        const video = document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        // #t: iPhone'da ilk kareyi küçük resim olarak göstersin.
        video.src = pending ? src : src + "#t=0.1";
        fig.appendChild(video);
        const badge = document.createElement("span");
        badge.className = "play-badge";
        badge.textContent = "▶";
        fig.appendChild(badge);
    } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Kare";
        img.loading = "lazy";
        fig.appendChild(img);
    }

    fig.appendChild(makeDownloadBtn(() => fig.dataset.src));
    grid.appendChild(fig);
    return fig;
}


/* ---------- Fotoğraf yükleme ---------- */

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
            setFigureSrc(fig, out.url);
            flash("Eklendi ✓", 2500);
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
        flash("Bu cihaza kaydedildi.", 3000);
    } catch (_) {
        fig.remove();
        statusEl.textContent =
            "Bu cihazın deposu dolu — daha fazla fotoğraf eklenemiyor.";
    }
});


/* ---------- Video yükleme ---------- */

const VIDEO_TYPES = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/x-m4v": "m4v",
};

addVideoBtn.addEventListener("click", () => videoInput.click());

videoInput.addEventListener("change", async () => {
    const file = videoInput.files && videoInput.files[0];
    videoInput.value = "";
    if (!file) return;

    const nameExt = (file.name.split(".").pop() || "").toLowerCase();
    const ext = VIDEO_TYPES[file.type] || (["mp4", "mov", "webm", "m4v"].includes(nameExt) ? nameExt : null);
    if (!ext) {
        statusEl.textContent = "Bu video biçimi desteklenmiyor (MP4, MOV veya WebM seç).";
        return;
    }
    if (file.size > 300 * 1024 * 1024) {
        statusEl.textContent = "Video çok büyük (300 MB sınırı).";
        return;
    }

    const preview = URL.createObjectURL(file);
    const fig = addFigure(preview, true, "video");
    addVideoBtn.disabled = true;
    statusEl.textContent = "Video yükleniyor… %0";

    try {
        const { upload } = await import(BLOB_CLIENT);
        const blob = await upload(`gallery/video-${Date.now()}.${ext}`, file, {
            access: "public",
            handleUploadUrl: "/api/video-upload",
            contentType: file.type || undefined,
            multipart: file.size > 20 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => {
                statusEl.textContent = `Video yükleniyor… %${Math.round(percentage)}`;
            },
        });
        fig.classList.remove("pending");
        setFigureSrc(fig, blob.url);
        flash("Video eklendi ✓", 2500);
    } catch (_) {
        fig.remove();
        statusEl.textContent = "Video yüklenemedi, internet bağlantını kontrol edip tekrar dene.";
    } finally {
        URL.revokeObjectURL(preview);
        addVideoBtn.disabled = false;
    }
});

loadUploaded();
