import { Command } from 'commander';
import { tightExpansionLayout } from '@kassa/layout';
import { renderSvgFromLayout } from '@kassa/renderer';
import { compileProject } from '@kassa/compiler'; 
console.log("Hello, Kassa CLI!");
const project = compileProject("main.kassa", () => "v1 --> v2");
console.log("project");
const layout = tightExpansionLayout(project);
console.log("layout");
const svg = renderSvgFromLayout(layout);
console.log("svg", svg);
const program = new Command();
program
  .name('kassa-cli')
  .description('CLI tool for Kassa application')
  .version('1.0.0');

program.parse(process.argv);
