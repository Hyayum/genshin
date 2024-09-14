import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head />
      <body className={`--font-geist-sans --font-geist-mono antialiased`}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
