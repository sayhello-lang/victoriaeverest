// Vercel serverless function — adds a contact to a Brevo list.
// Requires env vars: BREVO_API_KEY, BREVO_LIST_ID
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  if (!key || !listId) {
    res.status(500).json({ error: "Signup is not configured yet. (Missing Brevo env vars.)" });
    return;
  }

  // parse body (Vercel usually parses JSON, but be defensive)
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};
  const name = (body.name || "").toString().trim();
  const email = (body.email || "").toString().trim().toLowerCase();
  const phone = (body.phone || "").toString().trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email." });
    return;
  }

  const baseAttrs = {};
  if (name) baseAttrs.FIRSTNAME = name;

  function createContact(withSms) {
    const attributes = Object.assign({}, baseAttrs);
    if (withSms && phone) attributes.SMS = phone; // Brevo SMS wants +country format
    return fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [Number(listId)],
        updateEnabled: true, // update existing contacts instead of erroring
      }),
    });
  }

  try {
    let r = await createContact(true);
    // If the phone fails Brevo's SMS validation, retry without it so the signup still lands.
    if (r.status === 400 && phone) {
      r = await createContact(false);
    }
    if (r.ok || r.status === 204) {
      res.status(200).json({ ok: true });
      return;
    }
    const detail = await r.text();
    res.status(502).json({ error: "Could not save your signup. Please try again.", detail });
  } catch (e) {
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
