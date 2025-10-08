// Pass-through to Google's OAuth 2.0 token endpoint
export default async function handler(req, res) {
  const target = 'https://oauth2.googleapis.com/token';

  try {
    let body = '';

    // If GET request (incorrect but handle it), convert query params to form body
    if (req.method === 'GET') {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const params = new URLSearchParams();
      for (const [key, value] of url.searchParams) {
        params.append(key, value);
      }
      body = params.toString();
    } else {
      // POST request - read body stream
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks).toString('utf8');
    }

    // Forward to Google with POST
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
      },
      body: body
    });

    // Forward status and headers
    res.status(response.status);

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Forward body
    const responseBody = await response.text();
    res.send(responseBody);
  } catch (err) {
    res.status(500).json({ error: 'OAuth token proxy error', message: err.message });
  }
}
