function isJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}

export async function apiFetch(endpoint, { method = "GET", body, token, headers } = {}) {
  const resolvedEndpoint = String(endpoint || "").trim();
  if (!resolvedEndpoint) throw new Error("Missing endpoint.");

  const finalHeaders = new Headers(headers || {});
  if (!finalHeaders.has("Content-Type") && body !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(resolvedEndpoint, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = isJsonResponse(response) ? await response.json() : await response.text();

  if (!response.ok || (payload && typeof payload === "object" && payload.success === false)) {
    const message =
      (payload && typeof payload === "object" && payload.message) ||
      `Request failed (${response.status})`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function apiFetchData(endpoint, options) {
  const payload = await apiFetch(endpoint, options);
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}
