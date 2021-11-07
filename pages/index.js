import { formatRelative } from 'date-fns';
import { nb } from 'date-fns/locale';
import Head from 'next/head';
import Image from 'next/image';
import useSWR from 'swr';;
import styles from '../styles/Home.module.css';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export default function Home(props) {
  const { data, error } = useSWR('/api/nok', fetcher);

  return (
    <div className={styles.container}>
      <Head>
        <html lang="no" />
        <title>Valutakalkulator</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Valutakalkulator
        </h1>


        <div className={styles.card}>
          {error && (
            <p>
              Aida, her skjedde det noe feil så valutainformasjonen ikke kunne hentes. Du må dessverre prøve igjen senere.
            </p>
          )}
          {data && (
            <pre>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Valutainformasjon fra{' '}
          <a href="https://www.exchangerate-api.com" rel="noopener noreferrer">
            ExchangeRate-API
          </a>{' '}
          oppdatert {data && formatRelative(new Date(data.timeLastUpdate), new Date(), { locale: nb })}
        </p>
      </footer>
    </div>
  )
}
