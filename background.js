// Hisaab Key

try {
  browser.webRequest.onHeadersReceived.addListener(
    function (details) {
      if (!details.url.includes('localhost:9000')) {
        return {}
      }

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
    { urls: ['<all_urls>'] },
    ['blocking', 'responseHeaders']
  )

  console.log('[HisaabKey] active')
} catch (e) {
  console.error('[HisaabKey] failed to register:', e)
}
