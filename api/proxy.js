export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, method = 'POST', ...body } = req.body;
  const token = process.env.GOOGLE_OAUTH_TOKEN;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint is required' });
  }

  console.log('Forwarding to Google Sheets:', { endpoint, method });

  const url = `https://sheets.googleapis.com/v4/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  console.log('Google Sheets response:', data);

  res.status(response.status).json(data);
}
