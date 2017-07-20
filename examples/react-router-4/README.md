redux-auth-wrapper react router 4 example
=================================

This is an example of redux-auth-wrapper that uses `authenticatingSelector` with `LoadingComponent`
to show a loading screen while the user logs in. This example also demonstrates how to use the UserAuthWrapper for
wrapping the Login Component in an HOC.

This example uses React-Router 4.x

**To run, follow these steps:**

1. Go to the root of this project (up two folders) and run `npm install && npm run build`
2. In this folder, run `npm install`
3. In this folder, `npm start`
4. `Browse to http://localhost:8080`

Login as any user to access the protected page `protected`.
Login with the admin box check to access the admin section.
Logout from any protected page to get redirect back to the login page.
