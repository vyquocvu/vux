import React from "react";
import Sidebar from 'components/Sidebar';
import MainContent from 'components/MainContent';

const About = () => {
  return (
    <div className='about-page-view'>
      <Sidebar />
      <MainContent>
        <h1>About</h1>
        <div>
          <b>Name:</b> Vy Quốc Vũ <br />
          <b>Email:</b> vyquocvu@gmail.com
        </div>
      </MainContent>
    </div>
  );
};

export default About;
