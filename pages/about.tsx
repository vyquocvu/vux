import Image from "next/image";

const About = () => {
  const techStack = [
    'javascript,typescript,nodejs',
    'react,redux,nextjs,vue,sass,tailwindcss',
    'ruby,rails,mongodb,postgresql,mysql,gcp,docker',
  ]
  return (
    <div>
      <h1 className="font-display text-5xl font-normal text-ink dark:text-on-dark mb-8 tracking-tight">About</h1>
      <div className="space-y-4 font-body text-body dark:text-on-dark-soft leading-relaxed">
        <p><span className="font-medium text-ink dark:text-on-dark">Name:</span> Vy Quốc Vũ, I am a Software Engineer</p>
        <p><span className="font-medium text-ink dark:text-on-dark">Email:</span> <a className="text-primary hover:text-primary-active transition-colors duration-200 underline" href="mailto:vyquocvu@gmail.com">vyquocvu@gmail.com</a></p>
        <p><span className="font-medium text-ink dark:text-on-dark">Skype:</span> <a className="text-primary hover:text-primary-active transition-colors duration-200 underline" href="skype:live:vyquocvu?chat">live:vyquocvu</a></p>
        <p><span className="font-medium text-ink dark:text-on-dark">Work:</span> Web development backend to frontend ⚡</p>
        <p><span className="font-medium text-ink dark:text-on-dark">Graduate:</span> <a className="text-primary hover:text-primary-active transition-colors duration-200 underline" href="https://oisp.hcmut.edu.vn/en/study-programs/bachelor-degree/computer-science">Bachelor of Computer Science</a></p>
        <div>
          <span className="font-medium text-ink dark:text-on-dark">Tech:</span>
          <span className="font-body text-sm ml-2 text-body dark:text-on-dark-soft">
            {techStack.join(',').replaceAll(',', ', ')}
          </span>
        </div>
        <div className="pt-4">
          <Image width={375} height={50} alt="skills" src={`https://skillicons.dev/icons?i=${techStack.join(',')}&perline=8`} />
        </div>
      </div>
    </div>
  );
};

export default About;
