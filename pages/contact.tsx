import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const Contact = () => {
  const [status, setStatus] = useState('');

  const submitForm = (ev: any) => {
    ev.preventDefault();
    const form = ev.target;
    const data = new FormData(form);
    const xhr = new XMLHttpRequest();
    xhr.open(form.method, form.action);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status === 200) {
        form.reset();
        setStatus('SUCCESS');
      } else {
        setStatus('ERROR');
      }
    };
    xhr.send(data);
  }
  return (
      <div className='post-page-view'>
        <div className="w-full p-6 h-20">
          <Link href="/" >
            <a className="border border-solid border-black rounded-full inline-block cursor-pointer w-10 h-10" >
              <Image width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
            </a>
          </Link>
        </div>
        <div className="m-auto py-6 px-4 w-128">
        {
          status === "SUCCESS" ? (
            <h3>
              <span>Submition has been successful!</span>
            </h3>
            ) : (
            <form
              onSubmit={submitForm}
              action="https://formspree.io/f/xvovgjzr"
              method="POST"
            >
              <h3> Leave me a message </h3>
              <label htmlFor="name">Your Name: </label>
              <input type="text" id="name" name="name" placeholder="Your name.." />
              <label htmlFor="email" >Email:</label>
              <input type="email" id="email" name="email" />
              <label htmlFor="message">Message: </label>
              <textarea id="message" name="message" placeholder="Write something.." style={{height: '100px'}}></textarea>
              {status === "SUCCESS" ? <p>Thanks!</p> : <button type="submit" >Submit</button>}
              {status === "ERROR" && <p>Ooops! There was an error.</p>}
            </form>
          )
        }
      </div>
    </div>
  );
};

export default Contact;
