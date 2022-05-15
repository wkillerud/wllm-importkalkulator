// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// https://vercel.com/docs/concepts/edge-network/caching

function getSecondsToNextUpdate(timeNextUpdateUnix) {
  const now = Number(String(Date.now()).substr(0, 10));
  return timeNextUpdateUnix - now;
}

export default async function handler(req, res) {
  const apiKey = process.env.EXCHANGE_RATE_API;
  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/NOK`,
  );
  const data = await response.json();

  /*{
    "result": "success",
    "documentation": "https://www.exchangerate-api.com/docs",
    "terms_of_use": "https://www.exchangerate-api.com/terms",
    "time_last_update_unix": 1585267200,
    "time_last_update_utc": "Fri, 27 Mar 2020 00:00:00 +0000",
    "time_next_update_unix": 1585353700,
    "time_next_update_utc": "Sat, 28 Mar 2020 00:00:00 +0000",
    "base_code": "USD",
    "conversion_rates": {
      "USD": 1,
      "AUD": 1.4817,
      "BGN": 1.7741,
      "CAD": 1.3168,
      "CHF": 0.9774,
      "CNY": 6.9454,
      "EGP": 15.7361,
      "EUR": 0.9013,
      "GBP": 0.7679,
      "...": 7.8536,
      "...": 1.3127,
      "...": 7.4722, etc. etc.
    }
  }*/

  if (data.result !== "success") {
    return res.status(500).json(data);
  }

  const secondsToCache = getSecondsToNextUpdate(data.time_next_update_unix);
  res
    .setHeader("Cache-Control", `max-age=${secondsToCache}, immutable`)
    .status(200)
    .json({
      result: data.result,
      timeLastUpdate: data.time_last_update_utc,
      timeNextUpdate: data.time_next_update_utc,
      conversionRates: {
        USD: data.conversion_rates.USD,
        EUR: data.conversion_rates.EUR,
        JPY: data.conversion_rates.JPY,
        GBP: data.conversion_rates.GBP,
      },
    });
}
