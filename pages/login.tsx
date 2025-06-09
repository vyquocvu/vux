import { useState, useEffect, ChangeEvent } from "react";
import { get } from 'utils/common';
import initFirebase from "utils/auth/initFirebase";

import { AuthInterface } from 'interfaces/User';
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";
import { useRouter } from "next/router";

const firebase = initFirebase();

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

  var firstInput: (HTMLInputElement | null) = null;
  const [inputs, setInputs] = useState(initial);

  useEffect(() => {
    firstInput?.focus();
  }, [firstInput]);


  if (typeof window !== 'undefined' && props?.AuthUserInfo?.token) {
    return router.push("/admin");
  }

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
