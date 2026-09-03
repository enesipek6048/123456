/* =========================================
   PAPATYA FALI
========================================= */

const yapraklar = document.querySelectorAll(".yaprak");
const mesaj = document.getElementById("fal-mesaji");
const resetBtn = document.getElementById("papatya-reset");

let seviyor = true;
let kalanYaprak = yapraklar.length;

yapraklar.forEach((yaprak) => {
    yaprak.addEventListener("click", function () {
        if (this.classList.contains("koparildi")) return;

        this.classList.add("koparildi");
        kalanYaprak--;

        if (kalanYaprak === 0) {
            // Sonuç %10 ihtimalle SEVİYOR, %90 ihtimalle SEVMİYOR
            const sonucSeviyor = Math.random() < 0.1;
            mesaj.innerHTML = sonucSeviyor
                ? "<span style='color:#2e7d32'>Sonuç: SEVİYOR! ❤️</span>"
                : "<span style='color:#c62828'>Sonuç: SEVMİYOR 💔</span>";
        } else {
            mesaj.textContent = seviyor ? "Seviyor..." : "Sevmiyor...";
        }

        seviyor = !seviyor;
    });
});

resetBtn.addEventListener("click", () => {
    yapraklar.forEach((y) => y.classList.remove("koparildi"));
    seviyor = true;
    kalanYaprak = yapraklar.length;
    mesaj.textContent = "Bir yaprak kopar!";
});
