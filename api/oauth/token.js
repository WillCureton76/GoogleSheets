export const config = {
  api: {
    bodyParser: false, // disable Next/Vercel's automatic JSON body parsing
  },
};

export default async function handler(req, res) {
  const target = "https://oauth2.googleapis.com/token";

  try {
    // Read the raw body bytes
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    // Forward the request to Google
    const googleResponse = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: rawBody,
    });

    const text = await googleResponse.text();
    res
      .status(googleResponse.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  } catch (err) {
    console.error("OAuth token proxy error:", err);
    res
      .status(500)
      .json({ ok: false, message: err.message || "Token proxy failed" });
  }
}
