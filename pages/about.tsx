import Image from "next/image";

const About = () => {
  const techStack = [
    'javascript,typescript,nodejs',
    'react,redux,nextjs,vue,sass,tailwindcss',
    'ruby,rails,mongodb,postgresql,mysql,gcp,docker',
  ]
  return (
    <div>
      <h1 className="text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">About</h1>
      <div className="space-y-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <p><span className="font-semibold text-neutral-900 dark:text-neutral-100">Name:</span> Vy Quốc Vũ, I am a Software Engineer</p>
        <p><span className="font-semibold text-neutral-900 dark:text-neutral-100">Email:</span> <a className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 transition-colors duration-200 underline" href="mailto:vyquocvu@gmail.com"> vyquocvu@gmail.com</a></p>
        <p><span className="font-semibold text-neutral-900 dark:text-neutral-100">Skype:</span> <a className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 transition-colors duration-200 underline" href="skype:live:vyquocvu?chat"> live:vyquocvu</a></p>
        <p><span className="font-semibold text-neutral-900 dark:text-neutral-100">Work:</span> Web development backend to frontend ⚡</p>
        <p><span className="font-semibold text-neutral-900 dark:text-neutral-100">Graduate:</span> <a className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-500 transition-colors duration-200 underline" href="https://oisp.hcmut.edu.vn/en/study-programs/bachelor-degree/computer-science">Bachelor of Computer Science</a></p>
        <div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">Tech:</span>
          <div className="text-sm capitalize max-w-md inline-block ml-2">
            {techStack.join(',').replaceAll(',', ', ')}
          </div>
        </div>
        <div className="pt-4">
          <Image width={375} height={50} alt="skills" src={`https://skillicons.dev/icons?i=${techStack.join(',')}&perline=8`} />
        </div>
      </div>
    </div>
  );
};

export default About;
