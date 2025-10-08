// Simple pass-through to Google's OAuth 2.0 authorization endpoint
export default async function handler(req, res) {
  const target = 'https://accounts.google.com/o/oauth2/v2/auth';

  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const url = target + query;

  try {
    const response = await fetch(url, {
      method: req.method,
      redirect: 'manual'
    });

    // Forward status
    res.status(response.status);

    // Forward important headers
    const location = response.headers.get('location');
    if (location) {
      res.setHeader('Location', location);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Forward body
    const body = await response.text();
    res.send(body);
  } catch (err) {
    res.status(500).json({ error: 'OAuth auth proxy error', message: err.message });
  }
}
