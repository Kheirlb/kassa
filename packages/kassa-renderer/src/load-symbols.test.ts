import test from "node:test";
import assert from "node:assert";
import { loadSvgFile } from "./load-symbols.js";
import path from "node:path";

test('loading', async () => {
  const filepath = path.resolve("./src/symbols/valve.svg");
  const basename = path.basename(filepath)
  const svgValve = await loadSvgFile(filepath)
  assert.strictEqual(svgValve,
`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="120"
  height="120"
>
  <path
    fill="transparent"
    stroke="currentColor"
    d="m30,45 v30 l60,-30 v30 z"
  />
</svg>
`)
})
