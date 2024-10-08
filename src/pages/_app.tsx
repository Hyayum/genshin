import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  
  return (
    <>
      <Head>
        <title>原神用計算機</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
