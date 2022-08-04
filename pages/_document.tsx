import React from 'react';
import get from 'lodash/get';
import Script from 'next/script'
import Document, { Html, Head, Main, NextScript } from 'next/document'

import { AuthInterface } from 'interfaces/User';

type Props = {
  AuthUserInfo: AuthInterface,
}
class CustomDocument extends Document<Props> {
  render() {
    const { AuthUserInfo } = this.props
    return (
      <Html lang="vi">
        <Head>
          <script
            id="__MY_AUTH_USER_INFO"
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(AuthUserInfo, null, 2),
            }}
          />
          <meta name="google-site-verification" content="_vqnisYcxdK3w-UCYbVTaIP9lL_k29CFbUm7z8nSmmI" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet" />
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=GTM-THCFN5G"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'GTM-THCFN5G');
            `}
          </Script>
        </Head>
        <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-THCFN5G"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}/>
        </noscript>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

CustomDocument.getInitialProps = async ctx => {
  // Get the AuthUserInfo object. This is set if the server-rendered page
  // is wrapped in the `withAuthUser` higher-order component.
  const AuthUserInfo = get(ctx, 'myCustomData.AuthUserInfo', null);
  if (AuthUserInfo?.AuthUser?.email) {
    AuthUserInfo.AuthUser.isAdmin = AuthUserInfo.AuthUser.email === process.env.OWNER_EMAIL;
  }

  const initialProps = await Document.getInitialProps(ctx)
  return { ...initialProps, AuthUserInfo }
}

export default CustomDocument
