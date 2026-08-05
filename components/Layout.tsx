import { ReactNode } from 'react';
import Head from "next/head";
import { Inter } from "next/font/google";

import config from "config";
import Sidebar from "components/Sidebar";
import MainContent from "components/MainContent";

const displayFont = Inter({
  weight: ['400', '500'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = Inter({
  weight: ['400', '500'],
  display: 'swap',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
});

const Layout = ({ children, isPost }: { children: ReactNode, isPost: boolean }) => {
  return (
    <>
      {!isPost ? <Head>
        <meta name="author" content={config.author} />
        <meta name="keywords" content={config.keywords} />
        <meta name="description" content={config.description}/>

        <meta name="og:title" content={config.title}/>
        <meta name="og:image" content={config.avatar}/>
        <meta name="og:description" content={config.description}/>
      </Head> : ""}
      <div className={`${displayFont.variable} ${bodyFont.variable}`}>
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </>
  )
};

export default Layout;
