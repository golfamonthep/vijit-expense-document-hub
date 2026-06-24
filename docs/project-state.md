# Project State

## Current Status

- STEP 06 baseline already handled LINE document intake into Supabase Storage and `documents`
- STEP 07 now adds web upload intake through the admin app

## STEP 07 Completed Work

- added `/admin/upload` upload page
- added `POST /api/admin/documents/upload`
- added `/admin/documents` placeholder list page
- added shared `createDocumentFromWebUpload()` intake flow
- reused document storage helper and repository layer
- added file validation and temporary `ADMIN_SECRET` protection
- added web upload docs and intelligence files

## Known Limitations

- admin protection is temporary and secret-based, not a full login system
- runtime upload still requires Supabase storage env to be configured
- no extraction, matching, review, or preview UI yet

## Connected Services

- GitHub repository is connected
- Vercel project is connected to GitHub and may deploy automatically on push
- production secrets are still expected to be configured later

## Next Recommended Step

Implement the first real inbox review interface on top of `/admin/documents`, including private preview access and reviewer-oriented status controls.
