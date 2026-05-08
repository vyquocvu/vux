import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import config from 'config';
import ThemeToggle from './ThemeToggle';

const SideBar: FC = () => (
  <div className="fixed h-screen bg-canvas dark:bg-surface-dark xs:w-0 xs:overflow-hidden xs:p-0 md:w-64 md:pl-7 md:pt-10 border-r border-hairline dark:border-surface-dark-elevated">
    <div className="relative">
      <div>
        <Link href="/" passHref legacyBehavior>
          <a className="group">
            <div className="pr-8">
              <Image priority width={72} height={72} src={config.avatar} className="avatar rounded-full ring-2 ring-hairline dark:ring-surface-dark-elevated" alt="avatar" />
            </div>
            <p className="mt-4 font-display text-2xl font-normal text-ink dark:text-on-dark tracking-tight">{config.name}</p>
          </a>
        </Link>
        <nav role="navigation">
          <p className="block font-body text-sm my-5 leading-6 intro text-muted dark:text-on-dark-soft">
            <span dangerouslySetInnerHTML={{ __html: config.content }} />
          </p>
          <div className="w-3/4 my-5 border-b border-hairline dark:border-surface-dark-elevated"></div>
          {
            config.pages.map(page => (
              <Link key={page.path} href={page.path} legacyBehavior>
                <a className="font-body text-sm py-1.5 text-ink dark:text-on-dark font-medium block transition-colors duration-200 hover:text-primary dark:hover:text-primary">
                  {page.label}
                </a>
              </Link>
            ))
          }
          <div className="w-3/4 my-5 border-b border-hairline dark:border-surface-dark-elevated"/>
          <div className="flex gap-3 items-center">
            {
              config.socials.map(media => (
                <a key={media.icon} href={media.url} className="w-6 opacity-60 hover:opacity-100 transition-opacity duration-200">
                  <Image priority height={20} width={20} src={media.icon} alt="media" />
                </a>
              ))
            }
          </div>
          <div className="mt-5">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </div>
  </div>
)

export default SideBar;
