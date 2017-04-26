import locationHelperBuilder from '../history3/locationHelper'
import redirectUtil from '../helper/redirect'

const { createRedirectLoc } = locationHelperBuilder({})

export const { connectedRouterRedirect, connectedReduxRedirect } = redirectUtil({
  createRedirectLoc
})
