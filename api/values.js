export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        source: "proxy",
        status: 401,
        code: "MISSING_AUTH",
        message: "Authorization: Bearer <token> required"
      });
    }
    const accessToken = auth.slice("Bearer ".length).trim();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const subpath = (url.searchParams.get("__subpath") || "").toLowerCase();
    const action = (subpath || url.searchParams.get("action") || "").toLowerCase();

    const spreadsheetId = url.searchParams.get("spreadsheetId");
    const range = url.searchParams.get("range");

    const g = async (method, path, body) => {
      const resp = await fetch(`https://sheets.googleapis.com/v4${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await resp.text();
      const json = text ? JSON.parse(text) : {};
      if (!resp.ok) {
        return res.status(resp.status).json({
          ok: false,
          source: "google",
          status: resp.status,
          code: (json.error && (json.error.status || json.error.code)) || "GOOGLE_ERROR",
          message: (json.error && json.error.message) || "Google API error",
          details: json.error || json
        });
      }
      return res.status(200).json(json);
    };

    switch (action) {
      case "get": {
        if (!spreadsheetId || !range) {
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId and range"
          });
        }
        const valueRenderOption = url.searchParams.get("valueRenderOption") || "UNFORMATTED_VALUE";
        const dateTimeRenderOption = url.searchParams.get("dateTimeRenderOption") || "SERIAL_NUMBER";
        return g(
          "GET",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=${valueRenderOption}&dateTimeRenderOption=${dateTimeRenderOption}`
        );
      }

      case "update": {
        if (req.method !== "PUT") {
          return res.status(405).json({
            ok: false,
            source: "proxy",
            status: 405,
            code: "METHOD_NOT_ALLOWED",
            message: "Use PUT for /api/values/update"
          });
        }
        if (!spreadsheetId || !range) {
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId and range"
          });
        }
        const valueInputOption = url.searchParams.get("valueInputOption") || "USER_ENTERED";
        const includeValuesInResponse = url.searchParams.get("includeValuesInResponse") || "false";
        const responseDateTimeRenderOption = url.searchParams.get("responseDateTimeRenderOption") || "SERIAL_NUMBER";
        const body = await readJson(req, res);
        if (!body) return;
        return g(
          "PUT",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}&includeValuesInResponse=${includeValuesInResponse}&responseDateTimeRenderOption=${responseDateTimeRenderOption}`,
          body
        );
      }

      case "append": {
        if (!spreadsheetId || !range) {
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId and range"
          });
        }
        const valueInputOption = url.searchParams.get("valueInputOption") || "USER_ENTERED";
        const insertDataOption = url.searchParams.get("insertDataOption") || "INSERT_ROWS";
        const includeValuesInResponse = url.searchParams.get("includeValuesInResponse") || "false";
        const responseDateTimeRenderOption = url.searchParams.get("responseDateTimeRenderOption") || "SERIAL_NUMBER";
        const body = await readJson(req, res);
        if (!body) return;
        return g(
          "POST",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}&insertDataOption=${insertDataOption}&includeValuesInResponse=${includeValuesInResponse}&responseDateTimeRenderOption=${responseDateTimeRenderOption}`,
          body
        );
      }

      case "batchget":
      case "batchgetbydatafilter": {
        if (!spreadsheetId) {
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId"
          });
        }
        if (action === "batchget") {
          return g("GET", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet${url.search || ""}`);
        } else {
          const body = await readJson(req, res);
          if (!body) return;
          return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGetByDataFilter`, body);
        }
      }

      case "batchupdate":
      case "batchupdatebydatafilter": {
        if (!spreadsheetId) {
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId"
          });
        }
        const body = await readJson(req, res);
        if (!body) return;
        const endpoint =
          action === "batchupdate"
            ? `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`
            : `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdateByDataFilter`;
        return g("POST", endpoint, body);
      }

      case "clear":
      case "batchclear":
      case "batchclearbydatafilter": {
        if (!spreadsheetId) {
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId"
          });
        }
        if (action === "clear") {
          if (!range) {
            return res.status(400).json({
              ok: false,
              source: "proxy",
              status: 400,
              code: "INVALID_PARAMS",
              message: "Require range for clear"
            });
          }
          return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`, {});
        }
        const body = await readJson(req, res);
        if (!body) return;
        const endpoint =
          action === "batchclear"
            ? `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`
            : `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClearByDataFilter`;
        return g("POST", endpoint, body);
      }

      default: {
        if (req.method === "GET" && spreadsheetId && range) {
          const valueRenderOption = url.searchParams.get("valueRenderOption") || "UNFORMATTED_VALUE";
          const dateTimeRenderOption = url.searchParams.get("dateTimeRenderOption") || "SERIAL_NUMBER";
          return g(
            "GET",
            `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=${valueRenderOption}&dateTimeRenderOption=${dateTimeRenderOption}`
          );
        }
        return res.status(404).json({
          ok: false,
          source: "proxy",
          status: 404,
          code: "UNKNOWN_VALUES_ACTION",
          message: `Unknown /api/values action '${action || "(none)"}'`
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      source: "proxy",
      status: 500,
      code: "UNHANDLED",
      message: String(err?.message || err)
    });
  }
}

async function readJson(req, res) {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    res.status(400).json({
      ok: false,
      source: "proxy",
      status: 400,
      code: "BAD_JSON",
      message: "Invalid JSON body"
    });
    return null;
  }
}
