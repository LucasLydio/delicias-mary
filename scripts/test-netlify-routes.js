/* eslint-disable no-console */

const DEFAULT_BASE_URL = "http://localhost:8888";

function isJsonContentType(contentType) {
  return String(contentType || "")
    .toLowerCase()
    .includes("application/json");
}

async function readBody(response) {
  const text = await response.text();
  if (!isJsonContentType(response.headers.get("content-type"))) return { text, json: null };

  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

async function run() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Use Node.js 18+.");
  }

  const baseUrl = String(process.argv[2] || process.env.BASE_URL || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;

  const tests = [
    { method: "GET", path: "/.netlify/functions/category?limit=100&offset=0&is_active=true" },
    { method: "GET", path: "/.netlify/functions/product?limit=20&offset=0&is_active=true" },
    { method: "GET", path: "/.netlify/functions/product-image?limit=20&offset=0" },
    { method: "GET", path: "/.netlify/functions/session" },
    { method: "GET", path: "/.netlify/functions/user" },
    { method: "GET", path: "/.netlify/functions/auth" },
    { method: "GET", path: "/.netlify/functions/admin" },
    { method: "GET", path: "/.netlify/functions/cart" },
    { method: "GET", path: "/.netlify/functions/contact" },
    { method: "GET", path: "/.netlify/functions/order" },
  ];

  let failures = 0;

  for (const test of tests) {
    const url = new URL(test.path, baseUrl).toString();
    const response = await fetch(url, { method: test.method });
    const { json } = await readBody(response);

    const success = json && typeof json === "object" && "success" in json ? json.success : undefined;
    const message = json && typeof json === "object" && "message" in json ? json.message : undefined;

    const parts = [`${test.method} ${test.path} -> ${response.status}`];
    if (success !== undefined) parts.push(`success: ${String(success)}`);
    if (message) parts.push(`message: ${String(message)}`);

    console.log(parts.join(" | "));

    if (response.status >= 500 && response.status !== 501) failures += 1;
  }

  if (failures > 0) {
    process.exitCode = 1;
    console.log(`\nFailures: ${failures}`);
  } else {
    console.log("\nAll routes responded without 5xx.");
  }
}

run().catch((error) => {
  console.error("Route test runner failed:", error && error.message ? error.message : error);
  process.exit(1);
});
