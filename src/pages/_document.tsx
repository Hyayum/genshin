import { PUBLIC_BASE_PATH } from "@/common/config";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <link rel="icon" href={`${PUBLIC_BASE_PATH}/favicon.ico`} />
      </Head>
      <body className={`--font-geist-sans --font-geist-mono antialiased`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
