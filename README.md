# Samatar Elmi website rebuild

This folder is ready to publish from the root of the `SamatarElmi86/samatarelmi` GitHub Pages repository.

## Main pages

- `index.html` - home
- `about.html` - long biography
- `writing.html` - books, 2026 collections and forthcoming work
- `music.html` - Knomad Spock music and listening links
- `events.html` - 24 active dates from the supplied 2026 tour workbook, with the cancelled 24 October Mason & Fifth date removed
- `gallery.html` - filterable gallery with 221 web-ready photographs and films across seven collections
- `education-editorial.html` - combined education and editorial page
- `press.html` - approved bios, credits and downloadable press kit
- `contact.html` - general and literary contacts

`graft.html`, `hilaac.html`, `newsletter.html` and `reviews.html` are redirect-only files for old links. They are not part of the navigation or the new content structure.

## Publishing

1. Replace the current repository root contents with this folder's contents.
2. Keep `CNAME` in the repository root. It contains `samatarelmi.co.uk`.
3. Commit and push to the branch configured for GitHub Pages, currently expected to be `main`.
4. In GitHub Pages settings, confirm the custom domain is `samatarelmi.co.uk` and HTTPS enforcement is enabled.
5. No Squarespace DNS change should be needed if the current GitHub Pages site already works on the `.co.uk` domain.

## Gallery

The source archive remains unchanged outside this site. The website contains optimised WebP images and browser-friendly MP4 copies. Six exact duplicate photographs and one duplicate video were included only once. No web file exceeds GitHub's 100 MB per-file limit.

Future additions can use the same seven folders: Analog, Collaborations, Creative Process, Digital, Installations, Performances and Portraits. The gallery manifest is `assets/gallery/manifest.json`; `assets/gallery/gallery-data.js` is the browser-ready version of the same data.

## Confirmed updates and outstanding items

- The 24 October 2026 Mason & Fifth date is cancelled. The 15 August Mason & Fifth date remains listed.
- The 17 September 2026 Swansea venue is Down By Here, with its live ticket page linked.
- The Southbank Centre listing links to the event-specific page for *A Celebration of British Somali Poetry* in the Purcell Room on 24 October 2026 at 12pm.
- Manchester Poetry Library is listed as `October 2026 - TBC`.
- Other ticket and course URLs remain unlinked unless an authoritative event-specific page is available.
- The approved downloadable press image is `downloads/samatar-elmi-press-photo.jpg`; the web version is `assets/images/samatar-elmi-portrait.webp`, and the photographer credit is TBC.
- The Music page presents the full 28-track album catalogue as accessible direct Bandcamp links, plus BØMBED BUILDINGS `000`, `001` and “Storm Z Meal”.
- The site continues to use `info@samatarelmi.co.uk`; `management@samatarelmi.co.uk` has not yet been created.
- Spotify is not linked until artist mapping is confirmed. Bandcamp and Apple Music are linked and tested.
