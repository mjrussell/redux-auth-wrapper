redux-auth-wrapper localstorage example
=================================

This is an example that demonstrates using localStorage with
redux-auth-wrapper in order to persist login state.

This is for example purposes only, a real production application
should validate the token and use a token retrieved from a server.

This example uses React-Router 2.x and React-Router-Redux 4.x.

**To run, follow these steps:**

1. Install dependencies with `npm install` in this directory (make sure it creates a local node_modules)
2. By default, it uses the local version from `src` of redux-auth-wrapper, so you need to run `npm install` from there first.
3. `npm start`
4. `Browse to http://localhost:8080`

Login as any user to access the protected page `foo`.
Try refreshing the page and see that you're still logged in.
Logout from any protected page to get redirect back to the login page.
