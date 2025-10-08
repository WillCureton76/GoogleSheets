import { getAccessToken } from "./lib/googleAuth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const accessToken = await getAccessToken();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const spreadsheetId = url.searchParams.get("spreadsheetId");
    const range = url.searchParams.get("range");

    // Derive intended action
    const subpath = (url.searchParams.get("__subpath") || url.searchParams.get("subpath") || "").toLowerCase();
    const pathTail = url.pathname.split("/").filter(Boolean).pop()?.toLowerCase() || "";
    const action = (subpath || url.searchParams.get("action") || pathTail).toLowerCase();

    if (!spreadsheetId) {
      return res.status(400).json({
        ok: false,
        source: "proxy",
        status: 400,
        code: "INVALID_PARAMS",
        message: "Missing spreadsheetId",
      });
    }

    // Core Google fetch wrapper
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

    // Build sanitized query string (removes internal keys)
    const buildCleanSearch = (extraDeletes = []) => {
      const clean = new URL(req.url, `http://${req.headers.host}`);
      const deleteKeys = [
        "action",
        "__subpath",
        "subpath", // <-- crucial fix
        "spreadsheetId",
        "range",
        ...extraDeletes,
      ];
      for (const key of deleteKeys) clean.searchParams.delete(key);
      return clean.search || "";
    };

    // Route dispatch
    switch (action) {
      case "get": {
        if (!range)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require range",
          });

        const qs = buildCleanSearch();
        return g("GET", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs}`);
      }

      case "update": {
        if (!range)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require range",
          });

        if (req.method !== "PUT" && req.method !== "POST")
          return res.status(405).json({
            ok: false,
            source: "proxy",
            status: 405,
            code: "METHOD_NOT_ALLOWED",
            message: "Use PUT or POST for update",
          });

        const body = await readJson(req, res);
        if (!body) return;

        const qs = buildCleanSearch();
        return g(
          "PUT",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs || "?valueInputOption=RAW"}`,
          body
        );
      }

      case "append": {
        if (!range)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require range",
          });

        const body = await readJson(req, res);
        if (!body) return;

        const qs = buildCleanSearch();
        const suffix = qs || "?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";
        return g(
          "POST",
          `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append${suffix}`,
          body
        );
      }

      case "clear": {
        if (!range)
          return res.status(400).json({
            ok: false,
            source: "proxy",
            status: 400,
            code: "INVALID_PARAMS",
            message: "Require range",
          });
        return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`, {});
      }

      case "batchupdate": {
        const body = await readJson(req, res);
        if (!body) return;
        return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, body);
      }

      case "batchclear": {
        const body = await readJson(req, res);
        if (!body) return;
        return g("POST", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`, body);
      }

      default: {
        // Fallback: treat GET with range as values.get
        if (req.method === "GET" && range) {
          const qs = buildCleanSearch();
          return g("GET", `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs}`);
        }

        return res.status(404).json({
          ok: false,
          source: "proxy",
          status: 404,
          code: "UNKNOWN_VALUES_ACTION",
          message: `Unknown /api/values action '${action || "(none)"}'`,
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
    res.status(400).json({
      ok: false,
      source: "proxy",
      status: 400,
      code: "BAD_JSON",
      message: "Invalid JSON body",
    });
    return null;
  }
}
