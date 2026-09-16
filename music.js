/* =========================================
   ARKA PLAN MÜZİĞİ (girişten sonraki sayfalar)
   - Döngüde çalar, sayfa değişince kaldığı yerden devam eder.
   - Tarayıcı otomatik sesi engellerse ilk dokunuşta başlar.
   - Sesli bir video açılınca susar, kapanınca devam eder.
========================================= */

(function () {
    const TIME_KEY = "muzik-zaman";
    const MUTE_KEY = "muzik-kapali";

    function read(key) {
        try { return sessionStorage.getItem(key); } catch (e) { return null; }
    }
    function write(key, value) {
        try { sessionStorage.setItem(key, value); } catch (e) {}
    }

    const audio = new Audio("giris-muzik.m4a");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.7;

    const savedTime = parseFloat(read(TIME_KEY));
    if (savedTime > 0) {
        audio.addEventListener("loadedmetadata", function () {
            audio.currentTime = savedTime % (audio.duration || savedTime + 1);
        }, { once: true });
    }

    let muted = read(MUTE_KEY) === "1";
    let pausedForVideo = false;

    /* Aç / kapat butonu */
    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.cssText =
        "position:fixed;right:16px;bottom:16px;z-index:9999;width:42px;height:42px;" +
        "border-radius:50%;border:1px solid rgba(255,255,255,.35);" +
        "background:rgba(20,20,20,.45);color:#fff;font-size:18px;line-height:1;" +
        "cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);";
    document.body.appendChild(btn);

    function render() {
        btn.textContent = muted ? "🔇" : "🔊";
        btn.setAttribute("aria-label", muted ? "Müziği aç" : "Müziği kapat");
    }

    function tryPlay() {
        if (muted || pausedForVideo) return;
        audio.play().catch(function () {});
    }

    btn.addEventListener("click", function (e) {
        e.stopPropagation();
        muted = !muted;
        write(MUTE_KEY, muted ? "1" : "0");
        render();
        if (muted) audio.pause(); else tryPlay();
    });

    /* Otomatik çalma engellenirse ilk etkileşimde başlat */
    function unlock() {
        tryPlay();
        if (!audio.paused || muted) {
            ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
                document.removeEventListener(t, unlock, true);
            });
        }
    }
    ["pointerdown", "keydown", "touchstart"].forEach(function (t) {
        document.addEventListener(t, unlock, true);
    });

    /* Sesli video çalarken müziği sustur */
    document.addEventListener("play", function (e) {
        const v = e.target;
        if (v instanceof HTMLVideoElement && !v.muted) {
            pausedForVideo = true;
            audio.pause();
        }
    }, true);
    document.addEventListener("pause", function (e) {
        if (e.target instanceof HTMLVideoElement && pausedForVideo) {
            pausedForVideo = false;
            tryPlay();
        }
    }, true);

    /* Sayfadan çıkarken konumu kaydet */
    window.addEventListener("pagehide", function () {
        write(TIME_KEY, String(audio.currentTime));
    });

    render();
    tryPlay();
})();
