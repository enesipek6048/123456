/* =========================================
   ACCORDION GALLERY
   Referans "gallery-modal-accordion.tsx" (motion/react + next/image)
   bileşeninin bağımlılıksız, vanilla JS uyarlaması.
========================================= */

// Görseller + fotoğrafın üstünde görünecek başlıklar
const ACC_ITEMS = [
    {
        url: "https://images.unsplash.com/photo-1709949908058-a08659bfa922?q=80&w=1200&auto=format",
        title: "Sisli Dağların Görkemi",
        description:
            "Bulutların arasından yükselen sisli dağlar; gerçeküstü bir manzara.",
    },
    {
        url: "https://images.unsplash.com/photo-1548192746-dd526f154ed9?q=80&w=1200&auto=format",
        title: "Kış Diyarı",
        description:
            "Karla kaplı ağaçlar ve dağlarla dingin bir kış sahnesi.",
    },
    {
        url: "https://images.unsplash.com/photo-1693581176773-a5f2362209e6?q=80&w=1200&auto=format",
        title: "Sonbahar Sığınağı",
        description:
            "Dağların arasına saklanmış, sonbaharın canlı renkleriyle çevrili bir kulübe.",
    },
    {
        url: "https://images.unsplash.com/photo-1584043204475-8cc101d6c77a?q=80&w=1200&auto=format",
        title: "Sakin Gölün Yansıması",
        description:
            "Zirveleri ve gökyüzünü ayna gibi yansıtan sakin bir dağ gölü.",
    },
    {
        url: "https://images.unsplash.com/photo-1518599904199-0ca897819ddb?q=80&w=1200&auto=format",
        title: "Altın Saatin Işıltısı",
        description:
            "Altın saatin sıcak ışığında yıkanan, her hattı belirginleşen bir dağ manzarası.",
    },
    {
        url: "https://images.unsplash.com/photo-1706049379414-437ec3a54e93?q=80&w=1200&auto=format",
        title: "Karlı Dağ Yolu",
        description:
            "Karlı bir dağ manzarasını yaran, maceraya çağıran kıvrımlı bir yol.",
    },
    {
        url: "https://images.unsplash.com/photo-1709949908219-fd9046282019?q=80&w=1200&auto=format",
        title: "Sisli Orman",
        description:
            "Sise bürünmüş, ardında dağların yükseldiği gizemli bir orman.",
    },
    {
        url: "https://images.unsplash.com/photo-1508873881324-c92a3fc536ba?q=80&w=1200&auto=format",
        title: "Gün Batımı Silüeti",
        description:
            "Canlı bir gün batımı göğüne karşı dağ zirvelerinin dramatik silüeti.",
    },
    {
        url: "https://images.unsplash.com/photo-1462989856370-729a9c1e2c91?q=80&w=1200&auto=format",
        title: "Alp Çayırı",
        description:
            "Yüksek zirvelerin önünde, kır çiçekleriyle bezenmiş yemyeşil bir alp çayırı.",
    },
    {
        url: "https://images.unsplash.com/photo-1475727946784-2890c8fdb9c8?q=80&w=1200&auto=format",
        title: "Göl Kıyısında Huzur",
        description:
            "Çam ormanlarıyla çevrili, vahşi doğanın dinginliğini yansıtan bir dağ gölü.",
    },
];

const accGallery = document.getElementById("accGallery");
const accModal = document.getElementById("accModal");
const accModalImg = document.getElementById("accModalImg");
const accModalTitle = document.getElementById("accModalTitle");
const accModalDesc = document.getElementById("accModalDesc");

// Referans bileşendeki başlangıç davranışı: ortadaki kare açık
let activeIndex = Math.min(5, ACC_ITEMS.length - 1);

function renderGallery() {
    accGallery.innerHTML = "";

    ACC_ITEMS.forEach((item, i) => {
        const el = document.createElement("div");
        el.className = "acc-item" + (i === activeIndex ? " is-active" : "");
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", item.title);

        const img = document.createElement("img");
        img.src = item.url;
        img.alt = item.title;
        img.loading = "lazy";

        const caption = document.createElement("span");
        caption.className = "acc-caption";
        caption.textContent = item.title;

        el.append(img, caption);

        el.addEventListener("mouseenter", () => setActive(i));
        el.addEventListener("focus", () => setActive(i));
        el.addEventListener("click", () => openModal(i));
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openModal(i);
            }
        });

        accGallery.appendChild(el);
    });
}

function setActive(i) {
    activeIndex = i;
    Array.from(accGallery.children).forEach((child, idx) => {
        child.classList.toggle("is-active", idx === i);
    });
}

function openModal(i) {
    const item = ACC_ITEMS[i];
    accModalImg.src = item.url;
    accModalImg.alt = item.title;
    accModalTitle.textContent = item.title;
    accModalDesc.textContent = item.description;
    accModal.hidden = false;
    document.body.classList.add("no-scroll");
}

function closeModal() {
    accModal.hidden = true;
    document.body.classList.remove("no-scroll");
}

accModal.addEventListener("click", (e) => {
    // Sadece arka plana tıklanınca kapat, karta tıklanınca kapanma
    if (e.target === accModal) closeModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

renderGallery();
