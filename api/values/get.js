export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range, majorDimension, valueRenderOption } = req.query;
  const token = process.env.GOOGLE_OAUTH_TOKEN;

  const params = new URLSearchParams();
  if (majorDimension) params.append('majorDimension', majorDimension);
  if (valueRenderOption) params.append('valueRenderOption', valueRenderOption);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
