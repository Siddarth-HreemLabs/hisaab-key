// Hisaab Key — debug build

const TALLY_FILTER = { urls: ['http://localhost:9000/*'] }

try {
  // Broad listener: log every request so we can confirm webRequest fires at all.
  browser.webRequest.onBeforeRequest.addListener(
    function (details) {
      console.log('[HisaabKey] REQUEST →', details.method, details.url)
    },
    { urls: ['<all_urls>'] }
  )

  browser.webRequest.onHeadersReceived.addListener(
    function (details) {
      console.log('[HisaabKey] RESPONSE', details.statusCode, details.url)

      const headers = details.responseHeaders.filter(function (h) {
        const n = h.name.toLowerCase()
        return n !== 'access-control-allow-origin' &&
               n !== 'access-control-allow-methods' &&
               n !== 'access-control-allow-headers'
      })
      headers.push({ name: 'Access-Control-Allow-Origin',  value: '*' })
      headers.push({ name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' })
      headers.push({ name: 'Access-Control-Allow-Headers', value: 'Content-Type' })
      return { responseHeaders: headers }
    },
    TALLY_FILTER,
    ['blocking', 'responseHeaders']
  )

  browser.webRequest.onErrorOccurred.addListener(
    function (details) {
      console.log('[HisaabKey] ERROR', details.error, details.url)
    },
    TALLY_FILTER
  )

  console.log('[HisaabKey] all listeners registered OK')
} catch (e) {
  console.error('[HisaabKey] FAILED to register listeners:', e)
}
