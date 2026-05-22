const productsRepository = require("../repositories/products.repository");
const productImagesRepository = require("../repositories/product-images.repository");
const { getBestObjectUrlFromStoragePath } = require("../config/storage");
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

function toInt(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSlug(value) {
  const s = slugify(value);
  if (!s) {
    const error = new Error("Slug is required.");
    error.statusCode = 400;
    throw error;
  }
  return s;
}

function handleUniqueError(error, message) {
  if (error && String(error.code) === "23505") {
    const e = new Error(message);
    e.statusCode = 409;
    throw e;
  }
  throw error;
}

async function listProducts({ limit, offset, q, category_id, is_active }) {
  const result = await productsRepository.listProducts({ limit, offset, q, category_id, is_active });
  const items = Array.isArray(result?.items) ? result.items : [];
  if (items.length === 0) return result;

  const ids = items.map((p) => p && p.id).filter(Boolean);
  const images = await productImagesRepository.listImagesByProductIds(ids);

  const bestImageByProductId = new Map();
  for (const image of images) {
    const productId = image?.product_id;
    if (!productId || bestImageByProductId.has(productId)) continue;
    bestImageByProductId.set(productId, image);
  }

  const withImages = await Promise.all(
    items.map(async (product) => {
      const image = bestImageByProductId.get(product.id);
      const rawPath = image && image.path ? String(image.path).trim() : "";

      let imageUrl = null;
      if (rawPath) {
        if (rawPath.startsWith("http://") || rawPath.startsWith("https://") || rawPath.startsWith("/assets/")) {
          imageUrl = rawPath;
        } else if (rawPath.startsWith("/")) {
          imageUrl = await getBestObjectUrlFromStoragePath(rawPath, { expiresIn: 60 * 60 });
        }
      }

      return {
        ...product,
        image_url: imageUrl || null,
      };
    })
  );

  return { ...result, items: withImages };
}

async function listProductsById(id) {
  validateRequiredFields({ id });
  const product = await productsRepository.getProductById(id);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }
  return product;
}

async function create(body) {
  validateRequiredFields({ body });
  validateRequiredFields({ name: body.name, category_id: body.category_id, price_cents: body.price_cents });

  const priceCents = toInt(body.price_cents, 0);
  const discountCents = toInt(body.discount_cents, 0);
  if (priceCents < 0) {
    const error = new Error("price_cents must be >= 0.");
    error.statusCode = 400;
    throw error;
  }
  if (discountCents < 0) {
    const error = new Error("discount_cents must be >= 0.");
    error.statusCode = 400;
    throw error;
  }
  if (discountCents > priceCents) {
    const error = new Error("discount_cents must be <= price_cents.");
    error.statusCode = 400;
    throw error;
  }

  const product = {
    category_id: body.category_id,
    name: String(body.name).trim(),
    slug: normalizeSlug(body.slug || body.name),
    description: body.description ? String(body.description).trim() : null,
    price_cents: priceCents,
    discount_cents: discountCents,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
  };

  try {
    return await productsRepository.createProduct(product);
  } catch (error) {
    handleUniqueError(error, "Slug already in use.");
  }
}

async function update(id, patch) {
  validateRequiredFields({ id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const existing = await productsRepository.getProductById(id);
  if (!existing) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const updatePatch = {};

  if (patch.category_id !== undefined) updatePatch.category_id = patch.category_id;
  if (patch.name !== undefined) {
    const value = String(patch.name ?? "").trim();
    if (!value) {
      const error = new Error("Name is required.");
      error.statusCode = 400;
      throw error;
    }
    updatePatch.name = value;
  }
  if (patch.slug !== undefined) updatePatch.slug = normalizeSlug(patch.slug);
  if (patch.description !== undefined) updatePatch.description = patch.description ? String(patch.description).trim() : null;
  if (patch.price_cents !== undefined) {
    const price = toInt(patch.price_cents, existing.price_cents);
    if (price < 0) {
      const error = new Error("price_cents must be >= 0.");
      error.statusCode = 400;
      throw error;
    }
    updatePatch.price_cents = price;
  }
  if (patch.discount_cents !== undefined) {
    const discount = toInt(patch.discount_cents, existing.discount_cents ?? 0);
    if (discount < 0) {
      const error = new Error("discount_cents must be >= 0.");
      error.statusCode = 400;
      throw error;
    }
    updatePatch.discount_cents = discount;
  }
  if (patch.is_active !== undefined) updatePatch.is_active = Boolean(patch.is_active);

  if (updatePatch.price_cents !== undefined || updatePatch.discount_cents !== undefined) {
    const finalPrice = updatePatch.price_cents ?? existing.price_cents;
    const finalDiscount = updatePatch.discount_cents ?? (existing.discount_cents ?? 0);
    if (finalDiscount > finalPrice) {
      const error = new Error("discount_cents must be <= price_cents.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (Object.keys(updatePatch).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const updated = await productsRepository.updateProduct(id, updatePatch);
    if (!updated) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }
    return updated;
  } catch (error) {
    handleUniqueError(error, "Slug already in use.");
  }
}

async function remove(id) {
  validateRequiredFields({ id });

  const deleted = await productsRepository.deleteProduct(id);
  if (!deleted) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  return { id: deleted.id, slug: deleted.slug };
}

module.exports = {
  listProducts,
  listProductsById,
  create,
  update,
  remove,
};
