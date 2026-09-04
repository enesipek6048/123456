import { list, put } from "@vercel/blob";

const KEY = "drawing/current.png";

// GET  /api/drawing          -> { url | null }
// POST /api/drawing { dataUrl } -> { ok: true }
export default async function handler(req, res) {
    try {
        if (req.method === "GET") {
            const { blobs } = await list({ prefix: "drawing/" });
            if (!blobs.length) {
                res.setHeader("Cache-Control", "no-store");
                res.status(200).json({ url: null });
                return;
            }
            const newest = blobs.sort(
                (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
            )[0];
            res.setHeader("Cache-Control", "no-store");
            res.status(200).json({ url: newest.url + "?t=" + Date.now() });
            return;
        }

        if (req.method === "POST") {
            const body =
                typeof req.body === "string"
                    ? JSON.parse(req.body || "{}")
                    : req.body || {};
            const dataUrl = body.dataUrl;

            if (
                typeof dataUrl !== "string" ||
                !/^data:image\/png;base64,/.test(dataUrl)
            ) {
                res.status(400).json({ error: "Geçersiz çizim." });
                return;
            }

            const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
            if (buf.length > 3 * 1024 * 1024) {
                res.status(413).json({ error: "Çizim çok büyük." });
                return;
            }

            await put(KEY, buf, {
                access: "public",
                contentType: "image/png",
                allowOverwrite: true,
                addRandomSuffix: false,
            });

            res.status(200).json({ ok: true });
            return;
        }

        res.status(405).json({ error: "GET veya POST" });
    } catch (err) {
        res.status(500).json({ error: String((err && err.message) || err) });
    }
}
