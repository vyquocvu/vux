import Image from "next/image";

const About = () => {
  const teckStack = [
    'javascript,typescript,nodejs,ruby',
    'react,redux,nextjs,vue,sass,tailwindcss',
    'rails,mongodb,postgresql,mysql,gcp,docker',
  ]
  return (
    <div>
      <h1 className="text-5xl font-medium">About</h1>
      <div>
        <b>Name:</b> Vy Quốc Vũ, I am a Software Engineer  <br />
        <b>Email:</b> <a className="underline" href="mailto:vyquocvu@gmail.com">vyquocvu@gmail.com</a> <br/>
        <b>Work:</b> Web development backend to frontend ⚡  <br />
        <b>Graduate:</b> Bachelor of Computer Science.  <br />
        <b>Techs:</b>
        <br/>
        <Image width={375} height={50} alt="skills" src={`https://skillicons.dev/icons?i=${teckStack.join(',')}&perline=8`} />
      </div>
    </div>
  );
};

export default About;
