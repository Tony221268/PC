# CLAUDE.md

Guidance for working in this repository.

## What this is

A **Hugo static site** — the portfolio/showcase website for **Nathalie**, a local
painter ("Palette Couleurs"). The site is in **French** and is published at
`https://www.nathaliepalettecouleurs.fr/` (set as `baseURL` in `config.toml`).

It is content-light and presentation-focused: a homepage with the artist's
statement, three image galleries (Peintures, Aquarelles, Portraits), an "À Propos"
bio page, and a Contact page (a `mailto:` link).

## Tooling

- **Hugo** is the only build tool — there is no `package.json`, npm, or JS bundler.
  Built and tested with Hugo `v0.159.1` (extended, for SCSS). The `hugo` binary is
  on `PATH` on this machine.
- Common commands:
  - `hugo server -D` — local dev server with live reload (drafts included)
  - `hugo` — build the site into `public/`
- Styling: **Bootstrap 5.1.3** + jQuery 3.6 (loaded from CDN in
  `head.html`) and **Bootstrap Icons**. Custom styles are SCSS compiled by Hugo
  Pipes from `themes/ninja/assets/scss/styles.scss`.

## Layout of the repo

- `config.toml` — site config: title, baseURL, theme, and the main nav menu.
- `content/` — all site content as **Hugo page bundles**:
  - `_index.md` — homepage (artist statement, rendered by `layouts/index.html`).
  - `apropos/`, `contact/` — simple text pages (rendered by `single.html`).
  - `peintures/`, `aquarelles/`, `portraits/` — **gallery pages**. Each holds its
    `index.md` plus the gallery's `.jpg` files directly in the folder, and sets
    `layout: carousel` in front matter.
- `themes/ninja/` — the custom theme. **All HTML/CSS lives here**, not in the
  project root. Key files:
  - `layouts/_default/carousel.html` — the gallery template: renders a grid of
    thumbnails that open a fullscreen Bootstrap modal carousel.
  - `layouts/index.html` — homepage; `layouts/_default/single.html` — text pages;
    `layouts/_default/list.html` — section/list fallback.
  - `layouts/partials/` — `pagewrapper/` (head, navbar, footer) and `widgets/`
    (carousel + thumbnail pieces).
  - `assets/scss/` — SCSS sources; `static/img/` — site chrome images (logo,
    header, artist photo).
- `public/` — generated build output. **Git-ignored** (regenerate with `hugo`).
- `resources/_gen/` — Hugo's processed-image cache. Also git-ignored.

## How the galleries work (the main thing to understand)

`carousel.html` finds images with `{{ .Resources.ByType "image" }}` — i.e. it
picks up **every image file in that page bundle's folder**, in filename order.
So to add a painting to a gallery, just drop a new `.jpg` into the corresponding
`content/<gallery>/` folder; no front matter edit is needed.

- Thumbnails are generated via Hugo image processing (`.Fit "300x300"`), which is
  why processed variants appear under `resources/_gen/images/`.
- The `resources:` mapping in each gallery's `index.md` front matter (`src: "img/*"`)
  is **vestigial and unused** — the layout grabs images by type, not by that name.

## Build & deploy workflow

`public/` is **not** committed — after editing content or templates, run `hugo`
to (re)generate it, then deploy the contents of `public/` however the host
expects (there is no CI workflow or `CNAME` in this repo, so deploy is manual).

## Notes / gotchas

- Content is French; preserve French copy and accents when editing.
- Templates load Bootstrap + jQuery from CDNs in `head.html`; there is no local
  JS build (`static/js/main.js` is empty).
