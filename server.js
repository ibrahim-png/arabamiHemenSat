"use strict";

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

/*
 * Statik dosyalar yalnızca gerçekten mevcutsa döndürülür.
 *
 * fallthrough: true sayesinde dosya bulunamazsa istek
 * aşağıdaki 404 işleyicisine devam eder.
 *
 * redirect: false sayesinde klasör yollarında beklenmeyen
 * otomatik yönlendirmeler yapılmaz.
 */
app.use(
    express.static(
        path.join(__dirname, "public"),
        {
            fallthrough: true,
            redirect: false,
            index: false
        }
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
    return metinTemizle(value).replace(/\D/g, "");
}

/*
 * ANA SAYFA
 *
 * Yalnızca tam olarak "/" adresinde ana sayfa gösterilir.
 */
app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

/*
 * ROBOTS.TXT
 */
app.get("/robots.txt", (req, res) => {
    res
        .type("text/plain")
        .send(
            [
                "User-agent: *",
                "Allow: /",
                "Disallow: /api/",
                "",
                "Sitemap: https://arabanihemensat.com/sitemap.xml"
            ].join("\n")
        );
});

/*
 * SITEMAP.XML
 */
app.get("/sitemap.xml", (req, res) => {
    res
        .type("application/xml")
        .send(
            `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://arabanihemensat.com/</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`
        );
});

/*
 * SAĞLIK KONTROLÜ
 */
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            success: true,
            status: "ok"
        });
    } catch (error) {
        console.error(
            "Sağlık kontrolü başarısız:",
            error
        );

        return res.status(503).json({
            success: false,
            status: "unavailable"
        });
    }
});

/*
 * ARAÇ MARKALARINI GETİRİR
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

        return res.status(200).json({
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

        return res.status(500).json({
            success: false,
            message:
                "Markalar alınırken hata oluştu."
        });
    }
});

/*
 * SEÇİLEN MARKANIN ARAÇ TİPLERİNİ GETİRİR
 */
app.get("/api/tipler", async (req, res) => {
    const marka = metinTemizle(
        req.query.marka
    );

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

        return res.status(200).json({
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

        return res.status(500).json({
            success: false,
            message:
                "Araç tipleri alınırken hata oluştu."
        });
    }
});

/*
 * İL, VİTES VE YAKIT SEÇENEKLERİNİ GETİRİR
 */
app.get(
    "/api/form-secenekleri",
    (req, res) => {
        return res.status(200).json({
            success: true,
            data: {
                iller,
                vitesTurleri,
                yakitTurleri
            }
        });
    }
);

/*
 * YENİ BAŞVURU KAYDEDER
 */
app.post(
    "/api/basvurular",
    async (req, res) => {
        const telefonno = telefonTemizle(
            req.body.telefonno
        );

        const marka = metinTemizle(
            req.body.marka
        );

        const tip = metinTemizle(
            req.body.tip
        );

        const il = metinTemizle(
            req.body.il
        );

        const vites = metinTemizle(
            req.body.vites
        );

        const yakit = metinTemizle(
            req.body.yakit
        );

        const yil = Number(
            req.body.yil
        );

        const km = Number(
            req.body.km
        );

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

        let client;

        try {
            client = await pool.connect();

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

                return res.status(400).json({
                    success: false,
                    message:
                        "Seçilen marka ve araç tipi eşleşmiyor."
                });
            }

            const result =
                await client.query(
                    `
                        INSERT INTO basvurular
                        (
                            telefonno,
                            marka,
                            tip,
                            yil,
                            km,
                            vites,
                            yakit,
                            il
                        )
                        VALUES
                        (
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

            return res.status(201).json({
                success: true,
                message:
                    "Başvurunuz başarıyla kaydedildi.",
                data: result.rows[0]
            });
        } catch (error) {
            if (client) {
                try {
                    await client.query(
                        "ROLLBACK"
                    );
                } catch (
                    rollbackError
                ) {
                    console.error(
                        "Rollback başarısız:",
                        rollbackError
                    );
                }
            }

            console.error(
                "Başvuru kaydedilemedi:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Başvuru kaydedilirken hata oluştu."
            });
        } finally {
            if (client) {
                client.release();
            }
        }
    }
);

/*
 * BULUNAMAYAN API ADRESLERİ
 */
app.use("/api", (req, res) => {
    return res.status(404).json({
        success: false,
        message: "API adresi bulunamadı."
    });
});

/*
 * BULUNAMAYAN NORMAL SAYFALAR
 *
 * Eski kodda burada index.html gönderiliyordu:
 *
 * app.get("*splat", ...)
 *
 * O kod tamamen kaldırıldı.
 *
 * Artık /djdkfk gibi bir adres:
 * - ana sayfayı göstermez
 * - 404 HTTP durum kodu döndürür
 * - ayrı bir hata sayfası gösterir
 */
app.use((req, res) => {
    res.status(404);

    res.type("html");

    return res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="robots"
        content="noindex, nofollow"
    >

    <title>404 | Sayfa Bulunamadı</title>

    <style>
        * {
            box-sizing: border-box;
        }

        html,
        body {
            min-height: 100%;
        }

        body {
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: #172033;
            background: #f4f6fb;
        }

        .error-card {
            width: 100%;
            max-width: 520px;
            padding: 42px 30px;
            text-align: center;
            background: #ffffff;
            border: 1px solid #e1e5ee;
            border-radius: 18px;
            box-shadow:
                0 18px 55px
                rgba(20, 30, 55, 0.12);
        }

        .status-code {
            margin: 0 0 10px;
            color: #315efb;
            font-size: 64px;
            line-height: 1;
            font-weight: 800;
        }

        h1 {
            margin: 0 0 14px;
            font-size: 28px;
        }

        p {
            margin: 0 0 26px;
            color: #5f6879;
            line-height: 1.6;
        }

        a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 48px;
            padding: 0 22px;
            color: #ffffff;
            text-decoration: none;
            background: #315efb;
            border-radius: 10px;
            font-weight: 700;
        }

        a:hover {
            background: #244bd2;
        }
    </style>
</head>

<body>

    <main class="error-card">

        <div class="status-code">
            404
        </div>

        <h1>
            Sayfa bulunamadı
        </h1>

        <p>
            Aradığınız sayfa mevcut değil,
            kaldırılmış veya adresi yanlış yazılmış olabilir.
        </p>

        <a href="/">
            Ana sayfaya dön
        </a>

    </main>

</body>
</html>
    `);
});

/*
 * SUNUCUYU BAŞLATIR
 */
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
