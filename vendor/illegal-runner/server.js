const http = require("http")
const fs = require("fs")
const path = require("path")

const PORT = process.env.PORT || 3000
const ROOT = __dirname

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0])
  if (urlPath === "/") urlPath = "/index.html"

  const filePath = path.join(ROOT, path.normalize(urlPath))
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403)
    res.end("Forbidden")
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
      res.end("<h1>404</h1>")
      return
    }
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    })
    res.end(data)
  })
})

server.listen(PORT, () => {
  console.log(`ILLEGAL RUNNER dev server on http://localhost:${PORT}`)
})
