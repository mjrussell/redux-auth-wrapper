redux-auth-wrapper loading example
=================================

This is a more advanced example of redux-auth-wrapper that uses `authenticatingSelector` with `LoadingComponent`
to show a loading screen while the user logs in. This example also demonstrates how to use the UserAuthWrapper for
wrapping the Login Component in an HOC.

This example uses React-Router 2.x and React-Router-Redux 4.x.

**To run, follow these steps:**

1. Install dependencies with `npm install` in this directory (make sure it creates a local node_modules)
2. By default, it uses the local version from `src` of redux-auth-wrapper, so you need to run `npm install` from there first.
3. `npm start`
4. `Browse to http://localhost:8080`

Login as any user to access the protected page `foo`.
Login with the admin box check to access the admin section.
Logout from any protected page to get redirect back to the login page.
