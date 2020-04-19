import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'


type Props = {};

const mock = {
  name: 'Moon',
  content: `I'm a simple responsive blog template. Easily add new blog posts using the
  Webflow Editor or customize your layout/design using the Webflow Designer.`,
  avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000',
  pages: [
    { path: '/', label: 'Home' },
    { path: '/all-posts', label: 'All Posts' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ],
  socials: [
    { url: '/contact', label: 'Contact', icon: 'http://uploads.webflow.com/56d6955f710a7126338b8b1c/56d6955f710a7126338b8ba7_social-03-white.svg' },
    { url: '/contact', label: 'Contact', icon: 'http://uploads.webflow.com/56d6955f710a7126338b8b1c/56d6955f710a7126338b8b95_social-18-white.svg' },
    { url: '/contact', label: 'Contact', icon: 'http://uploads.webflow.com/56d6955f710a7126338b8b1c/56d6955f710a7126338b8b92_social-15-white.svg' },
    { url: '/contact', label: 'Contact', icon: 'http://uploads.webflow.com/56d6955f710a7126338b8b1c/56d6955f710a7126338b8b9f_social-33-white.svg' },
    { url: '/contact', label: 'Contact', icon: 'http://uploads.webflow.com/56d6955f710a7126338b8b1c/56d6955f710a7126338b8bb3_social-07-white.svg' },
    { url: '/contact', label: 'Contact', icon: 'http://uploads.webflow.com/56d6955f710a7126338b8b1c/56d6955f710a7126338b8b91_social-09-white.svg' }
  ]
}

function checkCurrentPath(pathname: string) {
  const router = useRouter();
  return router.pathname == pathname;
}

const SideBar: React.FunctionComponent<Props> = () => (
  <div className="sidebar-column">
    <div className="navigation-bar w-nav" data-animation="default" data-collapse="medium" data-contain="1" data-duration="400">
      <div className="w-container">
        <a className="logo-link w-nav-brand" href="#">
          <h1 className="logo-text">{mock.name}</h1>
          <img src={mock.avatar} className="avatar" />
        </a>
        <nav className="navigation-menu w-nav-menu" role="navigation">
          <p className="main-subheading w-hidden-medium w-hidden-small w-hidden-tiny">
            {mock.content}
          </p>
          <div className="divider w-hidden-medium w-hidden-small w-hidden-tiny"></div>
            {
              mock.pages.map(page => (
                <Link key={page.path} href={page.path} >
                  <a className={ "nav-link w-nav-link" + checkCurrentPath(page.path) } >{page.label}</a>
                </Link>
              ))
            }
          <div className="divider"/>
          <div className="social-link-group flex">
            {
              mock.socials.map(media => (
                <Link key={media.icon} href={media.url} >
                  <a className="social-icon-link w-inline-block" >
                    <img width="25" src={media.icon} />
                  </a>
                </Link>
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
    <style jsx>{`
      .sidebar-column {
        position: fixed;
        left: 0px;
        top: 0px;
        bottom: 0px;
        width: 25%;
        height: 100%;
        padding: 50px 40px;
        background-color: #333;
        color: #9b9b9b;
        font-family: 'Open Sans', sans-serif;
        box-sizing: border-box;
      }
      .navigation-menu {
        float: none;
      }
      .navigation-bar {
        display: block;
        max-width: 300px;
        margin-right: auto;
        margin-left: auto;
        background-color: transparent;
      }

      .main-subheading {
        display: block;
        margin-top: 20px;
        margin-bottom: 20px;
        font-size: 12px;
        line-height: 150%;
      }
      .w-nav {
        position: relative;
        z-index: 1000;
      }
      .w-container {
        margin-left: auto;
        margin-right: auto;
        max-width: 940px;
      }
      .logo-link {
        display: block;
        float: none;
        text-decoration: none;
      }
      .logo-text {
        margin-top: 0px;
        margin-bottom: 0px;
        font-family: 'Open Sans', sans-serif;
        color: #f0f0f0;
        font-size: 28px;
        line-height: 120%;
        font-weight: 600;
      }

      .w-nav-menu {
        position: relative;
        float: right;
      }
      .nav-link {
        display: block;
        padding: 6px 0px;
        -webkit-transition: color 200ms ease;
        transition: color 200ms ease;
        color: #969696;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-decoration: none;
        text-transform: uppercase;
      }
      .w-nav-link {
        font-size: 12px;
        font-weight: 600;
      }
      .divider {
        width: 50%;
        height: 1px;
        margin-top: 20px;
        margin-bottom: 20px;
        background-color: #5e5e5e;
      }
      .social-icon-link {
        width: 19px;
        margin-right: 11px;
        opacity: 0.41;
        -webkit-transition: opacity 200ms ease;
        transition: opacity 200ms ease;
      }
      .avatar {
        border-radius: 50%;
      }
    `}
    </style>
  </div>
)

export default SideBar
