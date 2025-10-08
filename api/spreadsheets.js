export default async function handler(req, res) {
  // Extract endpoint from URL path
  const path = req.url.split('?')[0];

  // Common auth check
  const auth = req.headers['authorization'];
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    // Route to appropriate handler based on path
    if (path.endsWith('/create')) {
      return await handleCreate(req, res, auth);
    } else if (path.endsWith('/get')) {
      return await handleGet(req, res, auth);
    } else if (path.endsWith('/batchUpdate')) {
      return await handleBatchUpdate(req, res, auth);
    } else if (path.endsWith('/getByDataFilter')) {
      return await handleGetByDataFilter(req, res, auth);
    } else if (path.endsWith('/copyTo')) {
      return await handleCopyTo(req, res, auth);
    } else if (path.includes('/developerMetadata/get')) {
      return await handleGetDeveloperMetadata(req, res, auth);
    } else if (path.includes('/developerMetadata/search')) {
      return await handleSearchDeveloperMetadata(req, res, auth);
    } else {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}

// Individual endpoint handlers
async function handleCreate(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleGet(req, res, auth) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, includeGridData } = req.query;

  const params = new URLSearchParams();
  if (includeGridData) params.append('includeGridData', includeGridData);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': auth,
    },
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleBatchUpdate(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, requests } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleGetByDataFilter(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, dataFilters, includeGridData } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:getByDataFilter`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataFilters, includeGridData }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleCopyTo(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, sheetId, destinationSpreadsheetId } = req.body;

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
  return res.status(response.status).json(data);
}

async function handleGetDeveloperMetadata(req, res, auth) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, metadataId } = req.query;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/developerMetadata/${metadataId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': auth,
    },
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleSearchDeveloperMetadata(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, dataFilters } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/developerMetadata:search`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataFilters }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
