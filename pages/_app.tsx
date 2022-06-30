import * as React from 'react';
import App from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import config from 'config';

import { ToastProvider } from 'react-toast-notifications';
const NextNProgress = dynamic(
  () => import('components/Nprogress'),
  { ssr: false }
);


// import "styles/main.scss";
// import "styles/shared/loading.scss";
// import "react-quill/dist/quill.snow.css";

class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props;
    return (
      <div className="h-screen">
        <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{config.title}</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest"></link>
        </Head>
        <ToastProvider>
          <NextNProgress />
          <Component {...pageProps} />
        </ToastProvider>
      </div>
    )
  }
}
export default MyApp;
