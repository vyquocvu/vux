import { get } from "utils/common";
import { NextPageContext } from "next";

import { AuthInterface } from 'utils/auth/user';
import { AuthUserInfoContext } from "utils/auth/hooks";
// Provides an AuthUserInfo prop to the composed component.
type Props = {
  AuthUserInfo: AuthInterface,
}
const withAuthUserInfo = (ComposedComponent: any) => {
  const WithAuthUserInfoComp = (props: Props) => {
    const { AuthUserInfo: AuthUserInfoFromSession, ...otherProps } = props;
    return (
      <AuthUserInfoContext.Consumer>
        {AuthUserInfo => (
          <ComposedComponent
            {...otherProps}
            AuthUserInfo={AuthUserInfo || AuthUserInfoFromSession}
          />
        )}
      </AuthUserInfoContext.Consumer>
    );
  };

  WithAuthUserInfoComp.getInitialProps = async (ctx: NextPageContext) => {
    // Same as withAuthUser: ensure auth-gated pages are never CDN-cached.
    try {
      ctx.res?.setHeader?.("Cache-Control", "private, no-store");
    } catch {}
    const AuthUserInfo = get(ctx, "myCustomData.AuthUserInfo", null);

    // Evaluate the composed component's getInitialProps().
    let composedInitialProps = {};
    if (ComposedComponent.getInitialProps) {
      composedInitialProps = await ComposedComponent.getInitialProps(ctx);
    }

    return {
      ...composedInitialProps,
      AuthUserInfo
    };
  };

  WithAuthUserInfoComp.displayName = `WithAuthUserInfo(${ComposedComponent.displayName})`;

  return WithAuthUserInfoComp;
};

export default withAuthUserInfo;
