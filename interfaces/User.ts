export interface AuthInterface {
  AuthUser: {
    id: string,
    email: string,
    emailVerified: boolean,
  },
  token: string
}