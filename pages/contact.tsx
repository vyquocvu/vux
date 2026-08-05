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
      <div className="w-full pb-6 h-16">
        <Link href="/" legacyBehavior>
          <span className="border border-hairline dark:border-surface-dark-elevated hover:border-primary dark:hover:border-primary rounded-full inline-flex items-center justify-center cursor-pointer w-9 h-9 transition-colors duration-200 bg-canvas dark:bg-surface-dark">
            <Image priority width={36} height={36} src="/icons/left_arrow.svg" alt="left" />
          </span>
        </Link>
      </div>
      <div className="m-auto py-6 px-4 w-128">
        {status === "SUCCESS" ? (
          <div className="bg-surface-card dark:bg-surface-dark-elevated border border-hairline dark:border-surface-dark-elevated rounded-lg p-8 text-center">
            <h3 className="font-display text-2xl font-normal text-ink dark:text-on-dark">
              Submission has been successful! ✓
            </h3>
          </div>
        ) : (
          <form
            onSubmit={submitForm}
            action="https://formspree.io/f/xvovgjzr"
            method="POST"
          >
            <h3 className="font-display text-3xl font-normal text-ink dark:text-on-dark mb-6 tracking-tight">Leave me a message</h3>
            <label htmlFor="name" className="block font-body text-sm font-medium text-body dark:text-on-dark-soft mb-1">Your Name:</label>
            <input type="text" id="name" name="name" placeholder="Your name.." className="mb-4" />
            <label htmlFor="email" className="block font-body text-sm font-medium text-body dark:text-on-dark-soft mb-1">Email:</label>
            <input type="email" id="email" name="email" className="mb-4" />
            <label htmlFor="message" className="block font-body text-sm font-medium text-body dark:text-on-dark-soft mb-1">Message:</label>
            <textarea id="message" name="message" placeholder="Write something.." style={{height: '100px'}} className="mb-4"></textarea>
            {status === "SUCCESS" ? (
              <p className="font-body text-sm font-medium text-success">Thanks!</p>
            ) : (
              <button type="submit">Submit</button>
            )}
            {status === "ERROR" && (
              <p className="font-body text-sm font-medium text-error mt-3">Ooops! There was an error.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export const getStaticProps = async () => ({ props: {}, revalidate: 3600 });
export default Contact;
