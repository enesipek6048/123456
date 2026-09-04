import { list, put } from "@vercel/blob";

const KEY = "letter/current.txt";
const MAX = 20000;

// GET  /api/letter        -> { text }
// POST /api/letter { text } -> { ok: true }
export default async function handler(req, res) {
    try {
        if (req.method === "GET") {
            const { blobs } = await list({ prefix: "letter/" });
            if (!blobs.length) {
                res.setHeader("Cache-Control", "no-store");
                res.status(200).json({ text: "" });
                return;
            }
            const newest = blobs.sort(
                (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
            )[0];
            const r = await fetch(newest.url + "?t=" + Date.now(), {
                cache: "no-store",
            });
            const text = await r.text();
            res.setHeader("Cache-Control", "no-store");
            res.status(200).json({ text });
            return;
        }

        if (req.method === "POST") {
            const body =
                typeof req.body === "string"
                    ? JSON.parse(req.body || "{}")
                    : req.body || {};
            let text = typeof body.text === "string" ? body.text : "";
            if (text.length > MAX) text = text.slice(0, MAX);

            await put(KEY, text, {
                access: "public",
                contentType: "text/plain; charset=utf-8",
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
