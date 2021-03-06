import React, { useState, useEffect, ChangeEvent } from "react";
import firebase from "firebase/app";
import "firebase/auth";
import get from 'lodash/get';
import { useRouter } from "next/router";
import initFirebase from "utils/auth/initFirebase";

import { AuthInterface } from 'interfaces/User';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";

initFirebase();

type Inputs = {
  email: string;
  password: string;
};

type Props = {
  AuthUserInfo: AuthInterface,
}
function Login(props: Props) {
  const initial: Inputs = {
    email: "",
    password: ""
  };
  const router = useRouter();

  if (typeof window !== undefined && props?.AuthUserInfo?.token) {
    return router.push("/admin");
  }

  var firstInput: (HTMLInputElement | null) = null;

  const [inputs, setInputs] = useState(initial);

  const handleSubmit = async (e: ChangeEvent<any>) => {
    e.preventDefault();
    try {
      await firebase.auth().signInWithEmailAndPassword(inputs.email, inputs.password);
      router.push("/admin");
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
  }, []);

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
          <button type="submit">[ log in ]</button>
        </p>
      </form>
    </>
  );
}

Login.getInitialProps = (ctx: any) => {
  const token = get(ctx, 'myCustomData.AuthUserInfo.token');
  if (token && ctx.res) {
    ctx.res.writeHead(302, { Location: '/admin' }).end();
  }
  return {};
}

export default withAuthUser(withAuthUserInfo(Login));
