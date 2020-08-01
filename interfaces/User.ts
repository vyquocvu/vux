export interface AuthInterface {
  AuthUser: {
    id: string,
    email: string,
    emailVerified: boolean,
    displayName: string
  },
  token: string
}