import { handleUpload } from "@vercel/blob/client";

const MAX_BYTES = 300 * 1024 * 1024;

// Tarayıcı videoyu doğrudan Vercel Blob'a yükler; bu uç yalnızca izin (token) verir.
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Yalnızca POST" });
        return;
    }

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

        const out = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async (pathname) => {
                if (!/^gallery\/[\w-]+\.(mp4|mov|webm|m4v)$/i.test(pathname)) {
                    throw new Error("Geçersiz video adı.");
                }
                return {
                    allowedContentTypes: [
                        "video/mp4",
                        "video/quicktime",
                        "video/webm",
                        "video/x-m4v",
                    ],
                    maximumSizeInBytes: MAX_BYTES,
                    addRandomSuffix: true,
                };
            },
        });

        res.status(200).json(out);
    } catch (err) {
        res.status(400).json({ error: String((err && err.message) || err) });
    }
}
