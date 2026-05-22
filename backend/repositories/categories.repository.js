const { supabase } = require("../config/supabase");

const SELECT_FIELDS = "id, name, description, is_active, created_at, updated_at";

async function getCategoryById(id) {
  const { data, error } = await supabase.from("categories").select(SELECT_FIELDS).eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

async function listCategories({ limit = 20, offset = 0, name, is_active } = {}) {
  let query = supabase.from("categories").select(SELECT_FIELDS, { count: "exact" }).order("created_at", {
    ascending: false,
  });

  if (name) query = query.ilike("name", `%${name}%`);
  if (is_active !== undefined && is_active !== null && is_active !== "") {
    query = query.eq("is_active", String(is_active).toLowerCase() === "true");
  }

  const from = offset;
  const to = offset + limit - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { items: data || [], total: count ?? 0, limit, offset };
}

async function createCategory(category) {
  const { data, error } = await supabase.from("categories").insert([category]).select(SELECT_FIELDS).single();
  if (error) throw error;
  return data;
}

async function updateCategory(id, patch) {
  const { data, error } = await supabase.from("categories").update(patch).eq("id", id).select(SELECT_FIELDS).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data || null;
}

async function deleteCategory(id) {
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("id").single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data || null;
}

module.exports = {
  getCategoryById,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
