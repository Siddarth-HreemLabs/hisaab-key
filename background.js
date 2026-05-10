// Hisaab Key — Firefox extension
// Sole job: inject CORS headers on Tally XML server responses so the browser
// allows the Hisaab website (any origin) to read them directly.
// Contains zero business logic — all data handling stays in the website.

browser.webRequest.onHeadersReceived.addListener(
  function (details) {
    // Remove any existing CORS headers Tally may have set (avoids duplicates)
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

    return { responseHeaders: headers }
  },
  { urls: ['http://localhost:9000/*'] },
  ['blocking', 'responseHeaders']
)
