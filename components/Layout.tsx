import React from 'react';

import Head from "next/head";
import dynamic from "next/dynamic";

import config from 'config';
const Sidebar = dynamic(() => import('components/Sidebar'));
const MainContent = dynamic(() => import('components/MainContent'));


const Layout = ({ children }: { children: React.ReactChild }) => {

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