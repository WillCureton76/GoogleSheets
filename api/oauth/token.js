// Pass-through to Google's OAuth 2.0 token endpoint
export default async function handler(req, res) {
  const target = 'https://oauth2.googleapis.com/token';

  try {
    // Read request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');

    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
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
