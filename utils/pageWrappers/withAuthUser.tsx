import { NextPageContext } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuthUser, createAuthUserInfo, type AuthInterface, type AuthUser } from "utils/auth/user";
import { getSession } from "utils/auth/session";
import { AuthUserInfoContext, AuthUserInfoProvider } from "utils/auth/hooks";

type Props = {
  AuthUserInfo: AuthInterface;
};

const withAuthUser = (ComposedComponent: any) => {
  const WithAuthUserComp = (props: Props) => {
    const { AuthUserInfo, ...rest } = props;
    return (
      <AuthUserInfoProvider initial={AuthUserInfo}>
        <AuthUserInfoContext.Consumer>
          {(ctxAuth) => {
            const effective = ctxAuth ?? AuthUserInfo;
            return (
              <AuthUserInfoContext.Provider value={effective}>
                <ComposedComponent {...rest} AuthUserInfo={effective} />
              </AuthUserInfoContext.Provider>
            );
          }}
        </AuthUserInfoContext.Consumer>
      </AuthUserInfoProvider>
    );
  };

  WithAuthUserComp.getInitialProps = async (ctx: NextPageContext & { myCustomData: { AuthUserInfo?: AuthInterface } }) => {
    let AuthUserInfo: AuthInterface;
    // Auth-gated pages must never be CDN-cached: the session cookie is
    // private and we want every request to round-trip through the Worker so
    // server-side gating in getInitialProps actually runs.
    try {
      ctx.res?.setHeader?.("Cache-Control", "private, no-store");
    } catch {}
    if (typeof window === "undefined") {
      const { req, res } = ctx;
      try {
        const { env } = await getCloudflareContext({ async: true });
        const session = await getSession(req as any, res as any, env);
        AuthUserInfo = session.userId
          ? {
              AuthUser: {
                id: session.userId,
                email: session.email ?? "",
                displayName: session.displayName ?? null,
                isAdmin: !!session.isAdmin,
              },
              token: "session",
            }
          : createAuthUserInfo();
      } catch {
        AuthUserInfo = createAuthUserInfo();
      }
    } else {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (res.ok) {
          const data = (await res.json()) as { authUser?: AuthUser | null };
          AuthUserInfo = data.authUser
            ? { AuthUser: createAuthUser(data.authUser), token: "session" }
            : createAuthUserInfo();
        } else {
          AuthUserInfo = createAuthUserInfo();
        }
      } catch {
        AuthUserInfo = createAuthUserInfo();
      }
    }

    ctx.myCustomData = { AuthUserInfo };

    let composedInitialProps: any = {};
    if (ComposedComponent.getInitialProps) {
      composedInitialProps = await ComposedComponent.getInitialProps(ctx);
    }
    return { ...composedInitialProps, AuthUserInfo };
  };

  WithAuthUserComp.displayName = `WithAuthUser(${ComposedComponent.displayName ?? "Component"})`;

  return WithAuthUserComp;
};

export default withAuthUser;
