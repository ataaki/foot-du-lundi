const { chromium } = require('playwright');

const PORT = process.env.PORT || 3000;

/**
 * Confirm a Stripe payment using Stripe.js in a headless browser.
 * This replicates what the DoInSport mobile app does with stripe.confirmCardPayment(),
 * which handles 3DS frictionlessly via browser fingerprinting.
 *
 * @param {string} clientSecret - The PaymentIntent client_secret from DoInSport payment metadata
 * @returns {object} The PaymentIntent object with status 'succeeded'
 */
async function confirmStripePayment(clientSecret) {
  const pk = process.env.STRIPE_PK;
  const account = process.env.STRIPE_ACCOUNT;
  const sourceId = process.env.STRIPE_SOURCE_ID;

  if (!pk || !account || !sourceId) {
    throw new Error('Missing Stripe env vars (STRIPE_PK, STRIPE_ACCOUNT, STRIPE_SOURCE_ID)');
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`http://localhost:${PORT}/stripe-confirm.html`, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    // Wait for Stripe.js to be ready
    await page.waitForFunction(() => window.stripeReady === true, { timeout: 10000 });

    // Call confirmCardPayment via Stripe.js
    const result = await page.evaluate(
      async ({ pk, account, clientSecret, sourceId }) => {
        return window.confirmPayment(pk, account, clientSecret, sourceId);
      },
      { pk, account, clientSecret, sourceId }
    );

    if (result.error) {
      throw new Error(`Stripe confirmCardPayment failed: ${result.error.message}`);
    }

    if (result.paymentIntent?.status !== 'succeeded') {
      throw new Error(`Payment not succeeded: ${result.paymentIntent?.status}`);
    }

    console.log('[Stripe] Payment confirmed via Stripe.js, status: succeeded');
    return result.paymentIntent;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = { confirmStripePayment };
