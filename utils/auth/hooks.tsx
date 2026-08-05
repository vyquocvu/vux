/**
 * Client-side React hooks for reading the current authenticated user.
 *
 * Strategy: on mount we call `GET /api/auth/me`, then expose the user via
 * `AuthUserInfoContext`. No Firebase — the user is whatever was put into the
 * `vux_session` cookie by the iron-session helper on the server.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createAuthUserInfo } from "utils/auth/user";
import type { AuthInterface } from "utils/auth/user";

export const AuthUserInfoContext = createContext<AuthInterface>(createAuthUserInfo());

export const useAuthUserInfo = () => useContext(AuthUserInfoContext);

export const AuthUserInfoProvider = ({
  children,
  initial,
}: {
  children: ReactNode;
  initial: AuthInterface;
}) => {
  const [info, setInfo] = useState<AuthInterface>(initial);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      setInfo({
        AuthUser: detail
          ? {
              id: detail.id,
              email: detail.email,
              displayName: detail.displayName ?? null,
              isAdmin: !!detail.isAdmin,
            }
          : null,
        token: detail ? "session" : "",
      });
    };
    window.addEventListener("vux:auth", handler);
    return () => window.removeEventListener("vux:auth", handler);
  }, []);
  return <AuthUserInfoContext.Provider value={info}>{children}</AuthUserInfoContext.Provider>;
};
