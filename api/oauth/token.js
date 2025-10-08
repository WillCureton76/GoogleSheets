export default async function handler(req, res) {
  const target = "https://oauth2.googleapis.com/token";

  try {
    // Collect the raw body
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const rawBody = Buffer.concat(buffers).toString();

    // Forward the exact body and content type
    const google = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": req.headers["content-type"] || "application/x-www-form-urlencoded",
      },
      body: rawBody,
    });

    const text = await google.text();
    res
      .status(google.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  } catch (err) {
    console.error("Token proxy error:", err);
    res
      .status(500)
      .json({ ok: false, message: err.message || "Proxy failure" });
  }
}
