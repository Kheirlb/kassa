import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { renderSvg } from '@kassa/renderer';
import { compileProjectFromMemory } from '@kassa/compiler'; 

// Create a function that reads the provided file from disk.
function readFileFromDisk(id: string): string | undefined {
  try {
    return fs.readFileSync(id, 'utf-8');
  } catch (err) {
    console.error(`Error reading file ${id}:`, err);
    return undefined;
  }
}

const program = new Command();
program
  .name('kassa-cli')
  .description('CLI tool for Kassa application')
  .version('1.0.0');
program
  .command('check <file>')
  .description('Validate a Kassa file (no output)')
  .action(async (file) => {
    const entryPath = path.resolve(file);
    const result = await compileProjectFromMemory(entryPath, readFileFromDisk);
    console.log("OK");
  });
program
  .command('compile <file>')
  .description('Compile a Kassa file to IR')
  .option('-o, --out <file>', 'Output file (default: stdout)')
  .action(async (file, options) => {
    const entryPath = path.resolve(file);
    const result = await compileProjectFromMemory(entryPath, readFileFromDisk);
    const output = JSON.stringify(result, null, 2);

    if (options.out) {
      fs.writeFileSync(options.out, output);
      console.log(`Wrote IR to ${options.out}`);
    } else {
      console.log(output);
    }
  });
program
  .command('render <file>')
  .action(async (file) => {
    const project = await compileProjectFromMemory(file, readFileFromDisk);
    const svg = renderSvg();
    console.log(svg);
  });

// Check if no arguments were provided, and show help in that case.
if (process.argv.length <= 2) {
  console.log("No command provided.");
  program.help();
}
program.parse(process.argv);
