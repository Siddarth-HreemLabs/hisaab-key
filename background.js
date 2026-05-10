// Hisaab Key — debug build
// Check about:debugging → Inspect → Console after making a request from the site

const TALLY_FILTER = { urls: ['http://localhost:9000/*', 'http://localhost:9000/'] }

// Phase 1 — before request is sent
browser.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log('[HisaabKey] onBeforeRequest', details.method, details.url)
  },
  TALLY_FILTER
)

// Phase 2 — before request headers sent
browser.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    console.log('[HisaabKey] onBeforeSendHeaders', details.method, details.url)
  },
  TALLY_FILTER,
  ['requestHeaders']
)

// Phase 3 — response headers received (where we inject CORS)
browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    console.log('[HisaabKey] onHeadersReceived', details.method, details.url, 'status:', details.statusCode)
    console.log('[HisaabKey] original headers:', JSON.stringify(details.responseHeaders))

    const headers = details.responseHeaders.filter(function (h) {
      const name = h.name.toLowerCase()
      return (
        name !== 'access-control-allow-origin' &&
        name !== 'access-control-allow-methods' &&
        name !== 'access-control-allow-headers'
      )
    })

    headers.push({ name: 'Access-Control-Allow-Origin',  value: '*' })
    headers.push({ name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' })
    headers.push({ name: 'Access-Control-Allow-Headers', value: 'Content-Type' })

    console.log('[HisaabKey] injected CORS headers OK')
    return { responseHeaders: headers }
  },
  TALLY_FILTER,
  ['blocking', 'responseHeaders']
)

// Phase 4 — catch errors
browser.webRequest.onErrorOccurred.addListener(
  function (details) {
    console.log('[HisaabKey] onErrorOccurred', details.method, details.url, 'error:', details.error)
  },
  TALLY_FILTER
)

// Also log ALL traffic briefly so we know the extension is alive
browser.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url.includes('localhost')) {
      console.log('[HisaabKey] ANY localhost request:', details.url)
    }
  },
  { urls: ['<all_urls>'] }
)

console.log('[HisaabKey] background loaded, all listeners registered')
