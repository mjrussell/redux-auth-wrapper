import locationHelperBuilder from '../history4/locationHelper'
import redirectUtil from '../helper/redirect'

const { createRedirectLoc } = locationHelperBuilder({})

export const { connectedRouterRedirect, connectedReduxRedirect } = redirectUtil({
  createRedirectLoc,
  getRouterRedirect: ({ history }) => history.replace
})
