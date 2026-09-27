# Pre-Refactor Snapshot & Rollback Template

This directory contains the exact, pristine state of `samatarelmi.co.uk` before the site-wide design-system refactor.

## Files Preserved:
- All 19 root and subdirectory HTML pages
- `assets/css/site.css`
- `assets/js/site.js`

## How to Revert to this Snapshot:
To restore all files to their pre-refactor state, run the automated rollback script from the repository root:

```bash
node scripts/revert-to-pre-refactor.mjs
```

Or manually copy any file from `templates/backup-pre-refactor/` over to its target path.
