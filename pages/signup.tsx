import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/router";
import initFirebase from "utils/auth/initFirebase";
import Footer from "components/footer";

initFirebase();

type Inputs = {
  email: string;
  password: string;
  displayName: string;
};

function Signup() {
  const initialValues: Inputs = {
    email: "",
    password: "",
    displayName: ""
  };
  const router = useRouter();
  var firstInput: HTMLInputElement | null = null;

  const [inputs, setInputs] = useState(initialValues);

  const handleSubmit = async (e: ChangeEvent<any>) => {
    e.preventDefault();
    try {
      await firebase.auth().createUserWithEmailAndPassword(inputs.email, inputs.password);
      var user = firebase.auth().currentUser;
      if (user) {
        await user.updateProfile({
          displayName: inputs.displayName
        });
      }
      router.push("/");
    } catch (error) {
      alert(error);
    }
  };

  const handleInputChange = (e: ChangeEvent<any>) => {
    e.persist();
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    firstInput?.focus();
  }, [firstInput]); // [] = run once

  return (
    <>
      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="email">email: </label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={handleInputChange}
            value={inputs.email}
            ref={r => (firstInput = r)}
          />
        </p>
        <p>
          <label htmlFor="password">password: </label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={handleInputChange}
            value={inputs.password}
          />
        </p>
        <p>
          <label htmlFor="displayName">display name: </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            onChange={handleInputChange}
            value={inputs.displayName}
          />
        </p>
        <p>
          <button type="submit">[ create account ]</button>
        </p>
      </form>
      <p>
        {"or "}
        <Link href="/login" legacyBehavior>[ log in ]</Link>
      </p>
      <Footer />
    </>
  );
}

export default Signup;
