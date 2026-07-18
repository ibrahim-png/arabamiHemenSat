require("dotenv").config();

const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL bulunamadı.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false
});

app.disable("x-powered-by");

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

const iller = [
    "Adana",
    "Adıyaman",
    "Afyonkarahisar",
    "Ağrı",
    "Aksaray",
    "Amasya",
    "Ankara",
    "Antalya",
    "Ardahan",
    "Artvin",
    "Aydın",
    "Balıkesir",
    "Bartın",
    "Batman",
    "Bayburt",
    "Bilecik",
    "Bingöl",
    "Bitlis",
    "Bolu",
    "Burdur",
    "Bursa",
    "Çanakkale",
    "Çankırı",
    "Çorum",
    "Denizli",
    "Diyarbakır",
    "Düzce",
    "Edirne",
    "Elazığ",
    "Erzincan",
    "Erzurum",
    "Eskişehir",
    "Gaziantep",
    "Giresun",
    "Gümüşhane",
    "Hakkâri",
    "Hatay",
    "Iğdır",
    "Isparta",
    "İstanbul",
    "İzmir",
    "Kahramanmaraş",
    "Karabük",
    "Karaman",
    "Kars",
    "Kastamonu",
    "Kayseri",
    "Kırıkkale",
    "Kırklareli",
    "Kırşehir",
    "Kilis",
    "Kocaeli",
    "Konya",
    "Kütahya",
    "Malatya",
    "Manisa",
    "Mardin",
    "Mersin",
    "Muğla",
    "Muş",
    "Nevşehir",
    "Niğde",
    "Ordu",
    "Osmaniye",
    "Rize",
    "Sakarya",
    "Samsun",
    "Siirt",
    "Sinop",
    "Sivas",
    "Şanlıurfa",
    "Şırnak",
    "Tekirdağ",
    "Tokat",
    "Trabzon",
    "Tunceli",
    "Uşak",
    "Van",
    "Yalova",
    "Yozgat",
    "Zonguldak"
];

const vitesTurleri = [
    "Manuel",
    "Otomatik"
];

const yakitTurleri = [
    "Benzinli",
    "Benzin & LPG",
    "Dizel",
    "Hibrit",
    "Elektrikli"
];

function metinTemizle(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
}

function telefonTemizle(value) {
    return metinTemizle(value)
        .replace(/\D/g, "");
}

/**
 * Araç markalarını getirir.
 */
app.get("/api/markalar", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT
                TRIM(markaadi) AS markaadi
            FROM aracmaster
            WHERE markaadi IS NOT NULL
              AND TRIM(markaadi) <> ''
            ORDER BY markaadi
        `);

        res.json({
            success: true,
            data: result.rows.map(
                row => row.markaadi
            )
        });
    } catch (error) {
        console.error(
            "Markalar alınamadı:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Markalar alınırken hata oluştu."
        });
    }
});

/**
 * Seçilen markanın araç tiplerini getirir.
 */
app.get("/api/tipler", async (req, res) => {
    const marka =
        metinTemizle(req.query.marka);

    if (!marka) {
        return res.status(400).json({
            success: false,
            message: "Marka seçilmelidir."
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT DISTINCT
                TRIM(tipadi) AS tipadi
            FROM aracmaster
            WHERE markaadi = $1
              AND tipadi IS NOT NULL
              AND TRIM(tipadi) <> ''
            ORDER BY tipadi
            `,
            [marka]
        );

        res.json({
            success: true,
            data: result.rows.map(
                row => row.tipadi
            )
        });
    } catch (error) {
        console.error(
            "Araç tipleri alınamadı:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Araç tipleri alınırken hata oluştu."
        });
    }
});

/**
 * İl, vites ve yakıt seçeneklerini getirir.
 */
app.get(
    "/api/form-secenekleri",
    (req, res) => {
        res.json({
            success: true,
            data: {
                iller,
                vitesTurleri,
                yakitTurleri
            }
        });
    }
);

/**
 * Yeni başvuru kaydeder.
 */
app.post(
    "/api/basvurular",
    async (req, res) => {
        const telefonno =
            telefonTemizle(
                req.body.telefonno
            );

        const marka =
            metinTemizle(
                req.body.marka
            );

        const tip =
            metinTemizle(
                req.body.tip
            );

        const il =
            metinTemizle(
                req.body.il
            );

        const vites =
            metinTemizle(
                req.body.vites
            );

        const yakit =
            metinTemizle(
                req.body.yakit
            );

        const yil =
            Number(req.body.yil);

        const km =
            Number(req.body.km);

        if (
            !telefonno ||
            !marka ||
            !tip ||
            !il ||
            !vites ||
            !yakit ||
            !Number.isInteger(yil) ||
            !Number.isInteger(km)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Tüm alanları eksiksiz doldurunuz."
            });
        }

        if (
            telefonno.length !== 10 &&
            telefonno.length !== 11
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Telefon numarası 10 veya 11 haneli olmalıdır."
            });
        }

        const mevcutYil =
            new Date().getFullYear();

        if (
            yil < 1900 ||
            yil > mevcutYil + 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Geçerli bir model yılı giriniz."
            });
        }

        if (
            km < 0 ||
            km > 5000000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Geçerli bir kilometre giriniz."
            });
        }

        if (!iller.includes(il)) {
            return res.status(400).json({
                success: false,
                message:
                    "Geçerli bir il seçiniz."
            });
        }

        if (
            !vitesTurleri.includes(vites)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Geçerli bir vites türü seçiniz."
            });
        }

        if (
            !yakitTurleri.includes(yakit)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Geçerli bir yakıt türü seçiniz."
            });
        }

        const client =
            await pool.connect();

        try {
            await client.query("BEGIN");

            const aracKontrol =
                await client.query(
                    `
                    SELECT 1
                    FROM aracmaster
                    WHERE markaadi = $1
                      AND tipadi = $2
                    LIMIT 1
                    `,
                    [marka, tip]
                );

            if (
                aracKontrol.rowCount === 0
            ) {
                await client.query(
                    "ROLLBACK"
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Seçilen marka ve araç tipi eşleşmiyor."
                    });
            }

            const result =
                await client.query(
                    `
                    INSERT INTO basvurular (
                        telefonno,
                        marka,
                        tip,
                        yil,
                        km,
                        vites,
                        yakit,
                        il
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8
                    )
                    RETURNING
                        guid,
                        telefonno,
                        marka,
                        tip,
                        yil,
                        km,
                        vites,
                        yakit,
                        il,
                        processdate,
                        processtime
                    `,
                    [
                        telefonno,
                        marka,
                        tip,
                        yil,
                        km,
                        vites,
                        yakit,
                        il
                    ]
                );

            await client.query("COMMIT");

            res.status(201).json({
                success: true,
                message:
                    "Başvurunuz başarıyla kaydedildi.",
                data: result.rows[0]
            });
        } catch (error) {
            await client.query(
                "ROLLBACK"
            );

            console.error(
                "Başvuru kaydedilemedi:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Başvuru kaydedilirken hata oluştu."
            });
        } finally {
            client.release();
        }
    }
);

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message:
            "API adresi bulunamadı."
    });
});

app.get("*splat", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

async function sunucuyuBaslat() {
    try {
        await pool.query("SELECT 1");

        app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `Sunucu http://localhost:${PORT} adresinde çalışıyor.`
                );
            }
        );
    } catch (error) {
        console.error(
            "PostgreSQL bağlantısı kurulamadı:",
            error
        );

        process.exit(1);
    }
}

sunucuyuBaslat();