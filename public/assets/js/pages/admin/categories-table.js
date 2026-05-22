import { apiFetch, apiFetchData } from "../../api.js";
import { getToken } from "../../auth.js";
import { escapeAttr, escapeHtml, qs, setAlert } from "../../utils/dom.js";

function openModal(modalEl) {
  if (!window.bootstrap?.Modal) return null;
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
  return modal;
}

function badgeTemplate(isActive) {
  return isActive
    ? `<span class="badge text-bg-success">Ativa</span>`
    : `<span class="badge text-bg-secondary">Inativa</span>`;
}

function categoryCardTemplate(category) {
  const description = category.description ? escapeHtml(category.description) : "Sem descrição.";
  const isActive = Boolean(category.is_active);

  return `
    <article class="admin-card-item" data-id="${escapeAttr(category.id)}">
      <div class="admin-card-item__top">
        <div class="admin-card-item__title">
          <strong class="text-dark">${escapeHtml(category.name || "-")}</strong>
          <div class="admin-card-item__meta">${badgeTemplate(isActive)}</div>
        </div>
      </div>

      <p class="admin-card-item__desc">${description}</p>

      <div class="admin-card-item__actions">
        <button class="btn btn-outline-dark btn-sm" type="button" data-action="edit" data-id="${escapeAttr(category.id)}">
          <i class="bi bi-pencil me-2"></i>Editar
        </button>
        <button class="btn btn-outline-secondary btn-sm" type="button" data-action="toggle" data-id="${escapeAttr(
          category.id
        )}">
          <i class="bi bi-power me-2"></i>${isActive ? "Desativar" : "Ativar"}
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(category.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </div>
    </article>
  `.trim();
}

async function loadCategories({ name, isActiveFilter }) {
  const token = getToken();
  const params = new URLSearchParams();
  params.set("limit", "200");
  params.set("offset", "0");
  if (name) params.set("name", name);
  if (isActiveFilter !== "all") params.set("is_active", String(isActiveFilter));

  return apiFetchData(`/.netlify/functions/category?${params.toString()}`, {
    method: "GET",
    token,
  });
}

async function createCategory(body) {
  const token = getToken();
  return apiFetchData("/.netlify/functions/category", {
    method: "POST",
    token,
    body,
  });
}

async function updateCategory({ id, patch }) {
  const token = getToken();
  return apiFetchData(`/.netlify/functions/category?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: patch,
  });
}

async function deleteCategory(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/category?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

function buildCategoryFromForm() {
  const name = qs("#categoryName")?.value || "";
  const description = qs("#categoryDescription")?.value || "";
  const isActive = (qs("#categoryActive")?.value || "true") === "true";

  const trimmedName = String(name).trim();
  if (!trimmedName) throw new Error("Por favor, preencha o nome da categoria.");

  return {
    name: trimmedName,
    description: description ? String(description).trim() : null,
    is_active: isActive,
  };
}

export function mountCategoriesPage() {
  const alertBox = qs("#adminAlert");
  const grid = qs("#categoriesGrid");
  const empty = qs("#categoriesEmpty");
  const refreshBtn = qs("#categoriesRefresh");
  const createBtn = qs("#categoriesCreate");
  const searchInput = qs("#categoriesSearch");
  const statusSelect = qs("#categoriesStatus");

  const modalEl = qs("#categoryModal");
  const titleEl = qs("#categoryModalTitle");
  const formEl = qs("#categoryForm");
  const saveBtn = qs("#saveCategoryBtn");

  if (!grid) return;

  let categoriesById = new Map();
  let isCreateMode = false;

  const render = async () => {
    refreshBtn?.setAttribute("disabled", "disabled");
    grid.innerHTML = "";
    empty?.classList.add("d-none");
    setAlert(alertBox, { message: null });

    try {
      const name = String(searchInput?.value || "").trim();
      const status = String(statusSelect?.value || "all");
      const list = await loadCategories({ name, isActiveFilter: status });
      const items = list?.items || [];
      categoriesById = new Map(items.map((c) => [c.id, c]));

      if (items.length === 0) {
        empty?.classList.remove("d-none");
        return;
      }

      grid.innerHTML = items.map(categoryCardTemplate).join("");
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao carregar categorias." });
    } finally {
      refreshBtn?.removeAttribute("disabled");
    }
  };

  const openCreate = () => {
    if (!modalEl || !formEl) return;
    isCreateMode = true;
    if (titleEl) titleEl.textContent = "Nova categoria";
    qs("#categoryId").value = "";
    qs("#categoryName").value = "";
    qs("#categoryDescription").value = "";
    qs("#categoryActive").value = "true";
    openModal(modalEl);
  };

  createBtn?.addEventListener("click", openCreate);
  refreshBtn?.addEventListener("click", render);

  let searchTimer = null;
  searchInput?.addEventListener("input", () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 250);
  });
  statusSelect?.addEventListener("change", render);

  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "edit") {
      const category = categoriesById.get(id);
      if (!category || !modalEl) return;

      isCreateMode = false;
      if (titleEl) titleEl.textContent = "Editar categoria";
      qs("#categoryId").value = category.id;
      qs("#categoryName").value = category.name || "";
      qs("#categoryDescription").value = category.description || "";
      qs("#categoryActive").value = category.is_active ? "true" : "false";
      openModal(modalEl);
      return;
    }

    if (action === "toggle") {
      const category = categoriesById.get(id);
      if (!category) return;

      btn.setAttribute("disabled", "disabled");
      setAlert(alertBox, { message: null });
      try {
        await updateCategory({ id, patch: { is_active: !category.is_active } });
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao atualizar categoria." });
      } finally {
        btn.removeAttribute("disabled");
      }
      return;
    }

    if (action === "delete") {
      if (!confirm("Excluir esta categoria?")) return;
      btn.setAttribute("disabled", "disabled");
      setAlert(alertBox, { message: null });
      try {
        await deleteCategory(id);
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao excluir categoria." });
      } finally {
        btn.removeAttribute("disabled");
      }
    }
  });

  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(alertBox, { message: null });

    const id = qs("#categoryId")?.value || "";

    saveBtn?.setAttribute("disabled", "disabled");
    try {
      const body = buildCategoryFromForm();
      if (isCreateMode) {
        await createCategory(body);
      } else {
        if (!id) throw new Error("Missing category id.");
        await updateCategory({ id, patch: body });
      }

      if (modalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      await render();
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao salvar categoria." });
    } finally {
      saveBtn?.removeAttribute("disabled");
    }
  });

  render();
}

