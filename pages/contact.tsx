import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const About = () => {
  const [status, setStatus] = useState('');
  const router = useRouter();

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
    <>
    <div className='post-page-view'>
      <div className="header">
        <a href="/" className="back-icon-link w-inline-block" >
          <img width="25" src="/icons/left_arrow.svg" />
        </a>
      </div>
      <div className="container">
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
    <style jsx >{`
      /* Style inputs with type="text", select elements and textareas */
      input[type=text], input[type="email"], select, textarea {
        width: 100%; /* Full width */
        padding: 12px; /* Some padding */ 
        border: 1px solid #ccc; /* Gray border */
        border-radius: 4px; /* Rounded borders */
        box-sizing: border-box; /* Make sure that padding and width stays in place */
        margin-top: 6px; /* Add a top margin */
        margin-bottom: 16px; /* Bottom margin */
        resize: vertical /* Allow the user to vertically resize the textarea (not horizontally) */
      }

      /* Style the submit button with a specific background color etc */
      button[type=submit] {
        background-color: #4CAF50;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      /* When moving the mouse over the submit button, add a darker green color */
      input[type=submit]:hover {
        background-color: #45a049;
      }

      /* Add a background color and some padding around the form */
      .container {
        width: 40%;
        padding: 20px;
        min-width: 400px;
        border-radius: 5px;
      }
    `}</style>
    </>
  );
};

export default About;
