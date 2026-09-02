/* =========================================
   ARKA PLAN VİDEOSU — YouTube IFrame API
========================================= */

// Sadece autoplay=1 parametresine güvenmek yerine videoyu
// API üzerinden başlatıyoruz; böylece "duraklatıldı" durumunda
// YouTube'un ortaya koyduğu oynat/duraklat/ileri-geri simgeleri
// hiç görünmüyor.

const BG_VIDEO_ID = "K0dkdCmodo4";
const BG_PLAYBACK_RATE = 0.275; // önceki %25'ten %10 daha hızlı

// Video sadece bu aralığı döngüde oynatsın:
const BG_LOOP_START = 0;         // saniye
const BG_LOOP_SECONDS = 4;       // tam 4 saniyelik döngü

// Mümkün olan en yüksek kaliteyi iste (YouTube üzerine yazabilir).
function forceHighQuality(player) {
    try {
        const levels = player.getAvailableQualityLevels
            ? player.getAvailableQualityLevels()
            : [];
        // Liste yüksekten düşüğe sıralı gelir: ["hd1080","hd720","large",...]
        player.setPlaybackQuality(levels.length ? levels[0] : "hd1080");
    } catch (e) {
        /* yoksay */
    }
}

function onYouTubeIframeAPIReady() {

    new YT.Player("bgPlayer", {

        videoId: BG_VIDEO_ID,

        playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: BG_VIDEO_ID,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            start: BG_LOOP_START,
        },

        events: {

            onReady: (event) => {
                event.target.mute();
                event.target.setPlaybackRate(BG_PLAYBACK_RATE);
                event.target.seekTo(BG_LOOP_START, true);
                event.target.playVideo();
                forceHighQuality(event.target);

                // Tam 4 saniyede bir başa sar (oynatma hızından bağımsız,
                // getCurrentTime her zaman gerçek video saniyesini verir).
                setInterval(() => {
                    const t = event.target.getCurrentTime();
                    if (t >= BG_LOOP_START + BG_LOOP_SECONDS || t < BG_LOOP_START) {
                        event.target.seekTo(BG_LOOP_START, true);
                        forceHighQuality(event.target);
                    }
                }, 120);
            },

            onStateChange: (event) => {
                // Video bir şekilde sonuna gelirse başa sar.
                if (event.data === YT.PlayerState.ENDED) {
                    event.target.seekTo(BG_LOOP_START, true);
                    event.target.playVideo();
                }

                // Her yeniden başlamada hız sıfırlanabiliyor, tekrar sabitle.
                if (event.data === YT.PlayerState.PLAYING) {
                    event.target.setPlaybackRate(BG_PLAYBACK_RATE);
                    forceHighQuality(event.target);
                }
            },

            onPlaybackQualityChange: (event) => {
                // YouTube kaliteyi düşürürse bir kez daha yükseğe çekmeyi dene.
                if (["small", "medium", "large"].includes(event.data)) {
                    forceHighQuality(event.target);
                }
            },

        },

    });

}
