export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, sheetId, destinationSpreadsheetId } = req.body;
  const auth = req.headers['authorization'];
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/sheets/${sheetId}:copyTo`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ destinationSpreadsheetId }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
