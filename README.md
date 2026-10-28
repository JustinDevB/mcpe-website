# MinecraftPlanetEarth — Website v1.8

A modern, feature-led landing page for MinecraftPlanetEarth. The page keeps the animated 3D globe and dark blue-green visual identity while making gameplay systems and community resources much easier to discover. The standalone “01 The World” map introduction section has been removed to make the homepage more concise; the live map remains accessible through the resource hub and feature cards. The hero is centered around a **real animated 3D globe** rendered with a small custom WebGL renderer—no Three.js, npm, build process, backend, or external globe service is required. On WebGL-capable browsers, drag the globe to rotate it; if WebGL is unavailable, a CSS-animated globe remains visible.

## What changed in v1.8

- Removed the secondary hero scroll link and adjusted the hero footer spacing.
- Rephrased the page metadata, hero, highlight strip, and footer to focus on player-shaped worldbuilding and server history.
- Updated the hero tagline to “THE ORIGINAL MINECRAFT EARTH SERVER · EST. 2013”.
- Updated the technology feature to highlight Minetorio.

## What changed in v1.7

- Removed the standalone “01 The World” section and its large map callout.
- Renumbered the remaining homepage sections from 01–04.
- Updated the hero scroll cue to point to Features and removed the footer link to the deleted section; the cue itself is removed in v1.8.

## What changed in v1.6

- Replaced the Discord resource card with an embedded official Discord server widget using the supplied server ID.
- Added a dedicated Discord community panel with a clear Join Discord call to action and concise benefits.
- Kept the Wiki, BlueMap, and Store as three primary resource cards; the layout adapts across desktop, tablet, and mobile.
- Made the widget responsive while preserving its 500px height on narrow screens, plus the official sandbox permissions.

## What changed in v1.5

- Rebuilt the gameplay section around six concrete feature cards: Earth exploration, Towny towns and nations, geopolitics, Minetorio technology, mcMMO and brewing, and Movecraft and space exploration.
- Added a dedicated resource hub with prominent cards for the Wiki & Guides, Discord, BlueMap live map, and official Store.
- Put direct Live Map, Wiki, and Discord links in the desktop navigation, and added all major resources to the mobile menu.
- Added quick Wiki and Discord links next to the server address in the hero so new visitors can find the community and documentation immediately.
- Repeated clear Wiki and Discord calls to action at relevant points in the page without changing the dark visual style or rotating globe.
- Tested the page at desktop, tablet, and mobile widths; no horizontal overflow was detected at 1440px, 820px, or 390px widths.

## What changed in v1.4

- Replaced the near-white World and Legacy section backgrounds with muted midnight blue and deep blue-green surfaces.
- Restyled the map callout and history timeline to use dark panels, softer borders, brighter text, and consistent green accents.
- Kept the existing layout, globe behavior, server links, and interactions unchanged.

## What changed in v1.3

- Replaced the antique atlas / framed-map aesthetic with a dark, modern interface, strong typography, green-blue accents, and generous spacing.
- Added a rotating, interactive 3D globe using the project's existing geographically accurate coastline data. The globe texture is local at `assets/globe-texture.svg`.
- Added a CSS-rendered fallback if WebGL or the globe texture is unavailable.
- Made the live map and server address the primary actions, with Copy IP buttons and server status.
- Simplified the page into World, Features, Legacy, and Community sections.
- Kept the original server icon unchanged and preserved the site URLs.
- Kept the project static-hosting friendly for GitHub Pages.

## Preview locally

Open the `MinecraftPlanetEarth-Website` folder in IntelliJ IDEA. To preview the site from a local web server, run this in the project root:

```sh
python -m http.server 8080
```

Then open http://localhost:8080. You can also use JDK 18+ with `jwebserver -p 8080 -d .`. A local HTTP server is recommended because it avoids browser restrictions on loading SVG textures into WebGL from `file://` URLs.

## Structure

```
MinecraftPlanetEarth-Website/
├── index.html
├── css/style.css
├── js/main.js
├── assets/
│   ├── globe-texture.svg   Local coastline texture for the animated globe
│   ├── atlas.svg           Original atlas artwork (retained)
│   └── server-icon.png    Original server icon, unchanged
├── .gitignore
└── README.md
```

## Server links

- Minecraft Java: `mc.minecraftplanetearth.com`
- Wiki: https://docs.minecraftplanetearth.com/
- World map: https://map.minecraftplanetearth.com/
- Store: https://shop.minecraftplanetearth.com/
- Discord: https://discord.minecraftplanetearth.com/

Check that the links and DNS are still correct before publishing.

## Server status

The browser queries `https://api.mcsrvstat.us/3/mc.minecraftplanetearth.com`. If the status service cannot be reached, the site says status is unavailable instead of claiming the server is offline. This is a third-party service; no credentials are needed. Edit the `CONFIG` object near the top of `js/main.js` to change the address or status API.

## The globe

`assets/globe-texture.svg` is generated from the project's existing geographic coastline paths, with a new ocean/land palette and subtle graticule. `js/main.js` builds a sphere mesh and renders it with WebGL shaders, directional shading, and continuous rotation. Pointer dragging rotates the globe manually. Reduced-motion preferences disable continuous motion. If WebGL is unavailable, the CSS globe fallback remains visible.

The globe is a stylized geographic overview, **not a live rendering of player claims or towns**. The Live Map links open your actual server map at `map.minecraftplanetearth.com`.

## GitHub Pages deployment

1. Create or select the website repository and upload the project files with `index.html` at the repository root.
2. In **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Preview the generated GitHub Pages URL before changing production DNS.
4. When approved, configure the custom domain in GitHub Pages and follow GitHub's current DNS instructions. Do not remove or alter the `mc`, `docs`, `map`, `shop`, or `discord` records when changing only the root website.

No CNAME file is included, so this ZIP can be previewed safely without immediately claiming your production domain.

## Final checklist

- [ ] Preview at desktop, tablet, and mobile sizes.
- [ ] Test globe rotation by dragging on desktop and touch screens.
- [ ] Test Copy IP and status in a real browser.
- [ ] Verify the Wiki, Live Map, Store, and Discord destinations.
- [ ] Approve the preview before changing production DNS.
