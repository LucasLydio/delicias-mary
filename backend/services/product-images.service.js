const productsRepository = require("../repositories/products.repository");
const productImagesRepository = require("../repositories/product-images.repository");
const { uploadFilesUploadObject, getBestObjectUrlFromStoragePath } = require("../config/storage");
const { slugify } = require("../utils/slug");

function validateRequiredFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || String(value).trim() === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}

function sanitizeFilename(filename) {
  const raw = String(filename ?? "");
  const base = raw.split(/[/\\]/).pop() || "";
  const safe = base.replace(/[<>:"|?*\u0000-\u001F]/g, "").trim();
  if (!safe || safe === "." || safe === "..") {
    const error = new Error("Invalid filename.");
    error.statusCode = 400;
    throw error;
  }
  return safe;
}

function stripDataUrlPrefix(value) {
  const s = String(value ?? "");
  const commaIndex = s.indexOf(",");
  if (s.startsWith("data:") && commaIndex !== -1) return s.slice(commaIndex + 1);
  return s;
}

function inferContentType({ filename, base64 }) {
  const rawBase64 = String(base64 ?? "").trim();
  const match = rawBase64.match(/^data:([^;]+);base64,/i);
  if (match && match[1]) return String(match[1]).trim();

  const name = String(filename ?? "").trim().toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".svg")) return "image/svg+xml";

  return "application/octet-stream";
}

function assertMaxBytes(byteLength, maxBytes) {
  if (byteLength > maxBytes) {
    const error = new Error(`File too large. Max ${maxBytes} bytes.`);
    error.statusCode = 413;
    throw error;
  }
}

function resolveInlineUrl(pathOrUrl) {
  const raw = String(pathOrUrl || "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/assets/")) return raw;
  return null;
}

async function withUrl(image) {
  if (!image) return image;

  const inline = resolveInlineUrl(image.path);
  if (inline) return { ...image, url: inline };

  const url = await getBestObjectUrlFromStoragePath(image.path, { expiresIn: 60 * 60 });
  return { ...image, url };
}

async function listByProductId(productId) {
  validateRequiredFields({ productId });
  const items = await productImagesRepository.listImagesByProductId(productId);
  const withUrls = await Promise.all(items.map(withUrl));
  return withUrls;
}

async function getById(id) {
  validateRequiredFields({ id });
  const image = await productImagesRepository.getImageById(id);
  if (!image) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }
  return withUrl(image);
}

async function create({ product_id, filename, base64, alt_text, is_cover }) {
  validateRequiredFields({ product_id, filename, base64 });

  const product = await productsRepository.getProductById(product_id);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const slugFolder = slugify(product.slug || product.name);
  if (!slugFolder) {
    const error = new Error("Product slug is required to store images.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedBase64 = stripDataUrlPrefix(base64).trim();
  let buffer;
  try {
    buffer = Buffer.from(normalizedBase64, "base64");
  } catch {
    const error = new Error("Invalid base64 file.");
    error.statusCode = 400;
    throw error;
  }

  if (!buffer || buffer.length === 0) {
    const error = new Error("Empty file.");
    error.statusCode = 400;
    throw error;
  }

  assertMaxBytes(buffer.length, 5 * 1024 * 1024);

  const safeFilename = sanitizeFilename(filename);
  const contentType = inferContentType({ filename: safeFilename, base64 });
  const key = `${slugFolder}/${safeFilename}`;
  const uploaded = await uploadFilesUploadObject({ key, buffer, contentType });
  const storagePath = uploaded.storage_path;

  const isCover = Boolean(is_cover);
  if (isCover) {
    await productImagesRepository.unsetCover(product_id);
  } 

  const created = await productImagesRepository.createImage({
    product_id,
    path: storagePath,
    alt_text: alt_text ? String(alt_text).trim() : null,
    is_cover: isCover,
  });

  return withUrl(created);
}

async function update(id, patch) {
  validateRequiredFields({ id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await productImagesRepository.getImageById(id);
  if (!existing) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }

  const updatePatch = {};
  if (patch.path !== undefined) updatePatch.path = String(patch.path ?? "").trim();
  if (patch.alt_text !== undefined) updatePatch.alt_text = patch.alt_text ? String(patch.alt_text).trim() : null;
  if (patch.is_cover !== undefined) {
    const isCover = Boolean(patch.is_cover);
    if (isCover) await productImagesRepository.unsetCover(existing.product_id);
    updatePatch.is_cover = isCover;
  }

  if (Object.keys(updatePatch).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  const updated = await productImagesRepository.updateImage(id, updatePatch);
  if (!updated) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }
  return withUrl(updated);
}

async function remove(id) {
  validateRequiredFields({ id });

  await getById(id);

  const deleted = await productImagesRepository.deleteImage(id);
  if (!deleted) {
    const error = new Error("Product image not found.");
    error.statusCode = 404;
    throw error;
  }

  return { id: deleted.id };
}

module.exports = {
  listByProductId,
  getById,
  create,
  update,
  remove,
};
