## Learned User Preferences

- Prefers themed custom controls (e.g. duration steppers) over native inputs when default chrome clashes with the dark UI.
- Wants companion features (bubbles, gaze, chatter) tuned so they stay non-blocking, do not disrupt layout or pointer interaction, and stay rate-limited (not spammy).

## Learned Workspace Facts

- Luma is a Tauri 2 desktop productivity app with a React/Vite frontend; Bun is used for scripts (`bun run build`, `bun tauri dev`).
- The system tray exists only in the full Tauri process—use `bun tauri dev` (or npm/cargo equivalent), not Vite-only dev.
- On Linux, tray icons often need a menu on the tray item; `enableGTKAppId` in Tauri config helps GTK/StatusNotifier; primary-click behavior differs from Windows/macOS, and some DEs need the status area opened once before new indicators appear.
- If the tray fails on Linux: install `libayatana-appindicator3` or `libappindicator3`; optionally run dev with `GDK_BACKEND=x11` on difficult Wayland setups.
- React 18 Strict Mode in development can invoke functional `setState` updaters twice; avoid `notify()`, tray updates, and other one-shot side effects inside those updaters—use `useEffect` on committed transitions or perform side effects outside the updater after reading refs (applies to Pomodoro phase changes, task reminder firing, and similar patterns).
- App data is persisted with the Tauri Store plugin as discrete keys in `luma-data.json` (path defined in the frontend store module); there is no separate user-facing “memory location” unless the UI adds one.
- Regenerate tray/bundle mascot PNGs by running `python3 scripts/generate_luma_icons.py` from the repo root when changing icon art (then refresh `icon.ico` for Windows and regenerate `icon.icns` on macOS when shipping for Apple).
- The static showcase site lives under `docs/` (GitHub Pages from `/docs`); preview with a local HTTP server whose document root is `docs/` (not the repo root). Landing screenshots and favicons belong in `docs/assets/`; `public/` is for the Vite/Tauri app build only. A custom domain serves the same deployment as the default `*.github.io` URL once DNS is configured.
- Frameless window dragging via `data-tauri-drag-region` was unreliable on Linux/Wayland with WebKitGTK (e.g. breaks when a motion/transform ancestor wraps the drag target); prefer Rust window APIs or system decorations if user-movable chrome is required again.
