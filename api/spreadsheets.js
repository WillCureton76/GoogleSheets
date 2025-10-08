import { getAccessToken } from "@/lib/googleAuth";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    // Get fresh Google access token automatically
    const accessToken = await getAccessToken();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const subpath = (url.searchParams.get("__subpath") || "").toLowerCase();
    const action = (subpath || url.searchParams.get("action") || "").toLowerCase();
    const spreadsheetId = url.searchParams.get("spreadsheetId");

    const g = async (method, path, body) => {
      try {
        const resp = await fetch(`https://sheets.googleapis.com/v4${path}`, {
          method,
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
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
            details: json.error || json,
          });
        }

        return res.status(200).json(json);
      } catch (err) {
        return res.status(502).json({
          ok: false,
          source: "proxy",
          status: 502,
          code: "FETCH_ERROR",
          message: String(err?.message || err),
        });
      }
    };

    switch (action) {
      case "get": {
        if (!spreadsheetId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId",
          });
        return g("GET", `/spreadsheets/${encodeURIComponent(spreadsheetId)}${url.search || ""}`);
      }

      case "create": {
        if (req.method !== "POST")
          return res.status(405).json({
            ok: false,
            source: "proxy",
            status: 405,
            code: "METHOD_NOT_ALLOWED",
            message: "Use POST for /api/spreadsheets/create",
          });
        const body = await readJson(req, res);
        if (!body) return;
        return g("POST", `/spreadsheets`, body);
      }

      case "batchupdate": {
        if (!spreadsheetId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId",
          });
        const body = await readJson(req, res);
        if (!body) return;
        return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`, body);
      }

      case "getbydatafilter": {
        if (!spreadsheetId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId",
          });
        const body = await readJson(req, res);
        if (!body) return;
        return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}:getByDataFilter`, body);
      }

      case "sheets/copyto":
      case "copyto": {
        const sheetId = url.searchParams.get("sheetId");
        if (!spreadsheetId || !sheetId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId and sheetId",
          });
        const body = await readJson(req, res);
        if (!body) return;
        return g(
          "POST",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/sheets/${encodeURIComponent(sheetId)}:copyTo`,
          body
        );
      }

      case "developermetadata/get": {
        if (!spreadsheetId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId",
          });
        const metadataId = url.searchParams.get("metadataId");
        if (!metadataId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require metadataId",
          });
        return g(
          "GET",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/developerMetadata/${encodeURIComponent(metadataId)}`
        );
      }

      case "developermetadata/search": {
        if (!spreadsheetId)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require spreadsheetId",
          });
        const body = await readJson(req, res);
        if (!body) return;
        return g(
          "POST",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/developerMetadata:search`,
          body
        );
      }

      default: {
        if (req.method === "GET" && spreadsheetId) {
          return g("GET", `/spreadsheets/${encodeURIComponent(spreadsheetId)}${url.search || ""}`);
        }
        return res.status(404).json({
          ok: false,
          source: "proxy",
          status: 404,
          code: "UNKNOWN_SPREADSHEETS_ACTION",
          message: `Unknown /api/spreadsheets action '${action || "(none)"}'`,
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      ok: false,
      source: "proxy",
      status: 500,
      code: "UNHANDLED",
      message: String(err?.message || err),
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
  } catch {
    res
      .status(400)
      .json({ ok: false, source: "proxy", status: 400, code: "BAD_JSON", message: "Invalid JSON body" });
    return null;
  }
}
