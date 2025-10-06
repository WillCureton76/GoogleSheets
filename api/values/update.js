export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range, valueInputOption, values, includeValuesInResponse } = req.body;
  const token = process.env.GOOGLE_OAUTH_TOKEN;

  const params = new URLSearchParams({ valueInputOption });
  if (includeValuesInResponse) params.append('includeValuesInResponse', includeValuesInResponse);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?${params}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
