export default async function handler(req, res) {
  // Extract endpoint from URL path
  const path = req.url.split('?')[0];

  // Common auth check
  const auth = req.headers['authorization'];
  if (!auth?.toLowerCase().startsWith('bearer ')) {
    return res.status(405).json({ error: 'Missing Authorization header' });
  }

  try {
    // Route to appropriate handler based on path
    if (path.endsWith('/append')) {
      return await handleAppend(req, res, auth);
    } else if (path.endsWith('/update')) {
      return await handleUpdate(req, res, auth);
    } else if (path.endsWith('/get')) {
      return await handleGet(req, res, auth);
    } else if (path.endsWith('/clear')) {
      return await handleClear(req, res, auth);
    } else if (path.endsWith('/batchGet')) {
      return await handleBatchGet(req, res, auth);
    } else if (path.endsWith('/batchUpdate')) {
      return await handleBatchUpdate(req, res, auth);
    } else if (path.endsWith('/batchClear')) {
      return await handleBatchClear(req, res, auth);
    } else if (path.endsWith('/batchGetByDataFilter')) {
      return await handleBatchGetByDataFilter(req, res, auth);
    } else if (path.endsWith('/batchUpdateByDataFilter')) {
      return await handleBatchUpdateByDataFilter(req, res, auth);
    } else if (path.endsWith('/batchClearByDataFilter')) {
      return await handleBatchClearByDataFilter(req, res, auth);
    } else {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}

// Individual endpoint handlers
async function handleAppend(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range, valueInputOption, values, insertDataOption, includeValuesInResponse } = req.body;

  const params = new URLSearchParams({ valueInputOption });
  if (insertDataOption) params.append('insertDataOption', insertDataOption);
  if (includeValuesInResponse) params.append('includeValuesInResponse', includeValuesInResponse);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?${params}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleUpdate(req, res, auth) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range, valueInputOption, values, includeValuesInResponse } = req.body;

  const params = new URLSearchParams({ valueInputOption });
  if (includeValuesInResponse) params.append('includeValuesInResponse', includeValuesInResponse);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?${params}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleGet(req, res, auth) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range, majorDimension, valueRenderOption } = req.query;

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
  return res.status(response.status).json(data);
}

async function handleClear(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, range } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleBatchGet(req, res, auth) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, ranges, majorDimension } = req.query;

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
  return res.status(response.status).json(data);
}

async function handleBatchUpdate(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, valueInputOption, data, includeValuesInResponse } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ valueInputOption, data, includeValuesInResponse }),
  });

  const responseData = await response.json();
  return res.status(response.status).json(responseData);
}

async function handleBatchClear(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, ranges } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleBatchGetByDataFilter(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, dataFilters, majorDimension } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGetByDataFilter`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataFilters, majorDimension }),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}

async function handleBatchUpdateByDataFilter(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, valueInputOption, data } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdateByDataFilter`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ valueInputOption, data }),
  });

  const responseData = await response.json();
  return res.status(response.status).json(responseData);
}

async function handleBatchClearByDataFilter(req, res, auth) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spreadsheetId, dataFilters } = req.body;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClearByDataFilter`;

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
