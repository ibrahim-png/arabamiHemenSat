"use strict";

const form = document.getElementById("basvuruForm");

const telefonInput = document.getElementById("telefonno");
const markaSelect = document.getElementById("marka");
const tipSelect = document.getElementById("tip");
const yilInput = document.getElementById("yil");
const kmInput = document.getElementById("km");
const vitesSelect = document.getElementById("vites");
const yakitSelect = document.getElementById("yakit");
const ilSelect = document.getElementById("il");

const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");

const alanAdlari = [
    "telefonno",
    "marka",
    "tip",
    "yil",
    "km",
    "vites",
    "yakit",
    "il"
];

/* =========================================================
   SAYFA AÇILIŞI
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    yilInput.max = new Date().getFullYear() + 1;

    hataTemizlemeOlaylariniEkle();

    await Promise.all([
        markalariYukle(),
        secenekleriYukle()
    ]);
});

/* =========================================================
   MARKA DEĞİŞİKLİĞİ
   ========================================================= */

markaSelect.addEventListener("change", async () => {
    hataTemizle("marka");
    hataTemizle("tip");

    tipSelect.disabled = true;
    tipSelect.innerHTML =
        '<option value="">Önce marka seçiniz</option>';

    if (!markaSelect.value) {
        return;
    }

    await tipleriYukle(markaSelect.value);
});

/* =========================================================
   FORM GÖNDERME
   ========================================================= */

form.addEventListener("submit", async event => {
    event.preventDefault();

    mesajGizle();

    if (!formuDogrula()) {
        ilkHataliAlanaGit();
        return;
    }

    const basvuru = {
        telefonno: telefonInput.value.trim(),
        marka: markaSelect.value,
        tip: tipSelect.value,
        yil: Number(yilInput.value),
        km: Number(kmInput.value),
        vites: vitesSelect.value,
        yakit: yakitSelect.value,
        il: ilSelect.value
    };

    yukleniyorAyarla(true);

    try {
        const response = await fetch("/api/basvurular", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(basvuru)
        });

        const sonuc = await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message || "Başvuru kaydedilemedi."
            );
        }

        mesajGoster(
            `Başvurunuz kaydedildi.\nBaşvuru numarası: ${sonuc.data.guid}`,
            "success"
        );

        form.reset();
        tumHatalariTemizle();

        tipSelect.disabled = true;
        tipSelect.innerHTML =
            '<option value="">Önce marka seçiniz</option>';
    } catch (error) {
        console.error(error);

        mesajGoster(
            error.message || "Beklenmeyen bir hata oluştu.",
            "error"
        );
    } finally {
        yukleniyorAyarla(false);
    }
});

/* =========================================================
   MARKALARI YÜKLEME
   ========================================================= */

async function markalariYukle() {
    try {
        const response = await fetch("/api/markalar");
        const sonuc = await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message || "Markalar alınamadı."
            );
        }

        markaSelect.innerHTML =
            '<option value="">Araç markasını seçiniz</option>';

        sonuc.data.forEach(marka => {
            markaSelect.appendChild(
                optionOlustur(marka)
            );
        });

        markaSelect.disabled = false;
    } catch (error) {
        console.error(error);

        markaSelect.innerHTML =
            '<option value="">Markalar yüklenemedi</option>';

        markaSelect.disabled = true;

        mesajGoster(
            "Markalar yüklenemedi.",
            "error"
        );
    }
}

/* =========================================================
   ARAÇ TİPLERİNİ YÜKLEME
   ========================================================= */

async function tipleriYukle(marka) {
    tipSelect.innerHTML =
        '<option value="">Araç tipleri yükleniyor...</option>';

    try {
        const response = await fetch(
            `/api/tipler?marka=${encodeURIComponent(marka)}`
        );

        const sonuc = await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message || "Araç tipleri alınamadı."
            );
        }

        tipSelect.innerHTML =
            '<option value="">Araç tipini seçiniz</option>';

        sonuc.data.forEach(tip => {
            tipSelect.appendChild(
                optionOlustur(tip)
            );
        });

        tipSelect.disabled = false;
    } catch (error) {
        console.error(error);

        tipSelect.innerHTML =
            '<option value="">Araç tipleri yüklenemedi</option>';

        tipSelect.disabled = true;

        mesajGoster(
            "Araç tipleri yüklenemedi.",
            "error"
        );
    }
}

/* =========================================================
   FORM SEÇENEKLERİNİ YÜKLEME
   ========================================================= */

async function secenekleriYukle() {
    try {
        const response = await fetch("/api/form-secenekleri");
        const sonuc = await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message || "Form seçenekleri alınamadı."
            );
        }

        selectDoldur(
            ilSelect,
            "Bulunduğunuz ili seçiniz",
            sonuc.data.iller
        );

        selectDoldur(
            vitesSelect,
            "Vites türünü seçiniz",
            sonuc.data.vitesTurleri
        );

        selectDoldur(
            yakitSelect,
            "Yakıt türünü seçiniz",
            sonuc.data.yakitTurleri
        );
    } catch (error) {
        console.error(error);

        mesajGoster(
            "Form seçenekleri yüklenemedi.",
            "error"
        );
    }
}

