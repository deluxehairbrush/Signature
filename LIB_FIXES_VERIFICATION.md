# lib/ fixes — checks and tests

Scope: `lib/ai.ts`, `lib/ai-api.ts`, `lib/ocr.ts`, and the OCR test scripts under
`scripts/`. Frontend (`app/components/DealForm.tsx`, `app/test-ocr/page.tsx`)
and backend routes (`app/api/ai/*`, `app/badge/[username]/route.ts`) were left
untouched — those are owned separately.

## What changed

| File | Fix |
|---|---|
| `lib/ai-api.ts` | Dropped unverified JWT-based rate-limit identity (was trusting an unsigned `sub` claim — forgeable, let anyone bypass the limit). Rate limiting is now IP-only until token verification is wired up. Added a periodic sweep of expired rate-limit buckets so the in-memory map can't grow unbounded. |
| `lib/ai.ts` | `computeReputationScore` now filters to `status === "completed"` deals before scoring, and excludes unrated deals from `avgRating` instead of scoring them as 1-star. `normalizeMissingFields` now rebuilds `missingFields` from scratch each time instead of only ever adding to the model's list (so a field the model wrongly listed as missing, but actually extracted, gets removed). |
| `lib/ocr.ts` | Fixed an object-URL leak on OCR failure (`try/finally`). Switched from a fresh Tesseract worker per call to a single reused worker. Typed the progress logger via `Tesseract.LoggerMessage` instead of `any`. Extended `extractTextFromImage` to accept `Buffer`/path in addition to browser `File`/`Blob`, so it's callable headlessly from Node — this is what makes the script fixes below possible. |
| `scripts/test-ocr-with-images.ts` | Rewritten to run real OCR via `lib/ocr.ts` (previously broken: mixed `require`/`import`, and `URL.createObjectURL` can't feed Tesseract in Node). |
| `scripts/test-ocr-with-images.js` | Deleted — it was a hardcoded simulation that always printed `✅ PASS` regardless of what OCR actually returned. |
| `scripts/create-test-images.ts` | Deleted — divergent duplicate of `create-test-images.js`; kept the one that runs in plain Node with no extra tooling. |
| `scripts/create-test-images.js` | The "low quality" test image was crisp canvas text with light noise (scored ~89% confidence, never exercising the low-confidence UI path). Now genuinely degraded via downscale-then-upscale blur plus heavier noise. |
| `package.json` | Moved `canvas`, `typescript`, `@types/node`, `@types/react` to `devDependencies`. Added `ocr:generate-test-images`, `ocr:test-basic`, `ocr:test-images` npm scripts (run via Node's native `--experimental-strip-types`, no new dependency). Added an `engines.node >=22.6.0` field. |
| `tsconfig.json` | Added `allowImportingTsExtensions` (safe under the existing `noEmit: true`) so the scripts' explicit `.ts` import extensions typecheck. |

## Checks run

```bash
npx tsc --noEmit
```
Result: clean, no errors.

```bash
npx next build
```
Result: compiles successfully, all routes generated (`/`, `/api/ai/redflags`,
`/api/ai/summarize`, `/badge/[username]`, `/test-ocr`).

## Tests run

```bash
npm run ocr:generate-test-images
npm run ocr:test-basic
npm run ocr:test-images
```

`ocr:test-basic` — pure confidence-threshold/message logic, no images
involved:

```
High confidence (85): OK / Text quality is good
Medium confidence (65): OK / Text quality is acceptable, but please double-check important numbers
Low confidence (45): LOW / Text quality was low, please carefully review the extracted text especially numbers and prices
Very low confidence (25): LOW / (same message)
```

`ocr:test-images` — real Tesseract OCR against the three generated images
(this is the test that used to be a fake simulation):

| Image | Confidence | Notes |
|---|---|---|
| Light mode WhatsApp chat | 91% | Prices `$5000`, `$4500` extracted correctly |
| Dark mode WhatsApp chat | 89% | Prices `$5000`, `$4500` extracted correctly |
| Low quality (post-fix) | 20% | Confirms the `<60%` low-confidence warning path is genuinely exercised — before the fix this scored 89% and never triggered it |

Note: the first run of `ocr:test-images` in a shell can take a few minutes —
Tesseract downloads/initializes its WASM core and English trained-data on
first use per process; console output is also fully buffered until the
process exits when piped to a file, so a redirected run can appear to hang
even though it's progressing.

## Outstanding — for the frontend/backend owners

These were flagged in the original review but weren't fixed here because
they live in files outside this pass's scope (frontend components, API
routes). Still open:

- [ ] **`app/api/ai/redflags/route.ts`** — add `enforceRateLimit(request, "redflags")`
      at the top of the handler. It currently has no rate limit at all, so it
      can be used to burn the Groq quota through an unauthenticated endpoint.
      (`lib/ai-api.ts`'s `enforceRateLimit` already supports this — just needs
      to be called from the route, same as `summarize/route.ts` does.)

      **Test:** send 11 requests to `POST /api/ai/redflags` from the same IP
      within 60s (e.g. a small loop with `curl`/`fetch`). The 11th should
      return `429` with a `Retry-After` header, matching what
      `/api/ai/summarize` already does. Also confirm request #1–10 still
      return `200` with real red-flag results — the limit shouldn't trip
      early.

- [ ] **`app/components/DealForm.tsx`** — Ctrl+V paste doesn't work on the
      drop zone (`onPaste` is on a non-focusable `<div>`). Needs either
      `tabIndex={0}` + focus-on-click, or a `document`-level paste listener
      scoped to when image mode is active.

      **Test:** switch to "Upload Screenshot" mode, copy an image to the
      clipboard (e.g. a screenshot tool or copying an image from another
      tab), and press Ctrl+V *without clicking the drop zone first*. The
      image should be picked up and OCR should start. Repeat after clicking
      elsewhere on the page (e.g. the page background) to confirm focus
      isn't required.

- [ ] **`app/components/DealForm.tsx`** — switching from image mode back to
      text mode clears `rawText`, losing anything the user typed. Preserve
      both states across the toggle.

      **Test:** type text in "Paste Chat Text" mode, switch to "Upload
      Screenshot", switch back to "Paste Chat Text" — the typed text should
      still be there. Also check the reverse: upload/OCR an image, switch to
      text mode and back — the OCR result and preview should still be there
      too (currently `resetOCR()` clears it; decide if that's also worth
      preserving).

- [ ] **`app/components/DealForm.tsx`** — OCR failures currently use
      `alert()`; an inline error banner would match the rest of the UI.

      **Test:** trigger an OCR failure (e.g. select a non-image file via the
      file input, or temporarily break `extractTextFromImage`) and confirm
      an inline banner appears in the form instead of a blocking `alert()`
      dialog, and that it clears on the next successful upload.

- [ ] **Manual browser verification** of `/test-ocr` and the `DealForm`
      upload/paste/drag-drop flow — not exercised by this pass, since the
      new headless Node OCR test only proves `lib/ocr.ts` itself works, not
      the UI wiring around it.

      **Test:** on `/test-ocr` and on the real `DealForm`, run all three
      input paths — click-to-select, drag-and-drop, and paste — for each of
      the three generated images in `test-images/` (`npm run
      ocr:generate-test-images` to regenerate them). Confirm: the progress
      bar updates during recognition, the extracted text and confidence
      shown in the browser roughly match the `npm run ocr:test-images`
      numbers in this doc (91% / 89% / 20%), the low-confidence warning
      banner appears only for the low-quality image, and the extracted text
      is editable before submit.

- [ ] **`app/badge/[username]/route.ts`** — `fetchUserDeals` is still a stub
      returning `[]`, so `computeReputationScore`'s "completed"-status filter
      fixed in `lib/ai.ts` hasn't been exercised against real Supabase data
      yet. Worth a quick sanity check once that query is wired up.

      **Test:** once `fetchUserDeals` queries real data, hit
      `/badge/<username>.svg` for a user with a mix of `completed`,
      `cancelled`, and `in-progress` deals, plus at least one completed deal
      with no rating. Confirm `dealCount` only counts completed deals, and
      that the unrated completed deal doesn't drag `avgRating` toward 1.
      Compare against `computeReputationScore` called directly with the same
      deal list (e.g. via `scripts/test-badge.ts`) to confirm the route and
      the lib function agree.
