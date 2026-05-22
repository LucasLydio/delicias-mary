const { supabase } = require("../config/supabase");

const SELECT_FIELDS = "id, product_id, path, alt_text, is_cover, created_at, updated_at";

async function listImagesByProductId(productId) {
  const { data, error } = await supabase
    .from("product_images")
    .select(SELECT_FIELDS)
    .eq("product_id", productId)
    .order("is_cover", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function listImagesByProductIds(productIds) {
  const ids = Array.isArray(productIds) ? productIds.filter(Boolean) : [];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("product_images")
    .select(SELECT_FIELDS)
    .in("product_id", ids)
    .order("is_cover", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function getImageById(id) {
  const { data, error } = await supabase.from("product_images").select(SELECT_FIELDS).eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function unsetCover(productId) {
  const { error } = await supabase.from("product_images").update({ is_cover: false }).eq("product_id", productId);
  if (error) throw error;
}

async function createImage(image) {
  const { data, error } = await supabase.from("product_images").insert([image]).select(SELECT_FIELDS).single();
  if (error) throw error;
  return data;
}

async function updateImage(id, patch) {
  const { data, error } = await supabase.from("product_images").update(patch).eq("id", id).select(SELECT_FIELDS).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data || null;
}

async function deleteImage(id) {
  const { data, error } = await supabase.from("product_images").delete().eq("id", id).select("id, path, product_id").single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data || null;
}

module.exports = {
  listImagesByProductId,
  listImagesByProductIds,
  getImageById,
  unsetCover,
  createImage,
  updateImage,
  deleteImage,
};
