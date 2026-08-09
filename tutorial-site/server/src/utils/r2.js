import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Shared Cloudflare R2 client + upload helper. Was previously duplicated
// inline in routes/uploads.js; pulled out here so other routes (e.g. the
// book-cover generator in routes/books.js) can reuse it without importing
// a route file.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function putToR2(key, buffer, mimetype) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// Small helper for building collision-safe object keys, used by every
// upload route (main uploads, avatars, generated covers).
export function randomKey(prefix, ext) {
  const unique = crypto.randomBytes(8).toString("hex");
  return `${prefix}${Date.now()}-${unique}${ext}`;
}
