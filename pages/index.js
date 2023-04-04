import { initTabListener } from "@fremtind/jkl-core";
import { registerWithMasks } from "@fremtind/jkl-formatters-util";
import { Select } from "@fremtind/jkl-select-react";
import {
	SummaryTable,
	SummaryTableRow,
} from "@fremtind/jkl-summary-table-react";
import { TextInput } from "@fremtind/jkl-text-input-react";
import { formatRelative } from "date-fns";
import { nb } from "date-fns/locale";
import Head from "next/head";
import React from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import styles from "../styles/Home.module.scss";

initTabListener();

const fetcher = (...args) => fetch(...args).then((res) => res.json());

// Beregne den reverserte raten med (1 / exchangeRate)
const convert = (price, exchangeRate) =>
	Number.parseFloat(price || 0) * (1 / (exchangeRate || 1));

const formatNok = (nok, options = { aria: false, currency: "USD" }) =>
	`${nok.toFixed(2)} kr${
		options.aria ? ` totalt konvertert fra ${options.currency}` : ""
	}`.replace(".", ",");

export default function Home(props) {
	const { data, error } = useSWR("/api/nok", fetcher);
	const form = useForm();
	const { register, handleSubmit, watch } = form;
	const { registerWithNumber } = registerWithMasks(form);

	const formData = watch();

	const conversionRate =
		formData.currency && data ? data.conversionRates[formData.currency] : null;

	const nokPrice = data
		? convert(formData.price, data.conversionRates[formData.currency])
		: 0;
	const nokShipping = data
		? convert(formData.shipping, data.conversionRates[formData.currency])
		: 0;

	const nokTollBase = nokPrice + nokShipping;
	const nokToll = nokTollBase * (Number.parseFloat(formData.toll || 0) / 100);

	const nokVatBase = nokTollBase + nokToll;
	const nokVat = nokVatBase * (Number.parseFloat(formData.vat || 0) / 100);

	const nokSum = nokPrice + nokShipping + nokToll + nokVat;
	const nokFee = Number.parseFloat(formData.fee || 0);

	return (
		<div className={styles.container}>
			<Head>
				<title>Importkalkulator</title>
				<meta
					name="description"
					content="Hjelper deg beregne prisen i kroner for varer du handler i nettbutikker utenfor VOEC-ordningen."
				/>
				<link rel="icon" href="/favicon.ico" sizes="any" />
				<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
			</Head>

			<main className={styles.main}>
				<h1 className={`jkl-title ${styles.title}`}>Importkalkulator</h1>

				<span className="jkl-sr-only" aria-live="polite">
					{nokPrice > 0
						? formatNok(nokSum, { aria: true, currency: formData.currency })
						: ""}
				</span>

				{error && (
					<p className="jkl-spacing-m--bottom">
						Aida, her skjedde det noe feil så valutainformasjonen ikke kunne
						hentes. Du må dessverre prøve igjen senere.
					</p>
				)}

				<div className={styles.calculator}>
					<form
						onSubmit={handleSubmit((e) => e.preventDefault())}
						className={styles.form}
					>
						<div className={styles.formRow}>
							<Select
								id="currency"
								searchable
								label="Valuta"
								items={data ? Object.keys(data.conversionRates) : ["USD"]}
								width="7rem"
								helpLabel={
									conversionRate
										? `100 NOK = ${Number(conversionRate * 100).toFixed(
												2
										  )}`.replace(".", ",")
										: "Velg valutaen du handler i"
								}
								defaultValue="USD"
								{...register("currency")}
							/>
						</div>
						<div className={styles.formRow}>
							<TextInput
								id="price"
								width="10rem"
								label="Varens pris"
								{...registerWithNumber("price", { required: true })}
							/>
							<TextInput
								id="shipping"
								label="Frakt"
								width="7rem"
								{...registerWithNumber("shipping")}
							/>
						</div>
						<div className={styles.formRow}>
							<TextInput
								id="toll"
								label="Tollsats %"
								defaultValue="0"
								width="5rem"
								{...registerWithNumber("toll")}
							/>
							<TextInput
								id="vat"
								label="MVA %"
								defaultValue="25"
								width="5rem"
								{...registerWithNumber("vat")}
							/>
						</div>
						<TextInput
							id="fee"
							label="Fortollingsgebyr"
							defaultValue="199"
							width="7rem"
							helpLabel="I norske kroner"
							{...registerWithNumber("fee")}
						/>
					</form>

					<div>
						<SummaryTable
							className={styles.summary}
							header={["Rad", "Verdi"]}
							body={
								<>
									<SummaryTableRow
										header="Pris"
										content={formatNok(nokPrice)}
									/>
									<SummaryTableRow
										header="Frakt"
										content={formatNok(nokShipping)}
									/>
									{nokToll > 0 ? (
										<SummaryTableRow
											header="Toll"
											content={formatNok(nokToll)}
										/>
									) : null}
									<SummaryTableRow header="MVA" content={formatNok(nokVat)} />
									<SummaryTableRow header="Gebyr" content={formatNok(nokFee)} />
								</>
							}
							footer={
								<SummaryTableRow header="Sum" content={formatNok(nokSum)} />
							}
						/>
					</div>
				</div>
			</main>
			<footer className={styles.footer}>
				<div className={styles.footerContent}>
					<div>
						<h2 className="jkl-heading-5">Om kalkulatoren</h2>
						<ul className="jkl-small">
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.exchangerate-api.com"
								>
									Valutainformasjon fra ExchangeRateAPI
								</a>
							</li>
							<li>
								Oppdatert{" "}
								{data &&
									formatRelative(new Date(data.timeLastUpdate), new Date(), {
										locale: nb,
									})}
							</li>
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://github.com/wkillerud/wllm-importkalkulator"
								>
									Laget av William Killerud
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h2 className="jkl-heading-5">Tollinformasjon</h2>
						<ul className="jkl-small">
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.toll.no/no/bedrift/import/voec/voec-ordningen/"
								>
									VOEC-ordningen
								</a>
							</li>
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.toll.no/no/varer/"
								>
									Tollsatser
								</a>
							</li>
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.toll.no/no/netthandel/utregning-mva/"
								>
									Eksempelutregning
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h2 className="jkl-heading-5">Speditørers gebyrer</h2>
						<ul className="jkl-small">
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.posten.no/fortolling/motta-fra-utlandet"
								>
									Posten
								</a>
							</li>
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.fedex.com/no-no/billing/duty-tax.html"
								>
									FedEx
								</a>
							</li>
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="http://www.dhlexpress.no/importavgifter/"
								>
									DHL
								</a>
							</li>
							<li>
								<a
									className="jkl-link jkl-link--external"
									href="https://www.upscontentcentre.com/html/norway"
								>
									UPS
								</a>
							</li>
						</ul>
					</div>
				</div>
			</footer>
		</div>
	);
}
