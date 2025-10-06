export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range, majorDimension, valueRenderOption } = req.query;
  const auth = req.headers['authorization'];
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const params = new URLSearchParams();
  if (majorDimension) params.append('majorDimension', majorDimension);
  if (valueRenderOption) params.append('valueRenderOption', valueRenderOption);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': auth,
    },
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
