import { list } from "@vercel/blob";

// GET /api/photos  ->  { photos: [{ url, uploadedAt }] }
export default async function handler(req, res) {
    try {
        const { blobs } = await list({ prefix: "gallery/" });

        const photos = blobs
            .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
            .map((b) => ({ url: b.url, uploadedAt: b.uploadedAt }));

        res.setHeader("Cache-Control", "no-store");
        res.status(200).json({ photos });
    } catch (err) {
        res.status(500).json({ error: String((err && err.message) || err) });
    }
}
