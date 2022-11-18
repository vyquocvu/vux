import { get } from "lodash";
import { NextPageContext } from "next";

import { AuthInterface } from 'interfaces/User';
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
