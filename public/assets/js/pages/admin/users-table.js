import { apiFetch, apiFetchData } from "../../api.js";
import { getToken } from "../../auth.js";
import { escapeAttr, escapeHtml, qs, setAlert } from "../../utils/dom.js";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function rowTemplate(user) {
  const active = user.is_active ? "Sim" : "Não";
  const phone = user.phone ? escapeHtml(user.phone) : "-";

  return `
    <tr>
      <td>${escapeHtml(user.name || "-")}</td>
      <td>${escapeHtml(user.email || "-")}</td>
      <td>${phone}</td>
      <td><span class="badge text-bg-secondary">${escapeHtml(user.role || "-")}</span></td>
      <td>${active}</td>
      <td>${escapeHtml(formatDate(user.created_at))}</td>
      <td class="text-end">
        <button class="btn btn-outline-dark btn-sm me-2" type="button" data-action="edit" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-pencil me-2"></i>Editar
        </button>
        <button class="btn btn-outline-secondary btn-sm me-2" type="button" data-action="reset" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-key me-2"></i>Reset
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </td>
    </tr>
  `.trim();
}

function cardTemplate(user) {
  const phone = user.phone ? escapeHtml(user.phone) : "-";
  const activeBadge = user.is_active
    ? `<span class="badge text-bg-success">Ativo</span>`
    : `<span class="badge text-bg-secondary">Inativo</span>`;

  return `
    <article class="admin-card-item" data-id="${escapeAttr(user.id)}">
      <div class="admin-card-item__top">
        <div class="admin-card-item__title">
          <strong>${escapeHtml(user.name || "-")}</strong>
          <div class="admin-card-item__meta">
            <span class="badge text-bg-secondary">${escapeHtml(user.role || "-")}</span>
            ${activeBadge}
          </div>
        </div>
      </div>

      <p class="admin-card-item__desc">
        <span class="text-secondary">Email:</span> ${escapeHtml(user.email || "-")}<br />
        <span class="text-secondary">Telefone:</span> ${phone}<br />
        <span class="text-secondary">Criado:</span> ${escapeHtml(formatDate(user.created_at))}
      </p>

      <div class="admin-card-item__actions">
        <button class="btn btn-outline-dark btn-sm" type="button" data-action="edit" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-pencil me-2"></i>Editar
        </button>
        <button class="btn btn-outline-secondary btn-sm" type="button" data-action="reset" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-key me-2"></i>Reset
        </button>
        <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(user.id)}">
          <i class="bi bi-trash me-2"></i>Excluir
        </button>
      </div>
    </article>
  `.trim();
}

function openModal(modalEl) {
  if (!window.bootstrap?.Modal) return null;
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
  return modal;
}

async function loadUsers() {
  const token = getToken();
  if (!token) {
    const error = new Error("Faça login como admin para acessar usuários.");
    error.statusCode = 401;
    throw error;
  }

  return apiFetchData("/.netlify/functions/user?limit=50&offset=0", { method: "GET", token });
}

async function createUser(body) {
  const token = getToken();
  return apiFetchData("/.netlify/functions/user", { method: "POST", token, body });
}

async function updateUser({ id, patch }) {
  const token = getToken();
  return apiFetchData(`/.netlify/functions/user?id=${encodeURIComponent(id)}`, { method: "PUT", token, body: patch });
}