/* =========================================================
   SELECT YARDIMCI FONKSİYONLARI
   ========================================================= */

function selectDoldur(select, ilkSecenek, liste) {
    select.innerHTML =
        `<option value="">${ilkSecenek}</option>`;

    liste.forEach(deger => {
        select.appendChild(
            optionOlustur(deger)
        );
    });

    select.disabled = false;
}

function optionOlustur(deger) {
    const option = document.createElement("option");

    option.value = deger;
    option.textContent = deger;

    return option;
}

/* =========================================================
   FORM DOĞRULAMA
   ========================================================= */

function formuDogrula() {
    tumHatalariTemizle();

    let gecerli = true;

    const telefon = telefonInput.value.replace(/\D/g, "");
    const yil = Number(yilInput.value);
    const enBuyukYil = new Date().getFullYear() + 1;

    if (telefon.length !== 10 && telefon.length !== 11) {
        hataGoster(
            "telefonno",
            "Telefon numarası 10 veya 11 haneli olmalıdır."
        );

        gecerli = false;
    }

    if (!markaSelect.value) {
        hataGoster(
            "marka",
            "Marka seçiniz."
        );

        gecerli = false;
    }

    if (!tipSelect.value) {
        hataGoster(
            "tip",
            "Araç tipi seçiniz."
        );

        gecerli = false;
    }

    if (
        yilInput.value === "" ||
        yil < 1900 ||
        yil > enBuyukYil
    ) {
        hataGoster(
            "yil",
            `Model yılı 1900 ile ${enBuyukYil} arasında olmalıdır.`
        );

        gecerli = false;
    }

    if (
        kmInput.value === "" ||
        Number(kmInput.value) < 0
    ) {
        hataGoster(
            "km",
            "Geçerli kilometre giriniz."
        );

        gecerli = false;
    }

    if (!vitesSelect.value) {
        hataGoster(
            "vites",
            "Vites türünü seçiniz."
        );

        gecerli = false;
    }

    if (!yakitSelect.value) {
        hataGoster(
            "yakit",
            "Yakıt türünü seçiniz."
        );

        gecerli = false;
    }

    if (!ilSelect.value) {
        hataGoster(
            "il",
            "İl seçiniz."
        );

        gecerli = false;
    }

    return gecerli;
}

/* =========================================================
   HATA GÖSTERME VE TEMİZLEME
   ========================================================= */

function hataGoster(alanAdi, mesaj) {
    const alan = document.getElementById(alanAdi);
    const hata = document.getElementById(
        `${alanAdi}Error`
    );

    if (!alan || !hata) {
        return;
    }

    alan.classList.add("input-error");

    alan.setAttribute(
        "aria-invalid",
        "true"
    );

    alan.setAttribute(
        "aria-describedby",
        `${alanAdi}Error`
    );

    hata.textContent = mesaj;
    hata.classList.add("show");
}

function hataTemizle(alanAdi) {
    const alan = document.getElementById(alanAdi);
    const hata = document.getElementById(
        `${alanAdi}Error`
    );

    if (!alan || !hata) {
        return;
    }

    alan.classList.remove("input-error");

    alan.removeAttribute("aria-invalid");
    alan.removeAttribute("aria-describedby");

    hata.textContent = "";
    hata.classList.remove("show");
}

function tumHatalariTemizle() {
    alanAdlari.forEach(hataTemizle);
}

/*
   Kullanıcı bir alana tekrar değer girince
   o alana ait hata mesajı otomatik temizlenir.
*/
function hataTemizlemeOlaylariniEkle() {
    alanAdlari.forEach(alanAdi => {
        const alan = document.getElementById(alanAdi);

        if (!alan) {
            return;
        }

        const olayAdi =
            alan.tagName === "SELECT"
                ? "change"
                : "input";

        alan.addEventListener(olayAdi, () => {
            hataTemizle(alanAdi);
        });
    });
}

function ilkHataliAlanaGit() {
    const ilkHataliAlan =
        document.querySelector(".input-error");

    if (!ilkHataliAlan) {
        return;
    }

    ilkHataliAlan.focus();

    ilkHataliAlan.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   FORM GENEL MESAJI
   ========================================================= */

function mesajGoster(mesaj, tur) {
    formMessage.textContent = mesaj;
    formMessage.className =
        `form-message ${tur}`;
}

function mesajGizle() {
    formMessage.textContent = "";
    formMessage.className =
        "form-message hidden";
}

/* =========================================================
   YÜKLENİYOR DURUMU
   ========================================================= */

function yukleniyorAyarla(yukleniyor) {
    submitButton.disabled = yukleniyor;

    submitButton.textContent = yukleniyor
        ? "Başvuru kaydediliyor..."
        : "Başvuruyu gönder";
}