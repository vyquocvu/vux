import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from 'components/Layout';
import GitHubCorner from 'components/shared/GitHubCorner';
import config from 'config';

import { ToastProvider } from 'react-toast-notifications';
import { ThemeProvider } from 'contexts/ThemeContext';

import "styles/globals.css";
import "styles/monokai-sublime.min.css";

const NextNProgress = dynamic(
  () => import('components/Nprogress'),
  { ssr: false }
);

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{config.title}</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest"></link>
      </Head>
      <ThemeProvider>
        <div>
          <GitHubCorner repoUrl={config.repo} />
          <ToastProvider>
            <NextNProgress />
            <Layout isPost={!!pageProps.post}>
              <Component {...pageProps} />
            </Layout>
          </ToastProvider>
        </div>
      </ThemeProvider>
    </>
  );
};

export default MyApp;
