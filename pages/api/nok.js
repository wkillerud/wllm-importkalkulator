// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// https://vercel.com/docs/concepts/edge-network/caching

function getSecondsToNextUpdate(timeNextUpdateUnix) {
  const now = Number(String(Date.now()).substr(0, 10));
  return timeNextUpdateUnix - now;
}

export default async function handler(req, res) {
  let data;
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.EXCHANGE_RATE_API
  ) {
    data = {
      result: "success",
      documentation: "https://www.exchangerate-api.com/docs",
      terms_of_use: "https://www.exchangerate-api.com/terms",
      time_last_update_unix: 1585267200,
      time_last_update_utc: "Fri, 27 Mar 2020 00:00:00 +0000",
      time_next_update_unix: 1585353700,
      time_next_update_utc: "Sat, 28 Mar 2020 00:00:00 +0000",
      base_code: "NOK",
      conversion_rates: {
        USD: 0.14,
      },
    };
  } else {
    const apiKey = process.env.EXCHANGE_RATE_API;
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/NOK`,
    );
    data = await response.json();
  }

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
