const categoriesRepository = require("../repositories/categories.repository");

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

async function listCategories({ limit, offset, name, is_active }) {
  return categoriesRepository.listCategories({ limit, offset, name, is_active });
}

async function findCategoryById(id) {
  validateRequiredFields({ id });

  const category = await categoriesRepository.getCategoryById(id);
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }

  return category;
}

async function createCategory(body) {
  validateRequiredFields({ body });
  validateRequiredFields({ name: body.name });

  const category = {
    name: String(body.name).trim(),
    description: body.description ? String(body.description).trim() : null,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
  };

  return categoriesRepository.createCategory(category);
}

async function updateCategory(id, patch) {
  validateRequiredFields({ id });
  if (!patch || typeof patch !== "object") {
    const error = new Error("Invalid body.");
    error.statusCode = 400;
    throw error;
  }

  const update = {};
  if (patch.name !== undefined) {
    const value = String(patch.name ?? "").trim();
    if (!value) {
      const error = new Error("Name is required.");
      error.statusCode = 400;
      throw error;
    }
    update.name = value;
  }
  if (patch.description !== undefined) update.description = patch.description ? String(patch.description).trim() : null;
  if (patch.is_active !== undefined) update.is_active = Boolean(patch.is_active);

  if (Object.keys(update).length === 0) {
    const error = new Error("No fields to update.");
    error.statusCode = 400;
    throw error;
  }

  const updated = await categoriesRepository.updateCategory(id, update);
  if (!updated) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

async function removeCategory(id) {
  validateRequiredFields({ id });

  const deleted = await categoriesRepository.deleteCategory(id);
  if (!deleted) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }

  return { id: deleted.id };
}

module.exports = {
  listCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  removeCategory,
};
