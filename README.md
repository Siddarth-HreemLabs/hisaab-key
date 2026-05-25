# Hisaab Key

A Firefox extension that injects CORS headers on responses from a local Tally XML server (`localhost:9000`) so the Hisaab web app can read accounting data directly from the browser — no backend proxy needed.

---

## What it does

Tally ERP exposes an XML HTTP server on `http://localhost:9000`. When the Hisaab web app (served over HTTPS) makes a request to that server, the browser's CORS policy blocks the response because Tally does not send `Access-Control-Allow-Origin` headers.

Hisaab Key intercepts each response from `localhost:9000` and injects the required CORS headers before the browser sees them, allowing the request to succeed.

---

## Why `<all_urls>` is required

The natural approach is to register the `onHeadersReceived` listener with a specific URL filter:

```json
{ "urls": ["http://localhost:9000/*"] }
```

During development this turned out not to work. Firefox silently refuses to run a `blocking` mode `onHeadersReceived` listener with a specific URL pattern when the request originates from an HTTPS page and the target is HTTP localhost. The listener registers without error — `addListener` does not throw — but the callback never fires. This appears to be a Firefox-specific behaviour in how it routes cross-origin HTTPS→HTTP responses through the webRequest pipeline when a narrow URL pattern is used.

Switching the filter to `<all_urls>` makes the listener fire correctly. The browser grants the extension visibility into every network response, but — as described below — the code immediately discards anything that is not from `localhost:9000`.

---

## How misuse is prevented

Holding `<all_urls>` means the callback receives every HTTP response the browser makes. The extension handles this in a single guard at the top of the callback:

```javascript
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    if (!details.url.includes('localhost:9000')) {
      return {}   // pass through — no headers touched
    }

    // only reaches here for localhost:9000 responses
    const headers = details.responseHeaders.filter(...)
    headers.push({ name: 'Access-Control-Allow-Origin', value: '*' })
    ...
    return { responseHeaders: headers }
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'responseHeaders']
)
```

Returning an empty object `{}` from a blocking `onHeadersReceived` listener is a no-op — Firefox applies the original headers unchanged. Every response that is not from `localhost:9000` passes through without modification. The extension cannot read response bodies; it only sees and optionally rewrites headers.

In summary:

| Concern | Mitigation |
|---|---|
| Listener sees all URLs | Callback exits immediately for anything not matching `localhost:9000` |
| Headers of other sites modified | Impossible — the early return prevents any mutation |
| Response bodies accessible | No — `onHeadersReceived` exposes headers only, never body content |
| Extension runs on all sites | Yes, but is entirely passive for every site except Tally's local server |

---

## Installation (Firefox, temporary)

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select the `manifest.json` file from this directory

The extension is active until Firefox is closed. Reload it after any file change via the **Reload** button in `about:debugging`.

---

## Publishing to Firefox Add-ons (AMO)

### One-time setup

Install `web-ext` globally:

```bash
npm install -g web-ext
```

Get AMO API credentials from `addons.mozilla.org/developers/addon/api/key/` — you need the **JWT issuer** and **JWT secret**.

### Validate before every release

```bash
cd hisaab-key
web-ext lint
```

Expected output: 0 errors. The 2 warnings about `strict_min_version` being older than Firefox 140 are acceptable and do not block submission.

### Package for upload

Always zip from inside the extension directory so `manifest.json` is at the root of the archive. Exclude hidden macOS files and dev-only files:

```bash
cd hisaab-key
zip -r ../hisaab-key.zip manifest.json background.js popup.html
```

Upload the resulting `hisaab-key.zip` (one level up) at:
`addons.mozilla.org/developers/submit/upload-listed`

### Automatic signing via CLI (for version updates)

After the first submission is manually reviewed and approved, subsequent versions can be signed and submitted automatically:

```bash
web-ext sign \
  --channel=listed \
  --amo-metadata=amo-metadata.json \
  --api-key=YOUR_JWT_ISSUER \
  --api-secret=YOUR_JWT_SECRET
```

### Releasing a new version

1. Bump `"version"` in `manifest.json` (e.g. `"1.0.0"` → `"1.1.0"`)
2. Run `web-ext lint` — confirm 0 errors
3. Run `web-ext sign --channel=listed --api-key=... --api-secret=...`
4. Commit and tag: `git tag v1.1.0 && git push --tags`

---

## Decisions log

### `<all_urls>` permission

Keeping `<all_urls>` is intentional — see the section above. Removing it causes the `webRequestBlocking` listener to silently never fire for HTTPS→HTTP localhost requests in Firefox. This was confirmed during development; using a specific URL filter (`localhost:9000/*`) does not work.

Firefox shows this as **"Access your data for all websites"** on the add-ons page. This label is technically accurate — the listener receives all responses — but every non-localhost:9000 response is discarded in the first line of the callback. The extension cannot modify or read body content of any request.

### `data_collection_permissions`

Added in v1.0.0 to satisfy AMO's requirement for new extensions:

```json
"data_collection_permissions": {
  "required": ["none"],
  "optional": []
}
```

`"none"` is correct: the extension does not collect, store, or transmit any user data. It only rewrites three HTTP response headers in memory for responses from `localhost:9000`.

### `strict_min_version: "58.0"`

Set to `58.0` (the minimum AMO accepts). The extension uses only `webRequest` APIs available since Firefox 57. Version 58 is the floor enforced by AMO.

### License

All Rights Reserved. Hisaab is a commercial product.

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-05-24 | Initial AMO submission |

---

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension metadata and permissions |
| `background.js` | CORS header injector (the entire logic) |
| `popup.html` | Status popup shown when clicking the toolbar icon |

---

## Permissions declared

| Permission | Reason |
|---|---|
| `webRequest` | Listen to network requests |
| `webRequestBlocking` | Modify response headers before the browser processes them |
| `<all_urls>` | Required for `blocking` mode `onHeadersReceived` to fire for HTTPS→HTTP localhost responses (see above) |
