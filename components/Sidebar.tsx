import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import config from 'config';

const SideBar: FC = () => (
  <div className="fixed h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 xs:w-0 xs:overflow-hidden xs:p-0 md:w-64 md:pl-7 md:pt-10 border-r border-neutral-200 shadow-soft">
    <div className="relative" data-animation="default" data-collapse="medium" data-contain="1" data-duration="400">
      <div className="">
        <Link href="/" passHref legacyBehavior>
          <a className="group">
            <div className="pr-8 transition-transform duration-300 group-hover:scale-105">
              <Image priority width={192} height={192} src={config.avatar} className="avatar rounded-full shadow-medium ring-4 ring-white" alt="avatar" />
            </div>
            <p className="mt-5 text-3xl text-neutral-800 font-bold tracking-tight">{config.name}</p>
          </a>
        </Link>
        <nav className="" role="navigation">
          <p className="block text-sm my-6 leading-7 intro text-neutral-600">
            <span dangerouslySetInnerHTML={{ __html: config.content }} />
          </p>
          <div className="w-3/4 my-6 border-b border-neutral-300"></div>
            {
              config.pages.map(page => (
                <Link key={page.path} href={page.path} legacyBehavior >
                  <a className="text-sm py-2 text-neutral-700 tracking-wide font-semibold block uppercase transition-colors duration-200 hover:text-primary-600 hover:translate-x-1 transform">
                    {page.label}
                  </a>
                </Link>
              ))
            }
          <div className="w-3/4 my-6 border-b border-neutral-300"/>
          <div className="flex gap-3">
            {
              config.socials.map(media => (
                <a key={media.icon} href={media.url} className="w-10 opacity-75 hover:opacity-100 transition-all duration-200 transform hover:scale-110" >
                  <Image priority height={25} width={25} src={media.icon} alt="media" />
                </a>
              ))
            }
          </div>
        </nav>
      </div>
    </div>
  </div>
)

export default SideBar;
