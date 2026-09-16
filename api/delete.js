import { del } from "@vercel/blob";

// POST /api/delete  { url: "https://....blob.vercel-storage.com/gallery/..." }  ->  { ok: true }
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Yalnızca POST" });
        return;
    }

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

        let parsed;
        try {
            parsed = new URL(body.url);
        } catch (_) {
            res.status(400).json({ error: "Geçersiz adres." });
            return;
        }

        // Yalnızca galeri klasöründeki blob'lar silinebilir.
        if (
            parsed.protocol !== "https:" ||
            !parsed.hostname.endsWith(".blob.vercel-storage.com") ||
            !parsed.pathname.startsWith("/gallery/")
        ) {
            res.status(400).json({ error: "Bu fotoğraf silinemez." });
            return;
        }

        await del(parsed.href);
        res.status(200).json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: String((err && err.message) || err) });
    }
}
