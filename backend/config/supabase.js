
const { createClient } = require("@supabase/supabase-js");

const { getEnv, requireHttpUrl } = require("./env");

const rawSupabaseUrl = String(getEnv("SUPABASE_URL", { required: true }) || "").trim();

if (/^postgres(ql)?:\/\//i.test(rawSupabaseUrl)) {
  throw new Error(
    "SUPABASE_URL must be your Supabase Project URL (https://<project-ref>.supabase.co), not a Postgres connection string (postgresql://...)."
  );
}

const supabaseUrl = requireHttpUrl("SUPABASE_URL", rawSupabaseUrl);

try {
  const parsed = new URL(supabaseUrl);
  if (parsed.hostname && /^db\./i.test(parsed.hostname) && /\.supabase\.co$/i.test(parsed.hostname)) {
    throw new Error(
      "SUPABASE_URL must be your Supabase Project URL (https://<project-ref>.supabase.co). You are using the Postgres host (https://db.<project-ref>.supabase.co)."
    );
  }
} catch (error) {
  if (error && error.message) throw error;
  throw new Error("SUPABASE_URL must be a valid HTTP or HTTPS URL.");
}

const supabaseKey =
  String(getEnv("SUPABASE_SERVICE_ROLE_KEY") || "").trim() || String(getEnv("SUPABASE_ANON_KEY") || "").trim();

if (!supabaseKey) {
  throw new Error("Missing required env var: SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

module.exports = { supabase };
