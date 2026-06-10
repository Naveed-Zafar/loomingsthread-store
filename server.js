const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = http.createServer((req, res) => {
  const cleanUrl = decodeURIComponent(req.url.split("?")[0]);
  const publicPrefixes = ["/products/", "/banners/", "/videos/", "/logo/"];
  let filePath = cleanUrl.startsWith("/product/")
    ? path.join(root, "pages", cleanUrl)
    : publicPrefixes.some(prefix => cleanUrl.startsWith(prefix))
    ? path.join(root, "public", cleanUrl)
    : path.join(root, cleanUrl === "/" ? "index.html" : cleanUrl);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, "index.html");
    if (err || (!stat.isFile() && !stat.isDirectory())) filePath = path.join(root, "index.html");
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(data);
    });
  });
});

const port = process.env.PORT || 4173;
server.listen(port, () => console.log(`The Leather Atelier: http://localhost:${port}`));
