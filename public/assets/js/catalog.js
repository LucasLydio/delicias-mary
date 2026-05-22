import { apiFetchData } from "./api.js";

function unwrapItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "object" && Array.isArray(payload.items)) return payload.items;
  return [];
}

export async function fetchActiveCategories({ limit = 100, offset = 0 } = {}) {
  const data = await apiFetchData(`/.netlify/functions/category?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&is_active=true`);
  return unwrapItems(data);
}

export async function fetchActiveProductsByCategoryId(categoryId, { limit = 100, offset = 0 } = {}) {
  const data = await apiFetchData(
    `/.netlify/functions/product?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&category_id=${encodeURIComponent(categoryId)}&is_active=true`
  );
  return unwrapItems(data);
}

export async function fetchProductById(id) {
  return apiFetchData(`/.netlify/functions/product?id=${encodeURIComponent(id)}`);
}

export async function fetchProductImagesByProductId(productId) {
  const data = await apiFetchData(`/.netlify/functions/product-image?product_id=${encodeURIComponent(productId)}`);
  return unwrapItems(data);
}

