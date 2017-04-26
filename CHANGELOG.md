## [HEAD](https://github.com/mjrussell/redux-auth-wrapper/compare/v1.1.0...master)

## [1.1.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v1.0.0...v1.1.0)
- **Feature:** Support hash fragments in building the redirect location [#121](https://github.com/mjrussell/redux-auth-wrapper/issues/121)
- **Feature:** Upgrade to proptypes package after React 15.5 deprecation [#147](https://github.com/mjrussell/redux-auth-wrapper/pull/147) (Contributed by @jruhland)

## [1.0.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.10.0...v1.0.0)
- **Bugfix:** Redirection preserves query params in the redirect path. [#111](https://github.com/mjrussell/redux-auth-wrapper/pull/111)

## [0.10.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.9.0...v0.10.0)
- **Feature:** `allowRedirectBack` can also take a selector function that returns a bool instead of a bool. [#93](https://github.com/mjrussell/redux-auth-wrapper/pull/93) (Contributed by @oyeanuj)

## [0.9.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.8.0...v0.9.0)
- **Bugfix:** Don't pass down auth wrapper props besides authData [#81](https://github.com/mjrussell/redux-auth-wrapper/issues/81)
- **Feature:** Add propMapper function to restrict passed through props [#28](https://github.com/mjrussell/redux-auth-wrapper/issues/28)
- **Bugfix/Breaking Change:** onEnter now checks isAuthenticating for redirection [#89](https://github.com/mjrussell/redux-auth-wrapper/issues/89)
- **Feature:** onEnter selectors receive nextState as the second argument instead of null [#90](https://github.com/mjrussell/redux-auth-wrapper/issues/90)

## [0.8.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.7.0...v0.8.0)
- **Feature:** FailureComponent to not redirect and either hide or show a different component on auth failure [#61](https://github.com/mjrussell/redux-auth-wrapper/pull/61). (Contributed by @mehiel)
- **Feature:** Pass auth data as props to Loading Component [#75](https://github.com/mjrussell/redux-auth-wrapper/issues/75)
- **Breaking Change:** When rendering an "empty" component such as the default LoadingComponent and when the user is about
to be redirect, return `null` so React will omit it instead of an empty `div`.
- **Breaking Change:** Don't need to import React Native compatible from lib.

## [0.7.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.6.0...v0.7.0)
- **Bugfix:** Don't render subroutes as children in default LoadingComponent [#63](https://github.com/mjrussell/redux-auth-wrapper/pull/63)
- **Bugfix/Breaking Change:** Change default LoadingComponent to a `div` and use the React native default empty element [#63](https://github.com/mjrussell/redux-auth-wrapper/pull/63)

## [0.6.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.5.2...v0.6.0)
- **Feature:** `failureRedirectPath` can be a function of state and props [#57](https://github.com/mjrussell/redux-auth-wrapper/pull/57)
- **Feature:** option to change the query param name with `redirectQueryParamName` [#57](https://github.com/mjrussell/redux-auth-wrapper/pull/57)

## [0.5.2](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.5.1...v0.5.2)
- **BugFix:** Fixes bug introduced in v0.5.1 that prevented redirection when only isAuthenticating changed [#49](https://github.com/mjrussell/redux-auth-wrapper/issues/49)

## [0.5.1](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.5.0...v0.5.1)
- **BugFix:** Adds safeguard to prevent infinite redirects from the wrapper [#45](https://github.com/mjrussell/redux-auth-wrapper/pull/45)

## [0.5](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.4.0...v0.5.0)
- **Feature:** Adds `isAuthenticating` selector and `LoadingComponent`
[#35](https://github.com/mjrussell/redux-auth-wrapper/pull/35). (Contributed by @cab)

## [0.4](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.3.0...v0.4.0)
- **Feature:** Adds React Native support [#33](https://github.com/mjrussell/redux-auth-wrapper/pull/33)

## [0.3](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.2.1...v0.3.0)
- **Feature:** Adds `ownProps` param to `authSelector` [#21](https://github.com/mjrussell/redux-auth-wrapper/pull/21)
- **Feature:** Adds `onEnter` function for Server Side Rendering support [#19](https://github.com/mjrussell/redux-auth-wrapper/pull/19)
- **Breaking:** Removes arg style syntax that was deprecated in 0.2

## [0.2.1](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.2.0...v0.2.1)
- router context is only required if no redirectAction

## [0.2.0](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.1.1...v0.2.0)
- **Feature:** new redirectAction config arg, removes dependency on a redux-routing implementation [#13](https://github.com/mjrussell/redux-auth-wrapper/issues/13)
- **Feature:** New config object syntax for AuthWrapper [#12](https://github.com/mjrussell/redux-auth-wrapper/issues/12)
- **Deprecation:** Deprecates AuthWrapper args syntax [#12](https://github.com/mjrussell/redux-auth-wrapper/issues/12)
- **Feature:** Hoists wrapped component's statics up to the returned component

## [0.1.1](https://github.com/mjrussell/redux-auth-wrapper/compare/v0.1.0...v0.1.1)
- Fixes the bad npm publish

## [0.1.0](https://github.com/mjrussell/redux-auth-wrapper/compare/fcbf49d0abcae7075daa146c05edff1b735b3a16...v0.1.0)
- First release!
- Adds AuthWrapper with args syntax
- Examples using Redux-Simple-Router (now React-Router-Redux)
- Lots of tests
