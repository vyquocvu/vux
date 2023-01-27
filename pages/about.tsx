import Image from "next/image";

const About = () => {
  const techStack = [
    'javascript,typescript,nodejs',
    'react,redux,nextjs,vue,sass,tailwindcss',
    'ruby,rails,mongodb,postgresql,mysql,gcp,docker',
  ]
  return (
    <div>
      <h1 className="text-5xl font-medium">About</h1>
      <br />
      <div>
        <b>Name:</b> Vy Quốc Vũ, I am a Software Engineer  <br />
        <b>Email:</b> <a className="underline" href="mailto:vyquocvu@gmail.com"> vyquocvu@gmail.com</a> <br/>
        <b>Skype:</b> <a className="underline" href="skype:live:vyquocvu?chat"> live:vyquocvu</a> <br/>
        <b>Work:</b> Web development backend to frontend ⚡  <br />
        <b>Graduate: </b> <a className="underline" href="https://oisp.hcmut.edu.vn/en/study-programs/bachelor-degree/computer-science">Bachelor of Computer Science</a><br />
        <b>Tech: </b>
        <div className="text-sm capitalize max-w-md inline-flex">
          {techStack.join(',').replaceAll(',', ', ')}
        </div>
        <br/>
        <Image width={375} height={50} alt="skills" src={`https://skillicons.dev/icons?i=${techStack.join(',')}&perline=8`} />
      </div>
    </div>
  );
};

export default About;
