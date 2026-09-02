/* =========================================
   LOGIN SETTINGS
========================================= */

// BURADAN GİRİŞ BİLGİLERİNİ DEĞİŞTİREBİLİRSİN
// NOT: Bu istemci tarafı bir kontroldür, gerçek güvenlik sağlamaz.

const correctUsername = "ezel";
const correctPassword = "123456";


/* =========================================
   ELEMENTS
========================================= */

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = loginForm.querySelector(".login-button");


/* =========================================
   ERROR MESSAGE (dinamik olarak eklenir,
   tasarıma dokunmadan)
========================================= */

const errorMessage = document.createElement("p");
errorMessage.id = "errorMessage";
errorMessage.style.cssText =
    "display:none;margin:14px 2px -6px;font-size:12px;line-height:1.4;" +
    "color:#ffe1e8;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.4);";
loginForm.insertBefore(errorMessage, loginButton);


/* =========================================
   REMOVE ERROR WHILE TYPING
========================================= */

[usernameInput, passwordInput].forEach((el) => {
    el.addEventListener("input", () => {
        errorMessage.style.display = "none";
    });
});


/* =========================================
   PLACEHOLDER LINKS (Şifremi Unuttum / Kaydolun)
========================================= */

loginForm.querySelectorAll('a[href="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        showError("Bu bölüm henüz hazır değil.");
    });
});


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        showError("Lütfen kullanıcı adı ve şifreyi gir.");
        return;
    }

    if (
        username.toLowerCase() === correctUsername.toLowerCase() &&
        password === correctPassword
    ) {
        successfulLogin();
    } else {
        showError("Kullanıcı adı veya şifre yanlış.");
    }

});


/* =========================================
   ERROR
========================================= */

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}


/* =========================================
   SUCCESSFUL LOGIN
========================================= */

function successfulLogin() {
    loginButton.disabled = true;
    loginButton.textContent = "Giriş yapılıyor…";
    loginButton.style.opacity = "0.85";
    loginButton.style.cursor = "default";

    setTimeout(() => {
        window.location.href = "home.html";
    }, 900);
}
