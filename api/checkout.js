// Vercel serverless function — creates a Stripe Checkout Session.
// Requires env var: STRIPE_SECRET_KEY  (optional: CHECKOUT_CURRENCY, default "usd")
module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { res.status(500).json({ error: "Checkout isn’t connected yet. (Missing Stripe key.)" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const plan = (body && body.plan === "split") ? "split" : "full";
  const currency = (process.env.CHECKOUT_CURRENCY || "usd").toLowerCase();

  const origin = req.headers.origin || "https://victoriaeverest.com";
  const params = new URLSearchParams();
  params.append("success_url", origin + "/order?success=1");
  params.append("cancel_url", origin + "/order?plan=" + plan);
  params.append("payment_method_types[0]", "card");
  params.append("billing_address_collection", "auto");
  params.append("allow_promotion_codes", "true");

  if (plan === "full") {
    params.append("mode", "payment");
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", currency);
    params.append("line_items[0][price_data][unit_amount]", "29700"); // $297.00
    params.append("line_items[0][price_data][product_data][name]", "The Paid Challenge — Pay in full");
  } else {
    // Split pay = 2 monthly payments. Stripe subscription; NOTE: needs a schedule to auto-cancel after 2.
    params.append("mode", "subscription");
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", currency);
    params.append("line_items[0][price_data][unit_amount]", "16700"); // $167.00
    params.append("line_items[0][price_data][recurring][interval]", "month");
    params.append("line_items[0][price_data][product_data][name]", "The Paid Challenge — Split pay (2 x $167)");
    params.append("subscription_data[metadata][installments]", "2");
  }

  try {
    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await r.json();
    if (r.ok && data.url) { res.status(200).json({ url: data.url }); return; }
    res.status(502).json({ error: "Could not start checkout. Please try again.", detail: data && data.error && data.error.message });
  } catch (e) {
    res.status(500).json({ error: "Checkout failed. Please try again." });
  }
};
