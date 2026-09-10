# Ousia Design — portfolio website

Static HTML/CSS/JS portfolio site. No framework or build step required.

## Open locally in Visual Studio Code
1. Open this folder in VS Code.
2. Install the **Live Server** extension (optional but recommended).
3. Right-click `index.html` → **Open with Live Server**.

## Before launch — one required edit
Open `assets/site.js` and replace:
- `CHANGE-ME@example.com`
- LinkedIn `#`
- Instagram `#`
with your real contact details.

## Deploy
Upload the complete folder to Netlify / Vercel / Cloudflare Pages / your normal web host.
Because the site is static, no build command is required. The publish/output directory is the site root.

## Domain
Connect any domain you want at your host. The site does not depend on Framer.

## Content notes
Fields marked **To confirm** were not reliably established from the source portfolio and were intentionally not invented. Replace these in the relevant `projects/.../index.html` files when confirmed.

## Main files
- `index.html` — home / selected projects
- `about/index.html`
- `contact/index.html`
- `projects/*/index.html` — individual case studies
- `assets/style.css` — visual system
- `assets/site.js` — contact/social configuration + mobile menu
- `Ousia_Design_Portfolio_2026.pdf` — downloadable portfolio
