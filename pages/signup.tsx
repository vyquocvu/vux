import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import withAuthUser from "utils/pageWrappers/withAuthUser";
import withAuthUserInfo from "utils/pageWrappers/withAuthUserInfo";
import { get } from "utils/common";

function Signup() {
  const router = useRouter();
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (document.getElementById("email") as HTMLInputElement | null)?.focus();
  }, []);

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(inputs),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sign-up failed");
      router.push("/admin");
    } catch (err: any) {
      setError(err.message ?? "Sign-up failed");
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-medium border border-neutral-200">
      <h1 className="text-3xl font-bold text-neutral-900 mb-6 text-center">Sign Up</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-semibold text-neutral-700 mb-1">Display name:</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={inputs.displayName}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-1">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={inputs.email}
            onChange={handleInputChange}
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-1">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={inputs.password}
            onChange={handleInputChange}
            required
            minLength={8}
            className="w-full"
          />
          <p className="text-xs text-neutral-500 mt-1">At least 8 characters.</p>
        </div>
        {error && (
          <p className="text-sm text-error font-medium" role="alert">{error}</p>
        )}
        <div className="pt-4">
          <button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating…" : "Create account"}
          </button>
        </div>
      </form>
      <p className="text-center text-sm text-neutral-500 mt-6">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}

Signup.getInitialProps = (ctx: any) => {
  const token = get(ctx, "myCustomData.AuthUserInfo.token");
  if (token && ctx.res) {
    ctx.res.writeHead(302, { Location: "/admin" }).end();
  }
  return {};
};

export default withAuthUser(withAuthUserInfo(Signup));
