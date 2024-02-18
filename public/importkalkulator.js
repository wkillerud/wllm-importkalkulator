(async function main() {
	const convert = (price, exchangeRate) =>
		Number.parseFloat(price || 0) * (1 / (exchangeRate || 1));

	const format = (price, currency = "kr") =>
		`${Number(price).toFixed(2)} ${currency}`.replace(".", ",");

	const pad = (number) => String(number).length === 1 ? `0${number}` : String(number);

	const form = document.getElementById("form");
	form.addEventListener("submit", e => e.preventDefault());

	const response = await fetch("/api/nok");
	if (response.status !== 200) {
		const uhoh = document.getElementById("api-error");
		uhoh.hidden = false;
		return;
	}

	const data = await response.json();

	const currencies = Object.keys(data.conversionRates);
	const currenciesList = document.getElementById("currencies");
	currenciesList.replaceChildren();
	currencies.forEach((currency) => {
		const option = document.createElement("option");
		option.value = currency;
		currenciesList.appendChild(option);
	});

	const state = new Proxy({
		currency: undefined,
		price: undefined,
		shipping: undefined,
		vat: undefined,
		toll: undefined,
		fee: undefined,
	}, {
		set(state, prop, value) {
			const newValue = String(value).toUpperCase();
			const set = Reflect.set(state, prop, newValue);

			if (prop === "currency" && newValue.length !== 3) {
				return set;
			}

			const conversionRate = data.conversionRates[state.currency];
			const nokPrice = data
				? convert(state.price, data.conversionRates[state.currency])
				: 0;
			const nokShipping = data
				? convert(state.shipping, data.conversionRates[state.currency])
				: 0;

			const nokTollBase = nokPrice + nokShipping;
			const nokToll = nokTollBase * (Number.parseFloat(state.toll || 0) / 100);

			const nokVatBase = nokTollBase + nokToll;
			const nokVat = nokVatBase * (Number.parseFloat(state.vat || 0) / 100);
			const nokFee = Number.parseFloat(state.fee || 0);
			const nokSum = nokPrice + nokShipping + nokToll + nokVat + nokFee;


			if (prop === "currency") {
				document.getElementById("currency-description").hidden = false;

				const convertsTo = format(conversionRate * 100, newValue);
				document.getElementById("converts-to").innerText = convertsTo;

				const statisticsLink = document.getElementById("currency-statistics-link");
				const href = statisticsLink.getAttribute("href");
				const newHref = href.replace(/&id=.*/, `&id=${newValue}`);
				statisticsLink.setAttribute("href", newHref);
			}

			if (prop === "toll") {
				try {
					const tollOutput = document.getElementById("output-toll");
					const toll = Number.parseFloat(value);
					if (toll > 0) {
						document.getElementById("sum-toll").innerText = format(nokToll);
						tollOutput.hidden = false;
					} else {
						tollOutput.hidden = true;
					}
				} catch {}
			}

			if (prop === "fee") {
				document.getElementById("sum-fee").innerText = format(nokFee);
			}

			document.getElementById("sum-price").innerText = format(nokPrice);
			document.getElementById("sum-shipping").innerText = format(nokShipping);
			document.getElementById("sum-vat").innerText = format(nokVat);
			document.getElementById("sum-total").innerText = format(nokSum);
			document.getElementById("sr-sum").innerText = format(nokSum);

			return set;
		}
	});

	["currency", "price", "shipping", "toll", "vat", "fee"].forEach((field) => {
		const input = document.getElementById(field);
		input.addEventListener("input", (e) => {
			state[field] = e.target.value;
		});
		state[field] = input.value;
	});

	const lastUpdated = document.getElementById("exchange-rates-date");
	const ud = new Date(data.timeLastUpdate);
	lastUpdated.innerText = `Oppdatert ${pad(ud.getDate())}.${pad(ud.getMonth() + 1)}.${ud.getFullYear()} kl. ${pad(ud.getHours())}:${pad(ud.getMinutes())}`;
	lastUpdated.hidden = false;
})();
