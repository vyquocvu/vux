import config from "config";

const Projects = () => (
  <div className="mx-auto max-w-2xl py-12 text-center">
    <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark tracking-tight">Projects</h1>
    <p className="mt-4 font-body text-sm text-muted dark:text-on-dark-soft leading-relaxed">
      Chưa có gì để giới thiệu ở đây. Mã nguồn của site này công khai.
    </p>
    <a
      href={config.repo}
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary font-body text-sm font-medium hover:bg-primary-active transition-colors duration-200"
    >
      github.com/vyquocvu/vux
    </a>
  </div>
);

export const getStaticProps = async () => ({ props: {}, revalidate: 3600 });
export default Projects;
