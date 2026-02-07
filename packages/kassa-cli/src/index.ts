import { Command } from 'commander';
console.log("Hello, Kassa CLI!");
const program = new Command();
program
  .name('kassa-cli')
  .description('CLI tool for Kassa application')
  .version('1.0.0');

program.parse(process.argv);
