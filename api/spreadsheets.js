import { getAccessToken } from "./getAccessToken.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const accessToken = await getAccessToken();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = (url.searchParams.get("action") || "").toLowerCase();
    const spreadsheetId = url.searchParams.get("spreadsheetId");

    const g = async (method, path, body) => {
      const resp = await fetch(`https://sheets.googleapis.com/v4${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
          code: json.error?.status || "GOOGLE_ERROR",
          message: json.error?.message || "Google API error",
          details: json.error || json,
        });
      }
      res.status(200).json(json);
    };

    switch (action) {
      case "get":
        if (!spreadsheetId)
          return res.status(400).json({ error: "spreadsheetId required" });
        return g("GET", `/spreadsheets/${spreadsheetId}${url.search || ""}`);
      case "create":
        if (req.method !== "POST")
          return res.status(405).json({ error: "Use POST" });
        const body = await readJson(req);
        return g("POST", "/spreadsheets", body);
      default:
        return res.status(404).json({ error: "Unknown action" });
    }
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}
