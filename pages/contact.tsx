import { useState } from "react";
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
          <Link href="/" legacyBehavior>
            <span className="border-2 border-neutral-300 hover:border-primary-500 rounded-full inline-flex items-center justify-center cursor-pointer w-10 h-10 transition-all duration-200 hover:shadow-soft" >
              <Image priority width={40} height={40} src="/icons/left_arrow.svg" alt="left" />
            </span>
          </Link>
        </div>
        <div className="m-auto py-6 px-4 w-128">
        {
          status === "SUCCESS" ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-green-800">
                <span>Submission has been successful! ✓</span>
              </h3>
            </div>
            ) : (
            <form
              onSubmit={submitForm}
              action="https://formspree.io/f/xvovgjzr"
              method="POST"
            >
              <h3 className="text-3xl font-bold text-neutral-900 mb-6"> Leave me a message </h3>
              <label htmlFor="name" className="block text-sm font-semibold text-neutral-700 mb-1">Your Name: </label>
              <input type="text" id="name" name="name" placeholder="Your name.." className="mb-4" />
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-1">Email:</label>
              <input type="email" id="email" name="email" className="mb-4" />
              <label htmlFor="message" className="block text-sm font-semibold text-neutral-700 mb-1">Message: </label>
              <textarea id="message" name="message" placeholder="Write something.." style={{height: '100px'}} className="mb-4"></textarea>
              {status === "SUCCESS" ? <p className="text-green-600 font-semibold">Thanks!</p> : <button type="submit" >Submit</button>}
              {status === "ERROR" && <p className="text-red-600 font-semibold">Ooops! There was an error.</p>}
            </form>
          )
        }
      </div>
    </div>
  );
};

export default Contact;
