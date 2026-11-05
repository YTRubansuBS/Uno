module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ""
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""

  // Never overwrite a valid client-side config with empty environment values.
  const cfg = {}
  if (url) cfg.SUPABASE_URL = url
  if (key) cfg.SUPABASE_ANON_KEY = key
  cfg.ADMIN_USERNAME = "Rubansu1"

  res.status(200).send(`window.IR_CONFIG = Object.assign({}, window.IR_CONFIG || {}, ${JSON.stringify(cfg)})`)
}
