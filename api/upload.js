import { put } from "@vercel/blob";

// POST /api/upload  { dataUrl: "data:image/jpeg;base64,..." }  ->  { url }
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Yalnızca POST" });
        return;
    }

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
        const dataUrl = body.dataUrl;

        if (
            typeof dataUrl !== "string" ||
            !/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)
        ) {
            res.status(400).json({ error: "Geçersiz görsel biçimi (JPEG/PNG/WebP)." });
            return;
        }

        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        const buffer = Buffer.from(base64, "base64");

        if (buffer.length === 0) {
            res.status(400).json({ error: "Boş dosya." });
            return;
        }
        if (buffer.length > 6 * 1024 * 1024) {
            res.status(413).json({ error: "Dosya çok büyük (6 MB sınırı)." });
            return;
        }

        const key = `gallery/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.jpg`;

        const blob = await put(key, buffer, {
            access: "public",
            contentType: "image/jpeg",
        });

        res.status(200).json({ url: blob.url });
    } catch (err) {
        res.status(500).json({ error: String((err && err.message) || err) });
    }
}
