export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, ranges, majorDimension } = req.query;
  const auth = req.headers['authorization'];
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

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
      'Authorization': auth,
    },
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
