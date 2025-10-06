export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, ranges } = req.body;
  const token = process.env.GOOGLE_OAUTH_TOKEN;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
