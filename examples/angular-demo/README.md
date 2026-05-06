# angular-demo

Minimal Angular 21 app showing `watermark-shield` in action via the
`WatermarkShieldService` from `watermark-shield/angular`.

## Run locally

This demo consumes the library from a sibling build output
(`../../dist/watermark-shield`), so build the library first from the
repository root:

```bash
# from the repository root
npm install
npm run build

# then in this folder
cd examples/angular-demo
npm install
npm start
```

Open http://localhost:4200 — you'll see the watermark tiled across the
viewport with theme-aware colours (toggle your OS light/dark theme to
watch it re-render).

## What the demo shows

- `WatermarkShieldService.create(...)` injecting a tiled watermark.
- A `{ light, dark }` `ColorPair` so the watermark contrasts with the
  user's system theme.
- `protect.{ devtool, disableMenu, debuggerLoop }` toggles for the
  optional active defenses (kept off here so headless preview tools
  don't trip the detector).
