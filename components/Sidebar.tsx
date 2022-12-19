import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import config from 'config';

const SideBar: FC = () => (
  <div className="fixed h-screen bg-gray-200 xs:w-0 xs:overflow-hidden xs:p-0 md:w-64 md:pl-6 md:pt-8">
    <div className="relative" data-animation="default" data-collapse="medium" data-contain="1" data-duration="400">
      <div className="">
        <Link href="/" passHref legacyBehavior>
          <a>
            <div className="pr-8">
              <Image priority width={192} height={192} src={config.avatar} className="avatar rounded-full" alt="avatar" />
            </div>
            <p className="mt-4 text-3xl text-gray-700 font-medium">{config.name}</p>
          </a>
        </Link>
        <nav className="" role="navigation">
          <p className="block text-sm my-5 leading-6">
            <span dangerouslySetInnerHTML={{ __html: config.content }} />
          </p>
          <div className="w-1/2 my-5 border-b border-gray-700"></div>
            {
              config.pages.map(page => (
                <Link key={page.path} href={page.path} legacyBehavior >
                  <a className="text-sm py-1 text-gray-800 tracking-wide font-semibold block uppercase">
                    {page.label}
                  </a>
                </Link>
              ))
            }
          <div className="w-1/2 my-5 border-b border-gray-700"/>
          <div className="flex">
            {
              config.socials.map(media => (
                <a key={media.icon} href={media.url} className="w-10 opacity-75" >
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
