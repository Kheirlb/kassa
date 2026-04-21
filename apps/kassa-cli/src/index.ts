import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { renderSvg } from '@kassa/renderer';
import { compileProjectFromMemory } from '@kassa/compiler'; 
import { CoreDiagnostic } from '@kassa/core';

// Create a function that reads the provided file from disk.
function readFileFromDisk(id: string): string | undefined {
  try {
    return fs.readFileSync(id, 'utf-8');
  } catch (err) {
    console.error(`Error reading file ${id}:`, err);
    return undefined;
  }
}

function checkDiagnostics(diagnostics: CoreDiagnostic[]): boolean {
  return diagnostics.some(diag => diag.severity === 1);
}

function printDiagnostics(diagnostics: CoreDiagnostic[]) {
  for (const diag of diagnostics) {
    // Format diagnostics nicely for VSCode or other editors (e.g. with file/line info if available)
    // Serverity mapping: 1 = error, 2 = warning, 3 = info, 4 = hint
    const severityStr = diag.severity === 1 ? 'error' : diag.severity === 2 ? 'warning' : diag.severity === 3 ? 'info' : 'hint';
    console.error(`- [${severityStr}] ${diag.uriString}:${diag.range?.start.line}:${diag.range?.start.column} - ${diag.message}`);
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
  .action(async (file, options) => {
    const filepath = path.resolve(file);
    const result = await compileProjectFromMemory(filepath, {
      readFile: readFileFromDisk,
      resolveImport: (from, importPath) => path.resolve(path.dirname(from), importPath)
    });
    if (result.diagnostics.length > 0) {
      printDiagnostics(result.diagnostics);
      process.exit(1);
    } else {
      console.log('Compilation successful. No errors found.');
    }
  });

program
  .command('compile <file>')
  .description('Compile a Kassa file to IR')
  .option('-q, --quiet', 'Suppress warnings in output')
  .option('-o, --out <file>', 'Output file (default: stdout)')
  .action(async (file, options) => {
    const filepath = path.resolve(file);
    const result = await compileProjectFromMemory(filepath, {
      readFile: readFileFromDisk,
      resolveImport: (from, importPath) => path.resolve(path.dirname(from), importPath)
    });
    const hasError = checkDiagnostics(result.diagnostics);
    if (hasError) {
      console.error('Compilation failed with errors:');
      printDiagnostics(result.diagnostics);
      process.exit(1);
    }

    const output = JSON.stringify(result, null, 2);

    if (options.out) {
      fs.writeFileSync(options.out, output);
      console.log(`Wrote IR to ${options.out}`);
    } else {
      console.log(output);
      if (result.diagnostics.length > 0 && !options.quiet) {
        console.warn('Compilation completed with warnings:');
        printDiagnostics(result.diagnostics);
      }
    }
  });

program
  .command('render <file>')
  .action(async (file) => {
    const filepath = path.resolve(file);
    const result = await compileProjectFromMemory(filepath, {
      readFile: readFileFromDisk,
      resolveImport: (from, importPath) => path.resolve(path.dirname(from), importPath)
    });
    const svg = renderSvg();
    console.log(svg);
  });

// Check if no arguments were provided, and show help in that case.
if (process.argv.length <= 2) {
  console.log("No command provided.");
  program.help();
}
program.parse(process.argv);
