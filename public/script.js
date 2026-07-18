"use strict";

const form =
    document.getElementById(
        "basvuruForm"
    );

const telefonInput =
    document.getElementById(
        "telefonno"
    );

const markaSelect =
    document.getElementById(
        "marka"
    );

const tipSelect =
    document.getElementById(
        "tip"
    );

const yilInput =
    document.getElementById(
        "yil"
    );

const kmInput =
    document.getElementById(
        "km"
    );

const vitesSelect =
    document.getElementById(
        "vites"
    );

const yakitSelect =
    document.getElementById(
        "yakit"
    );

const ilSelect =
    document.getElementById(
        "il"
    );

const submitButton =
    document.getElementById(
        "submitButton"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        yilInput.max =
            new Date().getFullYear() + 1;

        await Promise.all([
            markalariYukle(),
            secenekleriYukle()
        ]);
    }
);

markaSelect.addEventListener(
    "change",
    async () => {
        hataTemizle("marka");
        hataTemizle("tip");

        tipSelect.disabled = true;

        tipSelect.innerHTML = `
            <option value="">
                Önce marka seçiniz
            </option>
        `;

        if (!markaSelect.value) {
            return;
        }

        await tipleriYukle(
            markaSelect.value
        );
    }
);

form.addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        mesajGizle();

        if (!formuDogrula()) {
            return;
        }

        const basvuru = {
            telefonno:
                telefonInput.value,

            marka:
                markaSelect.value,

            tip:
                tipSelect.value,

            yil:
                Number(yilInput.value),

            km:
                Number(kmInput.value),

            vites:
                vitesSelect.value,

            yakit:
                yakitSelect.value,

            il:
                ilSelect.value
        };

        yukleniyorAyarla(true);

        try {
            const response =
                await fetch(
                    "/api/basvurular",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                basvuru
                            )
                    }
                );

            const sonuc =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    sonuc.message ||
                    "Başvuru kaydedilemedi."
                );
            }

            mesajGoster(
                `Başvurunuz kaydedildi. Başvuru numarası: ${sonuc.data.guid}`,
                "success"
            );

            form.reset();

            tipSelect.disabled = true;

            tipSelect.innerHTML = `
                <option value="">
                    Önce marka seçiniz
                </option>
            `;
        } catch (error) {
            console.error(error);

            mesajGoster(
                error.message,
                "error"
            );
        } finally {
            yukleniyorAyarla(false);
        }
    }
);

async function markalariYukle() {
    try {
        const response =
            await fetch(
                "/api/markalar"
            );

        const sonuc =
            await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message
            );
        }

        markaSelect.innerHTML = `
            <option value="">
                Araç markasını seçiniz
            </option>
        `;

        sonuc.data.forEach(
            marka => {
                markaSelect.appendChild(
                    optionOlustur(marka)
                );
            }
        );

        markaSelect.disabled = false;
    } catch (error) {
        markaSelect.innerHTML = `
            <option value="">
                Markalar yüklenemedi
            </option>
        `;

        mesajGoster(
            "Markalar yüklenemedi.",
            "error"
        );
    }
}

async function tipleriYukle(marka) {
    tipSelect.innerHTML = `
        <option value="">
            Araç tipleri yükleniyor...
        </option>
    `;

    try {
        const response =
            await fetch(
                `/api/tipler?marka=${
                    encodeURIComponent(
                        marka
                    )
                }`
            );

        const sonuc =
            await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message
            );
        }

        tipSelect.innerHTML = `
            <option value="">
                Araç tipini seçiniz
            </option>
        `;

        sonuc.data.forEach(
            tip => {
                tipSelect.appendChild(
                    optionOlustur(tip)
                );
            }
        );

        tipSelect.disabled = false;
    } catch (error) {
        tipSelect.innerHTML = `
            <option value="">
                Araç tipleri yüklenemedi
            </option>
        `;

        mesajGoster(
            "Araç tipleri yüklenemedi.",
            "error"
        );
    }
}

async function secenekleriYukle() {
    try {
        const response =
            await fetch(
                "/api/form-secenekleri"
            );

        const sonuc =
            await response.json();

        if (!response.ok) {
            throw new Error(
                sonuc.message
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
        mesajGoster(
            "Form seçenekleri yüklenemedi.",
            "error"
        );
    }
}

function selectDoldur(
    select,
    ilkSecenek,
    liste
) {
    select.innerHTML = `
        <option value="">
            ${ilkSecenek}
        </option>
    `;

    liste.forEach(
        deger => {
            select.appendChild(
                optionOlustur(deger)
            );
        }
    );

    select.disabled = false;
}

function optionOlustur(deger) {
    const option =
        document.createElement(
            "option"
        );

    option.value = deger;
    option.textContent = deger;

    return option;
}

function formuDogrula() {
    tumHatalariTemizle();

    let gecerli = true;

    const telefon =
        telefonInput.value
            .replace(/\D/g, "");

    if (
        telefon.length !== 10 &&
        telefon.length !== 11
    ) {
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

    if (!yilInput.value) {
        hataGoster(
            "yil",
            "Model yılı giriniz."
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

function hataGoster(
    alanAdi,
    mesaj
) {
    const alan =
        document.getElementById(
            alanAdi
        );

    const hata =
        document.getElementById(
            `${alanAdi}Error`
        );

    alan.classList.add(
        "input-error"
    );

    hata.textContent = mesaj;
}

function hataTemizle(alanAdi) {
    const alan =
        document.getElementById(
            alanAdi
        );

    const hata =
        document.getElementById(
            `${alanAdi}Error`
        );

    alan.classList.remove(
        "input-error"
    );

    hata.textContent = "";
}

function tumHatalariTemizle() {
    [
        "telefonno",
        "marka",
        "tip",
        "yil",
        "km",
        "vites",
        "yakit",
        "il"
    ].forEach(hataTemizle);
}

function mesajGoster(
    mesaj,
    tur
) {
    formMessage.textContent = mesaj;

    formMessage.className =
        `form-message ${tur}`;
}

function mesajGizle() {
    formMessage.textContent = "";

    formMessage.className =
        "form-message hidden";
}

function yukleniyorAyarla(
    yukleniyor
) {
    submitButton.disabled =
        yukleniyor;

    submitButton.textContent =
        yukleniyor
            ? "Başvuru kaydediliyor..."
            : "Başvuruyu gönder";
}