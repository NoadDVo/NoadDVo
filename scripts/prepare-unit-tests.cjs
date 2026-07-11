const { mkdirSync, writeFileSync } = require("node:fs");

mkdirSync(".tmp/unit-tests", { recursive: true });
writeFileSync(".tmp/unit-tests/package.json", '{"type":"commonjs"}\n');

