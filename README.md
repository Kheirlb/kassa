# kassa
Kassa is a schematic editor for plumbing and instrumentation diagrams (P&amp;ID)

https://karlparks.com/kassa/

# User Flows
Basic designer flow:
```mermaid
flowchart LR
    Install --> Edit --> Run --> Export
```
Expecations:
- Find cool idea online (hello there)
- Install VS Code and the Kassa VS Code Extension
- Create new Kassa project with `Kassa: New Project`
- Run the debugger via F5 (starts compiler and opens preview)
- Edit `.kassa` file, save, and watch the preview refresh
- Export svg as needed

# Development
## Installation
- https://pnpm.io/installation
- `pnpm install`

## Everyday
- `pnpm build`
- `kassa check ./examples/hello.kassa`

## Flowchart
Package organization scaffold status for MVP.
Current goal: each one has a working "build" command.

```mermaid
flowchart BT
    core[kassa-core<br/>Types]
    lang[kassa-lang<br/>DSL & AST]
    compiler[kassa-compiler<br/>Validation & Lowering]
    layout[kassa-layout<br/>Generates Layout]
    render[kassa-renderer<br/>SVG renderer]
    cli[kassa-cli<br/>Export json/svg/etc]
    vscode[kassa-vscode-ext VSCode Extension]

    core --> lang
    lang --> compiler
    core --> compiler

    compiler --> layout
    layout --> render
    compiler --> cli

    render --> cli
    core --> cli

    render --> vscode

    classDef todo stroke-width:2px,stroke-dasharray:5 5;

    class vscode todo
```

Later details:
- kassa-website (basic typescript)
- kassa-runtime/kassa-runtime-server (rust?, data bindings support)
- kassa-app (tauri/rust, data bindings support)
- kassa-ui (svelte/typescript)
