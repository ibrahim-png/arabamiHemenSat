"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION =
    process.env.NODE_ENV === "production";
const CANONICAL_HOST = (
    process.env.CANONICAL_HOST ||
    "arabanihemensat.com"
).trim().toLowerCase();

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL bulunamadı.");
    process.exit(1);
}

if (
    !/^[a-z0-9.-]+(?::\d+)?$/.test(
        CANONICAL_HOST
    )
) {
    console.error(
        "CANONICAL_HOST geçerli bir alan adı değil."
    );
    process.exit(1);
}

const poolConfig = {
    connectionString: process.env.DATABASE_URL
};

if (IS_PRODUCTION) {
    poolConfig.ssl = {
        rejectUnauthorized: true
    };
}

const pool = new Pool(poolConfig);

app.disable("x-powered-by");
app.set("trust proxy", IS_PRODUCTION ? 1 : false);

const cspDirectives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    frameSrc: ["'none'"],
    imgSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'"]
};

if (IS_PRODUCTION) {
    cspDirectives.upgradeInsecureRequests = [];
}

app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: cspDirectives
        },
        crossOriginResourcePolicy: {
            policy: "same-origin"
        },
        frameguard: {
            action: "deny"
        },
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin"
        },
        strictTransportSecurity: {
            maxAge: 31536000,
            includeSubDomains: true
        }
    })
);

app.use((req, res, next) => {
    res.setHeader(
        "Permissions-Policy",
        [
            "accelerometer=()",
            "camera=()",
            "geolocation=()",
            "gyroscope=()",
            "magnetometer=()",
            "microphone=()",
            "payment=()",
            "usb=()"
        ].join(", ")
    );

    next();
});

app.use((req, res, next) => {
    if (
        !IS_PRODUCTION ||
        req.path === "/health"
    ) {
        return next();
    }

    const isCanonicalHost =
        req.hostname.toLowerCase() ===
        CANONICAL_HOST;

    if (req.secure && isCanonicalHost) {
        return next();
    }

    return res.redirect(
        308,
        `https://${CANONICAL_HOST}${req.originalUrl}`
    );
});

const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyiniz."
    }
});

const basvuruRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Çok fazla başvuru gönderildi. Lütfen daha sonra tekrar deneyiniz."
    }
});

app.use("/api", apiRateLimiter);
app.use(
    "/api/basvurular",
    basvuruRateLimiter
);

app.use(express.json({ limit: "20kb" }));

app.get("/index.html", (req, res) => {
    return res.redirect(308, "/");
});

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
        if (!req.is("application/json")) {
            return res.status(415).json({
                success: false,
                message:
                    "Bu adres yalnızca JSON biçimindeki istekleri kabul eder."
            });
        }

        const body = req.body || {};

        const telefonno = telefonTemizle(
            body.telefonno
        );

        const marka = metinTemizle(
            body.marka
        );

        const tip = metinTemizle(
            body.tip
        );

        const il = metinTemizle(
            body.il
        );

        const vites = metinTemizle(
            body.vites
        );

        const yakit = metinTemizle(
            body.yakit
        );

        const yil = Number(
            body.yil
        );

        const km = Number(
            body.km
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
            marka.length > 100 ||
            tip.length > 150
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Marka veya araç tipi izin verilen uzunluğu aşıyor."
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

    <link rel="stylesheet" href="/style.css">
</head>

<body class="error-page">

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
 * BEKLENMEYEN HATALAR
 */
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const hataliJson =
        error instanceof SyntaxError &&
        error.status === 400 &&
        Object.prototype.hasOwnProperty.call(
            error,
            "body"
        );

    if (hataliJson) {
        return res.status(400).json({
            success: false,
            message:
                "Geçerli bir JSON isteği gönderiniz."
        });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message:
                "Gönderilen istek izin verilen boyutu aşıyor."
        });
    }

    console.error(
        "Beklenmeyen sunucu hatası:",
        error
    );

    if (req.originalUrl.startsWith("/api/")) {
        return res.status(500).json({
            success: false,
            message:
                "Beklenmeyen bir sunucu hatası oluştu."
        });
    }

    return res
        .status(500)
        .type("text/plain")
        .send("Beklenmeyen bir sunucu hatası oluştu.");
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
