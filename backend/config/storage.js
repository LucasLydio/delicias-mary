const { supabase } = require("./supabase");

const filesUploadBucket = process.env.STORAGE_BUCKET_FILES_UPLOAD || "delicias_mary";

async function uploadFilesUploadObject({ key, buffer, contentType }) {
  console.log("tipo de imagem", contentType)
  const { error } = await supabase.storage.from(filesUploadBucket).upload(key, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: true,
  });

  if (error) throw error;

  return {
    bucket: filesUploadBucket,
    key,
    storage_path: `/${filesUploadBucket}/${String(key).replaceAll("\\", "/")}`,
  };
}

function parseStoragePath(storagePath) {
  const raw = String(storagePath || "").trim();
  if (!raw) return null;

  const parts = raw.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const bucket = parts[0];
  const key = parts.slice(1).join("/");
  if (!bucket || !key) return null;

  return { bucket, key };
}

function getPublicUrlFromStoragePath(storagePath) {
  const parsed = parseStoragePath(storagePath);
  if (!parsed) return null;

  const { data } = supabase.storage.from(parsed.bucket).getPublicUrl(parsed.key);
  return data?.publicUrl || null;
}

async function getSignedUrlFromStoragePath(storagePath, { expiresIn = 60 * 60 } = {}) {
  const parsed = parseStoragePath(storagePath);
  if (!parsed) return null;

  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.key, expiresIn);
  if (error) return null;
  return data?.signedUrl || null;
}

async function getBestObjectUrlFromStoragePath(storagePath, { expiresIn } = {}) {
  const signed = await getSignedUrlFromStoragePath(storagePath, { expiresIn });
  if (signed) return signed;

  const publicUrl = getPublicUrlFromStoragePath(storagePath);
  if (publicUrl) return publicUrl;

  return null;
}

module.exports = {
  filesUploadBucket,
  uploadFilesUploadObject,
  parseStoragePath,
  getPublicUrlFromStoragePath,
  getSignedUrlFromStoragePath,
  getBestObjectUrlFromStoragePath,
};

