# Luma

**Luma** is a compact Linux desktop app for everyday focus: a **Pomodoro-style timer**, **tasks**, **clipboard history**, and a quick **system stats** readout. It lives in the **system tray**—open it from the tray when you need it, or pin the window so it stays visible.


![Version](https://img.shields.io/badge/version-0.1.1-violet)

---

## Download

1. On GitHub, open **Releases** (right side of the repo) and choose the **latest** release.
2. Download the installer for your system:
   - **`.deb`** — Ubuntu, Debian, Mint, Pop!_OS, etc.
   - **AppImage** — works on many distros; make it executable, then run it.
   - **`.rpm`** — Fedora, openSUSE, etc.

**Looking for `x86_64`?** On Debian/Ubuntu the same architecture is named **`amd64`** (64-bit Intel/AMD). Rust and other docs usually say **`x86_64`** or `x86_64-unknown-linux-gnu` — same thing. Use the **`amd64`** `.deb`, the AppImage, or the `.rpm` from this repo’s releases (built on x86_64 Linux). Release titles may include **“Linux x86_64 (amd64)”** so either search term finds the right file. Maintainers can start from [`.github/RELEASE_NOTES_TEMPLATE.md`](.github/RELEASE_NOTES_TEMPLATE.md) when writing release notes.

**Debian / Ubuntu (`.deb`):**

```bash
sudo apt install ./luma_*.deb
```

**AppImage:**

```bash
chmod +x Luma_*.AppImage
./Luma_*.AppImage
```

---

## First run

- Click the **Luma** icon in the **tray / status area** to show or hide the window.
- Use the header buttons to **pin** the window, **hide** to tray, or open **Settings**.

---

## What you can do

- Run **focus** and **break** sessions with presets or custom lengths.
- Manage **tasks** (including optional **reminders** and a simpler list mode in Settings).
- Browse **recent clipboard** entries and copy again.
- Glance at **CPU / RAM / battery** (where available).
- Adjust behavior in **Settings** (panels, notifications, appearance, data folder, clear local data).

---

## Linux notes

**Tray icon missing?** Install a status / AppIndicator library (one is enough):

```bash
sudo apt install libayatana-appindicator3-1
```

or

```bash
sudo apt install libappindicator3-1
```

On some desktops the tray only shows after you open the **notification / status** area once.

**Odd behavior on Wayland?** Try running with X11 for that session:

```bash
GDK_BACKEND=x11 luma
```

(Use the real command name shown by your package or AppImage.)

---

## Build from source

For developers who prefer to compile: install [Bun](https://bun.sh), [Rust](https://rustup.rs), and [Tauri’s Linux prerequisites](https://v2.tauri.app/start/prerequisites/#linux), then:

```bash
bun install
bun tauri build
```


Outputs are under `src-tauri/target/release/bundle/`. For day-to-day work with tray and storage, use `bun tauri dev` (a browser-only `vite` dev server is not the full app).
