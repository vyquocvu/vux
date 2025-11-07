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
      <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-medium border border-neutral-200">
        <h1 className="text-3xl font-bold text-neutral-900 mb-6 text-center">Log In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-1">Email: </label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={handleInputChange}
              value={inputs.email}
              ref={r => (firstInput = r)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-1">Password: </label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleInputChange}
              value={inputs.password}
              className="w-full"
            />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full">Log In</button>
          </div>
        </form>
      </div>
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
