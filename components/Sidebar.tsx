import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

import config from 'config';

const SideBar = () => (
  <div className="fixed h-screen bg-gray-200 xs:w-0 xs:overflow-hidden xs:p-0 md:w-64 md:pl-6 md:pt-8">
    <div className="relative" data-animation="default" data-collapse="medium" data-contain="1" data-duration="400">
      <div className="">
        <a href="/">
          <div className="pr-8">
            <Image width={192} height={192} src={config.avatar} className="avatar rounded-full" alt="avatar" />
          </div>
          <h1 className="mt-4 text-3xl text-gray-700 font-semibold font-semibold">{config.name}</h1>
        </a>
        <nav className="" role="navigation">
          <p className="block text-sm my-5 leading-6">
            <span dangerouslySetInnerHTML={{ __html: config.content }} />
          </p>
          <div className="w-1/2 my-5 border-b border-gray-700"></div>
            {
              config.pages.map(page => (
                <Link key={page.path} href={page.path} >
                  <a className={ "text-sm py-1 text-gray-800 tracking-wide font-semibold block uppercase"} >{page.label}</a>
                </Link>
              ))
            }
          <div className="w-1/2 my-5 border-b border-gray-700"/>
          <div className="flex">
            {
              config.socials.map(media => (
                <a key={media.icon} href={media.url} className="w-10 opacity-75" >
                  <Image height={24} width={25} src={media.icon} alt="media" />
                </a>
              ))
            }
          </div>
        </nav>
      </div>
    </div>
  </div>
)

SideBar.getInitialProps = () => ({});

export default SideBar;
