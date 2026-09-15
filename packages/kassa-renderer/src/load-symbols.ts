import fs from 'fs';

export async function loadSvgFile(filepath: string): Promise<string> {
  const text = await fs.promises.readFile(filepath, "utf8");
  return text;
}

