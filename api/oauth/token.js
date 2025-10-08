// Disable auto body parsing so we can forward verbatim
export const config = { api: { bodyParser: false } };

// Token proxy → accepts GET or POST from ChatGPT, POSTs to Google
export default async function handler(req, res) {
  const target = "https://oauth2.googleapis.com/token";

  try {
    // 1) Build form body
    let formBody = "";
    if (req.method === "GET") {
      // ChatGPT sometimes calls token URL with GET + querystring
      if (req.url.includes("?")) formBody = req.url.split("?")[1];
    } else {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      formBody = Buffer.concat(chunks).toString(); // already URL-encoded by caller
    }

    // 2) Compose headers; forward Basic auth if present
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    };
    const auth = req.headers["authorization"];
    if (auth) headers["Authorization"] = auth; // forward Basic <base64(client:secret)>

    // 3) Always POST to Google with the form body
    const google = await fetch(target, {
      method: "POST",
      headers,
      body: formBody,
    });

    const text = await google.text();
    res
      .status(google.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  } catch (err) {
    console.error("OAuth token proxy error:", err);
    res.status(500).json({ ok: false, code: "TOKEN_PROXY_ERROR", message: err.message });
  }
}
