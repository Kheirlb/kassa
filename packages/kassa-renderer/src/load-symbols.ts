import { readdir, readFile } from 'fs/promises';
import path from 'path';

export async function loadSvgFile(filepath: string): Promise<string> {
  return await readFile(filepath, "utf8");
}

export type SvgMap = Map<string, string>;

export async function loadSvgs(directory: string): Promise<SvgMap> {
  const svgMap: SvgMap = new Map<string, string>();
  const files = await readdir(directory);
  for (const file of files) {
    const name = path.parse(file).name;
    const fullPath = path.join(directory, file);
    const svg = await readFile(fullPath, "utf8");
    if (svgMap.has(name)) {
      console.warn(`${name} already exists, overwriting`)
    }
    svgMap.set(name, svg);
  }
  return svgMap;
}
