import Image from "next/image";
import type { ReactNode } from "react";

const About = () => {
  const techStack = [
    'javascript,typescript,nodejs',
    'react,redux,nextjs,vue,sass,tailwindcss',
    'ruby,rails,mongodb,postgresql,mysql,gcp,docker',
  ];
  const link = "text-primary hover:text-primary-active transition-colors duration-200 underline underline-offset-2";
  const rows: [string, ReactNode][] = [
    ['Email', <a key="email" className={link} href="mailto:vyquocvu@gmail.com">vyquocvu@gmail.com</a>],
    ['Skype', <a key="skype" className={link} href="skype:live:vyquocvu?chat">live:vyquocvu</a>],
    ['Work', 'Web development, backend to frontend'],
    ['Graduate', <a key="oisp" className={link} href="https://oisp.hcmut.edu.vn/en/study-programs/bachelor-degree/computer-science">Bachelor of Computer Science</a>],
  ];

  return (
    <div className="mx-auto max-w-3xl lg:max-w-none">
      <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark mb-8 tracking-tight">About</h1>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-12">
        <div>
          <p className="font-body text-body dark:text-on-dark-soft leading-relaxed mb-6">
            <span className="font-medium text-ink dark:text-on-dark">Vy Quốc Vũ</span> — Software Engineer.
          </p>
          <dl className="divide-y divide-hairline dark:divide-surface-dark-elevated border-y border-hairline dark:border-surface-dark-elevated">
            {rows.map(([k, v]) => (
              <div key={k} className="py-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-4">
                <dt className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium pt-1">{k}</dt>
                <dd className="font-body text-sm text-body dark:text-on-dark-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-10 lg:mt-0">
          <p className="font-body text-[11px] uppercase tracking-widest text-muted-soft font-medium mb-4">Stack</p>
          <Image width={375} height={50} alt="skills" src={`https://skillicons.dev/icons?i=${techStack.join(',')}&perline=8`} />
        </div>
      </div>
    </div>
  );
};

export const getStaticProps = async () => ({ props: {}, revalidate: 3600 });
export default About;
