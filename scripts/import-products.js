const { spawnSync } = require("node:child_process");
const result = spawnSync(process.execPath, [require("node:path").join(__dirname, "crawl-hjleather.js")], { stdio: "inherit" });
process.exit(result.status || 0);
