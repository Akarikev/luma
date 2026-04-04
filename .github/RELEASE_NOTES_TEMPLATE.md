# Release notes (draft)

Use this when editing a **draft** release on GitHub (the workflow creates drafts from version tags).

## Title

Suggested pattern: `Luma vX.Y.Z (Linux x86_64 / amd64)`

## Body (copy/paste and fill in)

### Highlights (optional — 2–4 bullets for skimmers)

- …
- …

---

**Linux — 64-bit Intel/AMD (x86_64):** If you use Debian or Ubuntu, packages are often labeled `**amd64`**. That is the **same** architecture as `**x86_64`** / `x86_64-unknown-linux-gnu`. Use the `.deb` **amd64** build, the AppImage, or the `.rpm` attached to this release.

**Search:** `x86_64`, `amd64`, `linux`, `AppImage`, `deb`, `rpm`

---

### Install

- **.deb:** `sudo apt install ./luma_*.deb`
- **AppImage:** `chmod +x Luma_*.AppImage && ./Luma_*.AppImage`

### Runtime (Linux)

See the repo [README](../README.md) — tray / AppIndicator libraries and optional `GDK_BACKEND=x11` for difficult Wayland setups.

### Changelog

**Full Changelog:** `https://github.com/Akarikev/luma/compare/vPREVIOUS...vCURRENT` (replace tags, e.g. `v0.1.0...v0.1.1`).

- …