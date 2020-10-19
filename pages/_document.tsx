/* eslint react/no-danger: 0 */
import React from 'react'
import get from 'lodash/get'
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
        </Head>
        <body>
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
