import { get } from "utils/common";
import type { PublicUser } from "utils/auth/d1";
export type { PublicUser } from "utils/auth/d1";
export type AuthUser = PublicUser;

export interface AuthInterface {
  AuthUser: AuthUser | null;
  token: string; // empty string when not signed in (kept for back-compat)
}

/**
 * Build a normalized AuthInterface for a D1 user row.
 */
export const createAuthUser = (user: AuthUser | null): AuthUser | null => {
  if (!user || !user.id) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: !!user.isAdmin,
  };
};

export const createAuthUserInfo = ({
  user = null,
  token = "",
} = {}): AuthInterface => ({
  AuthUser: createAuthUser(user),
  token,
});

/**
 * Read the typed row out of a Vercel/Next getServerSideProps context.
 */
export const getAuthUserInfoFromContext = (ctx: any): AuthInterface =>
  (get(ctx, "myCustomData.AuthUserInfo") as AuthInterface | undefined) ??
  createAuthUserInfo();
