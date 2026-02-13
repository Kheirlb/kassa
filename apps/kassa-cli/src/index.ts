import { Command } from 'commander';
import { tightExpansionLayout } from '@kassa/layout';
import { renderSvgFromLayout } from '@kassa/renderer';
import { compileProjectFromMemory } from '@kassa/compiler'; 
console.log("Hello, Kassa CLI!");
const project = await compileProjectFromMemory("main.kassa", () => "v1: Valve\nv2: Valve\nv1 --> v2");
console.log("project", project);
const layout = tightExpansionLayout(project);
console.log("layout", layout);
const svg = renderSvgFromLayout(layout);
console.log("svg", svg);
const program = new Command();
program
  .name('kassa-cli')
  .description('CLI tool for Kassa application')
  .version('1.0.0');

program.parse(process.argv);