async function deleteUser(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/user?id=${encodeURIComponent(id)}`, { method: "DELETE", token });
}

function buildPatchFromForm({ isCreate }) {
  const name = qs("#userName")?.value || "";
  const email = qs("#userEmail")?.value || "";
  const phoneValue = qs("#userPhone")?.value || "";
  const passwordValue = qs("#userPassword")?.value || "";
  const role = qs("#userRole")?.value || "common";
  const isActive = (qs("#userActive")?.value || "true") === "true";

  const body = {
    name,
    email,
    phone: phoneValue ? phoneValue : null,
    role,
    is_active: isActive,
  };

  if (isCreate) body.password = passwordValue;
  else if (passwordValue) body.password = passwordValue;

  return body;
}

export function mountUsersTable() {
  const alertBox = qs("#adminAlert");
  const tbody = qs("#usersTbody");
  const cards = qs("#usersCards");
  const refreshBtn = qs("#usersRefresh");
  const createBtn = qs("#usersCreate");

  const modalEl = qs("#userModal");
  const formEl = qs("#userForm");
  const saveBtn = qs("#saveUserBtn");
  const resetBtn = qs("#resetPasswordBtn");
  const titleEl = qs("#userModalTitle");

  if (!tbody) return;

  let usersById = new Map();
  let isCreateMode = false;

  const render = async () => {
    refreshBtn?.setAttribute("disabled", "disabled");
    tbody.innerHTML = "";
    if (cards) cards.innerHTML = "";
    setAlert(alertBox, { message: null });

    try {
      const list = await loadUsers();
      const items = list?.items || [];
      usersById = new Map(items.map((u) => [u.id, u]));

      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary py-4">Nenhum usuário.</td></tr>`;
        if (cards) cards.innerHTML = `<div class="text-center text-secondary py-2">Nenhum usuário.</div>`;
        return;
      }

      tbody.innerHTML = items.map(rowTemplate).join("");
      if (cards) cards.innerHTML = items.map(cardTemplate).join("");
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao carregar usuários." });
    } finally {
      refreshBtn?.removeAttribute("disabled");
    }
  };

  createBtn?.addEventListener("click", () => {
    if (!modalEl || !formEl) return;

    isCreateMode = true;
    if (titleEl) titleEl.textContent = "Novo usuário";
    qs("#userId").value = "";
    qs("#userName").value = "";
    qs("#userEmail").value = "";
    qs("#userPhone").value = "";
    qs("#userPassword").value = "";
    qs("#userRole").value = "common";
    qs("#userActive").value = "true";
    resetBtn?.classList.add("d-none");
    openModal(modalEl);
  });

  refreshBtn?.addEventListener("click", render);

  const handleClick = async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!id) return;

    if (action === "edit") {
      const user = usersById.get(id);
      if (!user || !modalEl) return;

      isCreateMode = false;
      if (titleEl) titleEl.textContent = "Editar usuário";
      qs("#userId").value = user.id;
      qs("#userName").value = user.name || "";
      qs("#userEmail").value = user.email || "";
      qs("#userPhone").value = user.phone || "";
      qs("#userPassword").value = "";
      qs("#userRole").value = user.role || "common";
      qs("#userActive").value = user.is_active ? "true" : "false";
      resetBtn?.classList.remove("d-none");
      openModal(modalEl);
      return;
    }

    if (action === "reset") {
      if (!confirm('Resetar a senha para "mary1234"?')) return;

      btn.setAttribute("disabled", "disabled");
      try {
        await updateUser({ id, patch: { password: "mary1234" } });
        setAlert(alertBox, { type: "success", message: "Senha resetada com sucesso." });
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao resetar senha." });
      } finally {
        btn.removeAttribute("disabled");
      }
      return;
    }

    if (action === "delete") {
      if (!confirm("Excluir este usuário?")) return;

      btn.setAttribute("disabled", "disabled");
      try {
        await deleteUser(id);
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao excluir usuário." });
      } finally {
        btn.removeAttribute("disabled");
      }
    }
  };

  tbody.addEventListener("click", handleClick);
  cards?.addEventListener("click", handleClick);

  formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(alertBox, { message: null });

    const id = qs("#userId")?.value || "";
    const patch = buildPatchFromForm({ isCreate: isCreateMode });

    saveBtn?.setAttribute("disabled", "disabled");
    try {
      if (isCreateMode) {
        await createUser(patch);
      } else {
        if (!id) throw new Error("Missing user id.");
        await updateUser({ id, patch });
      }

      if (modalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      await render();
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao salvar usuário." });
    } finally {
      saveBtn?.removeAttribute("disabled");
    }
  });

  resetBtn?.addEventListener("click", () => {
    const userId = qs("#userId")?.value || "";
    if (!userId) return;
    const resetButton = qs(`[data-action="reset"][data-id="${CSS.escape(userId)}"]`);
    resetButton?.click();
  });

  render();
}

