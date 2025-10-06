export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, ranges, majorDimension } = req.query;
  const token = process.env.GOOGLE_OAUTH_TOKEN;

  const params = new URLSearchParams();
  if (Array.isArray(ranges)) {
    ranges.forEach(r => params.append('ranges', r));
  } else if (ranges) {
    params.append('ranges', ranges);
  }
  if (majorDimension) params.append('majorDimension', majorDimension);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
