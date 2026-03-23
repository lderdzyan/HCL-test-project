import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script type="text/javascript" src="bootstrap.js"></script>
        <Script type="text/javascript" id="Taxamo" src="https://api.taxamo.com/js/v1/taxamo.all.js" strategy="beforeInteractive"></Script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

