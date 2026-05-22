function normalizeWhatsAppNumber(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function openWhatsAppMobile({ waNumber, waText }) {
  const phone = normalizeWhatsAppNumber(waNumber);
  if (!phone) {
    alert("Telefone inv\u00e1lido.");
    return;
  }

  const text = encodeURIComponent(String(waText || ""));
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const deepLink = `whatsapp://send?phone=${phone}&text=${text}`;
  const webLink = `https://wa.me/${phone}?text=${text}`;

  if (!isMobile) {
    window.open(webLink, "_blank", "noopener");
    return;
  }

  window.location.href = deepLink;
  setTimeout(() => {
    window.location.href = webLink;
  }, 1400);
}

