import * as React from 'react';
import App from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import config from 'config';

import { ToastProvider } from 'react-toast-notifications';
// const ToastProvider = dynamic(
//   import('react-toast-notifications')
//     .then(({ ToastProvider }) => ToastProvider) as any,
//   { ssr: false }
// );

const NextNProgress = dynamic(
  () => import('components/Nprogress'),
  { ssr: false }
);


import "styles/main.scss";
import "styles/layout.scss";
import "styles/post-page.scss";
import "styles/list-post.scss";
import "styles/post-editor.scss";
import "styles/shared/loading.scss";
import "react-quill/dist/quill.snow.css";

export default class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,600;1,700;1,800&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{config.title}</title>
        </Head>
        <ToastProvider>
          <NextNProgress />
          <Component {...pageProps} />
        </ToastProvider>
      </>
    )
  }
}