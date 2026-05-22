import { apiFetch, apiFetchData } from "../../api.js";
import { getToken } from "../../auth.js";
import { escapeAttr, escapeHtml, qs, setAlert } from "../../utils/dom.js";

function openModal(modalEl) {
  if (!window.bootstrap?.Modal) return null;
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
  return modal;
}

function formatBRLFromCents(cents) {
  const value = Number(cents || 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parsePriceToCents(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;

  const normalized = s.replaceAll(".", "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;

  return Math.round(n * 100);
}

function badgeTemplate(isActive) {
  return isActive
    ? `<span class="badge text-bg-success">Ativo</span>`
    : `<span class="badge text-bg-secondary">Inativo</span>`;
}

function productCardTemplate({ product, categoryName, coverUrl }) {
  const isActive = Boolean(product.is_active);
  const description = product.description ? escapeHtml(product.description) : "";
  const hasDiscount = Number(product.discount_cents || 0) > 0;

  const price = formatBRLFromCents(product.price_cents || 0);
  const discount = hasDiscount ? formatBRLFromCents(product.discount_cents || 0) : null;
  const final = hasDiscount ? formatBRLFromCents((product.price_cents || 0) - (product.discount_cents || 0)) : null;

  return `
    <article class="admin-product" data-id="${escapeAttr(product.id)}">
      <div class="admin-product__media">
        <img
          class="admin-product__img"
          data-product-image
          data-product-id="${escapeAttr(product.id)}"
          alt="${escapeAttr(product.name || "Produto")}"
          ${coverUrl ? `src="${escapeAttr(coverUrl)}"` : ""}
        />
        <div class="admin-product__badge">${badgeTemplate(isActive)}</div>
      </div>

      <div class="admin-product__body">
        <div class="admin-product__title">
          <strong class="text-dark">${escapeHtml(product.name || "-")}</strong>
          <span class="text-secondary">${escapeHtml(categoryName || "Sem categoria")}</span>
        </div>

        <div class="admin-product__price">
          <div class="admin-product__price-main">
            <strong class="text-dark">${escapeHtml(hasDiscount ? final : price)}</strong>
            ${
              hasDiscount
                ? `<p class="admin-product__price-was">${escapeHtml(price)}</p>`
                : `<span class="admin-product__price-hint">Preço</span>`
            }
          </div>
          ${hasDiscount ? `<div class="admin-product__price-discount">Desconto: ${escapeHtml(discount)}</div>` : ""}
        </div>

        ${description ? `<p class="admin-product__desc">${description}</p>` : ""}

        <div class="admin-product__actions">
          <button class="btn btn-outline-dark btn-sm" type="button" data-action="edit" data-id="${escapeAttr(product.id)}">
            <i class="bi bi-pencil me-2"></i>Editar
          </button>
          <button class="btn btn-dark btn-sm" type="button" data-action="image" data-id="${escapeAttr(product.id)}">
            <i class="bi bi-image me-2"></i>Imagem
          </button>
          <button class="btn btn-outline-secondary btn-sm" type="button" data-action="toggle" data-id="${escapeAttr(product.id)}">
            <i class="bi bi-power me-2"></i>${isActive ? "Desativar" : "Ativar"}
          </button>
          <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete" data-id="${escapeAttr(product.id)}">
            <i class="bi bi-trash me-2"></i>Excluir
          </button>
        </div>
      </div>
    </article>
  `.trim();
}

async function loadCategories() {
  const token = getToken();
  const params = new URLSearchParams();
  params.set("limit", "200");
  params.set("offset", "0");
  return apiFetchData(`/.netlify/functions/category?${params.toString()}`, { method: "GET", token });
}

async function loadProducts({ q, categoryId, isActiveFilter }) {
  const token = getToken();
  const params = new URLSearchParams();
  params.set("limit", "100");
  params.set("offset", "0");
  if (q) params.set("q", q);
  if (categoryId) params.set("category_id", categoryId);
  if (isActiveFilter !== "all") params.set("is_active", String(isActiveFilter));

  return apiFetchData(`/.netlify/functions/product?${params.toString()}`, { method: "GET", token });
}

async function createProduct(body) {
  const token = getToken();
  return apiFetchData("/.netlify/functions/product", { method: "POST", token, body });
}

async function updateProduct({ id, patch }) {
  const token = getToken();
  return apiFetchData(`/.netlify/functions/product?id=${encodeURIComponent(id)}`, { method: "PUT", token, body: patch });
}

async function deleteProduct(id) {
  const token = getToken();
  return apiFetch(`/.netlify/functions/product?id=${encodeURIComponent(id)}`, { method: "DELETE", token });
}

async function listProductImages(productId) {
  const token = getToken();
  return apiFetchData(`/.netlify/functions/product-image?product_id=${encodeURIComponent(productId)}`, {
    method: "GET",
    token,
  });
}

async function createProductImage(body) {
  const token = getToken();
  return apiFetchData("/.netlify/functions/product-image", {
    method: "POST",
    token,
    body,
  });
}

function pickCoverUrl(images) {
  const items = Array.isArray(images) ? images : [];
  const cover = items.find((i) => i && i.is_cover && i.url) || items.find((i) => i && i.url);
  return cover?.url || null;
}

function buildProductFromForm() {
  const name = qs("#productName")?.value || "";
  const slug = qs("#productSlug")?.value || "";
  const description = qs("#productDescription")?.value || "";
  const categoryId = qs("#productCategory")?.value || "";
  const priceRaw = qs("#productPrice")?.value || "";
  const discountRaw = qs("#productDiscount")?.value || "";
  const isActive = (qs("#productActive")?.value || "true") === "true";

  const trimmedName = String(name).trim();
  if (!trimmedName) throw new Error("Por favor, preencha o nome do produto.");

  const trimmedCategory = String(categoryId).trim();
  if (!trimmedCategory) throw new Error("Por favor, escolha uma categoria.");

  const priceCents = parsePriceToCents(priceRaw);
  if (priceCents === null) throw new Error("Por favor, informe um preço válido.");

  const discountCents = discountRaw ? parsePriceToCents(discountRaw) : 0;
  if (discountCents === null) throw new Error("Desconto inválido.");

  if (discountCents > priceCents) throw new Error("O desconto não pode ser maior que o preço.");

  const payload = {
    name: trimmedName,
    category_id: trimmedCategory,
    price_cents: priceCents,
    discount_cents: discountCents,
    description: description ? String(description).trim() : null,
    is_active: isActive,
  };

  if (slug && String(slug).trim()) payload.slug = String(slug).trim();
  return payload;
}

function setImagePreview({ url, show }) {
  const img = qs("#imagePreview");
  const placeholder = qs("#imagePreviewPlaceholder");
  if (!img || !placeholder) return;

  if (!show) {
    img.removeAttribute("src");
    img.classList.remove("is-visible");
    placeholder.classList.remove("d-none");
    return;
  }

  img.src = url;
  img.classList.add("is-visible");
  placeholder.classList.add("d-none");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export function mountProductsPage() {
  const alertBox = qs("#adminAlert");
  const empty = qs("#productsEmpty");
  const grid = qs("#productsGrid");
  const refreshBtn = qs("#productsRefresh");
  const createBtn = qs("#productsCreate");
  const searchInput = qs("#productsSearch");
  const statusSelect = qs("#productsStatus");
  const filterCategorySelect = qs("#productsCategory");

  const productModalEl = qs("#productModal");
  const productTitleEl = qs("#productModalTitle");
  const productFormEl = qs("#productForm");
  const saveProductBtn = qs("#saveProductBtn");

  const imageModalEl = qs("#imageModal");
  const imageTitleEl = qs("#imageModalTitle");
  const imageFormEl = qs("#imageForm");
  const uploadBtn = qs("#uploadImageBtn");
  const imageAlert = qs("#imageAlert");
  const imageFileInput = qs("#imageFile");

  if (!grid) return;

  let categoriesById = new Map();
  let productsById = new Map();
  let coverByProductId = new Map();
  let isCreateMode = false;

  const populateCategorySelects = (items) => {
    const options = [`<option value="">Selecione...</option>`];
    for (const c of items) {
      options.push(`<option value="${escapeAttr(c.id)}">${escapeHtml(c.name || "-")}</option>`);
    }

    if (qs("#productCategory")) qs("#productCategory").innerHTML = options.join("");
    if (filterCategorySelect) {
      filterCategorySelect.innerHTML = [`<option value="">Todas</option>`, ...options.slice(1)].join("");
    }
  };

  const loadAllCategories = async () => {
    const list = await loadCategories();
    const items = list?.items || [];
    categoriesById = new Map(items.map((c) => [c.id, c]));
    populateCategorySelects(items);
  };

  const render = async () => {
    refreshBtn?.setAttribute("disabled", "disabled");
    grid.innerHTML = "";
    empty?.classList.add("d-none");
    setAlert(alertBox, { message: null });

    try {
      if (categoriesById.size === 0) await loadAllCategories();

      const q = String(searchInput?.value || "").trim();
      const status = String(statusSelect?.value || "all");
      const categoryId = String(filterCategorySelect?.value || "").trim();

      const list = await loadProducts({ q, categoryId, isActiveFilter: status });
      const items = list?.items || [];
      productsById = new Map(items.map((p) => [p.id, p]));

      if (items.length === 0) {
        empty?.classList.remove("d-none");
        return;
      }

      grid.innerHTML = items
        .map((p) => {
          const categoryName = categoriesById.get(p.category_id)?.name || null;
          const coverUrl = coverByProductId.get(p.id) || null;
          return productCardTemplate({ product: p, categoryName, coverUrl });
        })
        .join("");

      const toPrefetch = items.slice(0, 12);
      await Promise.all(
        toPrefetch.map(async (p) => {
          if (coverByProductId.has(p.id)) return;
          try {
            const images = await listProductImages(p.id);
            const url = pickCoverUrl(images);
            if (url) {
              coverByProductId.set(p.id, url);
              const img = grid.querySelector(`[data-product-image][data-product-id="${CSS.escape(p.id)}"]`);
              if (img && !img.getAttribute("src")) img.setAttribute("src", url);
            }
          } catch {
            // ignore image prefetch errors
          }
        })
      );
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao carregar produtos." });
    } finally {
      refreshBtn?.removeAttribute("disabled");
    }
  };

  const openCreate = async () => {
    if (!productModalEl || !productFormEl) return;
    isCreateMode = true;
    if (productTitleEl) productTitleEl.textContent = "Novo produto";

    if (categoriesById.size === 0) await loadAllCategories();

    qs("#productId").value = "";
    qs("#productName").value = "";
    qs("#productSlug").value = "";
    qs("#productDescription").value = "";
    qs("#productPrice").value = "";
    qs("#productDiscount").value = "";
    qs("#productActive").value = "true";
    qs("#productCategory").value = "";
    openModal(productModalEl);
  };

  createBtn?.addEventListener("click", () => {
    openCreate().catch((e) => setAlert(alertBox, { type: "danger", message: e.message || "Falha ao abrir formulário." }));
  });

  refreshBtn?.addEventListener("click", render);

  let searchTimer = null;
  searchInput?.addEventListener("input", () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 250);
  });
  statusSelect?.addEventListener("change", render);
  filterCategorySelect?.addEventListener("change", render);

  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "edit") {
      const product = productsById.get(id);
      if (!product || !productModalEl) return;
      isCreateMode = false;
      if (productTitleEl) productTitleEl.textContent = "Editar produto";

      if (categoriesById.size === 0) await loadAllCategories();

      qs("#productId").value = product.id;
      qs("#productName").value = product.name || "";
      qs("#productSlug").value = product.slug || "";
      qs("#productDescription").value = product.description || "";
      qs("#productPrice").value = ((product.price_cents || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      qs("#productDiscount").value = ((product.discount_cents || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      qs("#productActive").value = product.is_active ? "true" : "false";
      qs("#productCategory").value = product.category_id || "";
      openModal(productModalEl);
      return;
    }

    if (action === "toggle") {
      const product = productsById.get(id);
      if (!product) return;
      btn.setAttribute("disabled", "disabled");
      setAlert(alertBox, { message: null });
      try {
        await updateProduct({ id, patch: { is_active: !product.is_active } });
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao atualizar produto." });
      } finally {
        btn.removeAttribute("disabled");
      }
      return;
    }

    if (action === "delete") {
      if (!confirm("Excluir este produto?")) return;
      btn.setAttribute("disabled", "disabled");
      setAlert(alertBox, { message: null });
      try {
        await deleteProduct(id);
        coverByProductId.delete(id);
        await render();
      } catch (error) {
        setAlert(alertBox, { type: "danger", message: error.message || "Falha ao excluir produto." });
      } finally {
        btn.removeAttribute("disabled");
      }
      return;
    }

    if (action === "image") {
      const product = productsById.get(id);
      if (!product || !imageModalEl) return;

      if (imageTitleEl) imageTitleEl.textContent = `Imagem: ${product.name || "Produto"}`;
      qs("#imageProductId").value = product.id;
      qs("#imageAlt").value = "";
      qs("#imageIsCover").checked = true;
      if (imageAlert) imageAlert.innerHTML = "";
      if (imageFileInput) imageFileInput.value = "";
      setImagePreview({ url: "", show: false });

      openModal(imageModalEl);
    }
  });

  productFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(alertBox, { message: null });

    const id = qs("#productId")?.value || "";

    saveProductBtn?.setAttribute("disabled", "disabled");
    try {
      const payload = buildProductFromForm();
      if (isCreateMode) {
        await createProduct(payload);
      } else {
        if (!id) throw new Error("Missing product id.");
        await updateProduct({ id, patch: payload });
      }

      if (productModalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(productModalEl).hide();
      await render();
    } catch (error) {
      setAlert(alertBox, { type: "danger", message: error.message || "Falha ao salvar produto." });
    } finally {
      saveProductBtn?.removeAttribute("disabled");
    }
  });

  imageFileInput?.addEventListener("change", async () => {
    if (!imageAlert) return;
    setAlert(imageAlert, { message: null });

    const file = imageFileInput.files && imageFileInput.files[0] ? imageFileInput.files[0] : null;
    if (!file) {
      setImagePreview({ url: "", show: false });
      return;
    }

    if (!String(file.type || "").startsWith("image/")) {
      setAlert(imageAlert, { type: "danger", message: "Por favor, selecione um arquivo de imagem." });
      imageFileInput.value = "";
      setImagePreview({ url: "", show: false });
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setAlert(imageAlert, { type: "danger", message: "Imagem muito grande. Máximo: 5MB." });
      imageFileInput.value = "";
      setImagePreview({ url: "", show: false });
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview({ url: dataUrl, show: true });
    } catch (error) {
      setAlert(imageAlert, { type: "danger", message: error.message || "Falha ao gerar prévia." });
      setImagePreview({ url: "", show: false });
    }
  });

  imageFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!imageAlert) return;
    setAlert(imageAlert, { message: null });

    const productId = String(qs("#imageProductId")?.value || "").trim();
    if (!productId) return;

    const file = imageFileInput?.files && imageFileInput.files[0] ? imageFileInput.files[0] : null;
    if (!file) {
      setAlert(imageAlert, { type: "danger", message: "Selecione uma imagem antes de enviar." });
      return;
    }

    uploadBtn?.setAttribute("disabled", "disabled");
    try {
      const base64 = await fileToDataUrl(file);
      const filename = file.name || "image";
      const altText = String(qs("#imageAlt")?.value || "").trim();
      const isCover = Boolean(qs("#imageIsCover")?.checked);

      const created = await createProductImage({
        product_id: productId,
        filename,
        base64,
        alt_text: altText ? altText : null,
        is_cover: isCover,
      });

      const newUrl = created?.url || null;
      if (newUrl) {
        coverByProductId.set(productId, newUrl);
        const img = grid.querySelector(`[data-product-image][data-product-id="${CSS.escape(productId)}"]`);
        if (img) img.setAttribute("src", newUrl);
      }

      setAlert(imageAlert, { type: "success", message: "Imagem enviada com sucesso." });
      if (imageModalEl && window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance(imageModalEl).hide();
    } catch (error) {
      setAlert(imageAlert, { type: "danger", message: error.message || "Falha ao enviar imagem." });
    } finally {
      uploadBtn?.removeAttribute("disabled");
    }
  });

  loadAllCategories()
    .then(render)
    .catch((error) => setAlert(alertBox, { type: "danger", message: error.message || "Falha ao iniciar página." }));
}

