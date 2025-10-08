export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const target = "https://oauth2.googleapis.com/token";

  try {
    // Convert GET to POST if needed
    const method = req.method === "GET" ? "POST" : req.method;

    // Build body from query params if present
    let body;
    if (req.method === "GET" && req.url.includes("?")) {
      body = req.url.slice(req.url.indexOf("?") + 1);
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks).toString();
    }

    const googleResponse = await fetch(target, {
      method,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const text = await googleResponse.text();
    res
      .status(googleResponse.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  } catch (err) {
    console.error("OAuth token proxy error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
}
