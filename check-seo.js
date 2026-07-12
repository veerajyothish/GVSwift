const https = require('https');

https.get('https://gvswift.com', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const canonicalMatch = data.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
    const ogUrlMatch = data.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i);
    const ldJsonMatch = data.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    
    console.log("Canonical:", canonicalMatch ? canonicalMatch[1] : "NOT FOUND");
    console.log("OG URL:", ogUrlMatch ? ogUrlMatch[1] : "NOT FOUND");
    
    if (ldJsonMatch) {
      try {
        const json = JSON.parse(ldJsonMatch[1]);
        console.log("JSON-LD WebSite:", json['@graph']?.some(item => item['@type'] === 'WebSite') ? "PRESENT" : "MISSING");
        console.log("JSON-LD Organization:", json['@graph']?.some(item => item['@type'] === 'Organization') ? "PRESENT" : "MISSING");
        console.log("JSON-LD Content:", JSON.stringify(json, null, 2).substring(0, 300) + "...");
      } catch (e) {
        console.log("JSON-LD parse error:", e.message);
      }
    } else {
      console.log("JSON-LD: NOT FOUND");
    }
  });
}).on('error', err => console.log(err.message));
