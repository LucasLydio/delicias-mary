const { supabase } = require("../config/supabase");

const SELECT_FIELDS = "id, category_id, name, slug, description, price_cents, discount_cents, is_active, created_at, updated_at";

async function getProductById(id) {
  const { data, error } = await supabase.from("products").select(SELECT_FIELDS).eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function listProducts({ limit = 20, offset = 0, q, category_id, is_active } = {}) {
  let query = supabase.from("products").select(SELECT_FIELDS, { count: "exact" }).order("created_at", {
    ascending: false,
  });

  if (q) query = query.ilike("name", `%${q}%`);
  if (category_id) query = query.eq("category_id", category_id);
  if (is_active !== undefined && is_active !== null && is_active !== "") {
    query = query.eq("is_active", String(is_active).toLowerCase() === "true");
  }

  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { items: data || [], total: count ?? 0, limit, offset };
}

async function createProduct(product) {
  const { data, error } = await supabase.from("products").insert([product]).select(SELECT_FIELDS).single();
  if (error) throw error;
  return data;
}

async function updateProduct(id, patch) {
  const { data, error } = await supabase.from("products").update(patch).eq("id", id).select(SELECT_FIELDS).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data || null;
}

async function deleteProduct(id) {
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("id, slug").single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data || null;
}

module.exports = {
  getProductById,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
