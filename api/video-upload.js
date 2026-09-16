import { handleUploadPresigned } from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";

const MAX_BYTES = 300 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

// Tarayıcı videoyu doğrudan Vercel Blob'a yükler; bu uç yalnızca
// o dosya adı için kısa ömürlü bir yükleme izni (presigned URL) verir.
export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Yalnızca POST" });
        return;
    }

    try {
        const body =
            typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

        const out = await handleUploadPresigned({
            body,
            request: req,
            getSignedToken: async (pathname) => {
                if (!/^gallery\/[\w-]+\.(mp4|mov|webm|m4v)$/i.test(pathname)) {
                    throw new Error("Geçersiz video adı.");
                }
                const token = await issueSignedToken({
                    pathname,
                    operations: ["put"],
                    allowedContentTypes: VIDEO_TYPES,
                    maximumSizeInBytes: MAX_BYTES,
                    validUntil: Date.now() + 30 * 60 * 1000,
                });
                return {
                    token,
                    urlOptions: {
                        allowedContentTypes: VIDEO_TYPES,
                        maximumSizeInBytes: MAX_BYTES,
                        addRandomSuffix: false,
                    },
                };
            },
        });

        res.status(200).json(out);
    } catch (err) {
        res.status(400).json({ error: String((err && err.message) || err) });
    }
}
