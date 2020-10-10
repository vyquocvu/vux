import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import config from 'config';

function checkCurrentPath(pathname: string) {
  const router = useRouter();
  return router.pathname == pathname;
}

const SideBar = () => (
  <div className="sidebar-column">
    <div className="navigation-bar w-nav" data-animation="default" data-collapse="medium" data-contain="1" data-duration="400">
      <div className="w-container">
        <a className="logo-link w-nav-brand" href="/">
          <img src={config.avatar} className="avatar" />
          <h1 className="logo-text">{config.name}</h1>
        </a>
        <nav className="navigation-menu w-nav-menu" role="navigation">
          <p className="main-subheading w-hidden-medium w-hidden-small w-hidden-tiny">
            <span dangerouslySetInnerHTML={{ __html: config.content }} />
          </p>
          <div className="divider w-hidden-medium w-hidden-small w-hidden-tiny"></div>
            {
              config.pages.map(page => (
                <Link key={page.path} href={page.path} >
                  <a className={ "nav-link w-nav-link" + checkCurrentPath(page.path) } >{page.label}</a>
                </Link>
              ))
            }
          <div className="divider"/>
          <div className="social-link-group flex">
            {
              config.socials.map(media => (
                <a key={media.icon} href={media.url} className="social-icon-link w-inline-block" >
                  <img width="25" src={media.icon} />
                </a>
              ))
            }
          </div>
        </nav>
        <div className="menu-button w-nav-button">
          <div className="w-icon-nav-menu"/>
        </div>
      </div>
      <div className="w-nav-overlay" data-wf-ignore=""/>
    </div>
  </div>
)

SideBar.getInitialProps = () => ({});

export default SideBar;
