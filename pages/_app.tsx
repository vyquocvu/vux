import * as React from 'react';
import App from 'next/app';
import Head from 'next/head';

import "../styles/layout.scss";
import "../styles/main.scss";
import "../styles/post-editor.scss";

export default class MyApp extends App {
  public render() {
    const { Component, pageProps } = this.props

    return (
      <>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,600;1,700;1,800&display=swap" rel="stylesheet" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Xblog</title>
        </Head>
        <Component {...pageProps} />
      </>
    )
  }
}