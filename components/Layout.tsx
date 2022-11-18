import { ReactChild } from 'react';
import Head from "next/head";

import config from 'config';
import Sidebar from "components/Sidebar";
import MainContent from "components/MainContent";

const Layout = ({ children }: { children: ReactChild }) => {
  return (
    <>
      <Head>
        <meta name="author" content={config.author} />
        <meta name="keywords" content={config.keywords} />
        <meta name="description" content={config.description}/>

        <meta name="og:title" content={config.title}/>
        <meta name="og:image" content={config.avatar}/>
        <meta name="og:description" content={config.description}/>
      </Head>
      <div className="">
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </ div>
    </>
  )
};

export default Layout;