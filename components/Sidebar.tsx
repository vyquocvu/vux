import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import config from 'config';
import ThemeToggle from './ThemeToggle';

const SideBar: FC = () => (
  <div className="fixed h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 xs:w-0 xs:overflow-hidden xs:p-0 md:w-64 md:pl-7 md:pt-10 border-r border-neutral-200 dark:border-neutral-700">
    <div className="relative" data-animation="default" data-collapse="medium" data-contain="1" data-duration="400">
      <div className="">
        <Link href="/" passHref legacyBehavior>
          <a className="group">
            <div className="pr-8 transition-transform duration-300 group-hover:scale-105">
              <Image priority width={192} height={192} src={config.avatar} className="avatar rounded-full shadow-medium ring-4 ring-white dark:ring-neutral-700" alt="avatar" />
            </div>
            <p className="mt-5 text-3xl text-neutral-800 dark:text-neutral-100 font-bold tracking-tight">{config.name}</p>
          </a>
        </Link>
        <nav className="" role="navigation">
          <p className="block text-sm my-6 leading-7 intro text-neutral-600 dark:text-neutral-400">
            <span dangerouslySetInnerHTML={{ __html: config.content }} />
          </p>
          <div className="w-3/4 my-6 border-b border-neutral-300 dark:border-neutral-600"></div>
            {
              config.pages.map(page => (
                <Link key={page.path} href={page.path} legacyBehavior >
                  <a className="text-sm py-2 text-neutral-700 dark:text-neutral-300 tracking-wide font-semibold block uppercase transition-colors duration-200 hover:text-primary-600 dark:hover:text-primary-400 hover:translate-x-1 transform">
                    {page.label}
                  </a>
                </Link>
              ))
            }
          <div className="w-3/4 my-6 border-b border-neutral-300 dark:border-neutral-600"/>
          <div className="flex gap-3 items-center">
            {
              config.socials.map(media => (
                <a key={media.icon} href={media.url} className="w-10 opacity-75 hover:opacity-100 transition-all duration-200 transform hover:scale-110" >
                  <Image priority height={25} width={25} src={media.icon} alt="media" />
                </a>
              ))
            }
          </div>
          <div className="mt-6">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </div>
  </div>
)

export default SideBar;
