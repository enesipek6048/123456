/* =========================================
   PAPATYA FALI
========================================= */

const yapraklar = document.querySelectorAll(".yaprak");
const mesaj = document.getElementById("fal-mesaji");
const resetBtn = document.getElementById("papatya-reset");

const videoModal = document.getElementById("seviyorModal");
const video = document.getElementById("seviyorVideo");
const videoCloseBtn = document.getElementById("seviyorModalClose");

let seviyor = true;
let kalanYaprak = yapraklar.length;
let videoVar = true;
let videoZamanlayici = null;

// Video dosyası yoksa ya da açılamıyorsa oyun eskisi gibi devam etsin.
video.addEventListener("error", () => {
    videoVar = false;
    kapatVideo();
});

function acVideo() {
    // Hata, dinleyici eklenmeden önce de oluşmuş olabilir; durumu doğrudan da kontrol et.
    if (!videoVar || video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) return;
    videoModal.hidden = false;
    document.body.classList.add("no-scroll");
    video.currentTime = 0;
    video.muted = false;
    video.play().catch(() => {});
}

function kapatVideo() {
    clearTimeout(videoZamanlayici);
    videoModal.hidden = true;
    document.body.classList.remove("no-scroll");
    video.pause();
}

videoCloseBtn.addEventListener("click", kapatVideo);
videoModal.addEventListener("click", (e) => {
    if (e.target === videoModal) kapatVideo();
});
video.addEventListener("ended", kapatVideo);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !videoModal.hidden) kapatVideo();
});

yapraklar.forEach((yaprak) => {
    yaprak.addEventListener("click", function () {
        if (this.classList.contains("koparildi")) return;

        this.classList.add("koparildi");
        kalanYaprak--;

        if (kalanYaprak === 0) {
            // Sonuç %50 ihtimalle SEVİYOR, %50 ihtimalle SEVMİYOR
            const sonucSeviyor = Math.random() < 0.5;
            mesaj.innerHTML = sonucSeviyor
                ? "<span style='color:#2e7d32'>Sonuç: SEVİYOR! ❤️</span>"
                : "<span style='color:#c62828'>Sonuç: SEVMİYOR 💔</span>";

            // Seviyor çıkarsa sonucu bir an gösterip özel videoyu aç.
            if (sonucSeviyor) videoZamanlayici = setTimeout(acVideo, 1200);
        } else {
            mesaj.textContent = seviyor ? "Seviyor..." : "Sevmiyor...";
        }

        seviyor = !seviyor;
    });
});

resetBtn.addEventListener("click", () => {
    kapatVideo();
    yapraklar.forEach((y) => y.classList.remove("koparildi"));
    seviyor = true;
    kalanYaprak = yapraklar.length;
    mesaj.textContent = "Bir yaprak kopar!";
});
