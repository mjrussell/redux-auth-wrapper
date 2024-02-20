import locationHelperBuilder from '../history4/locationHelper.js'
import redirectUtil from '../helper/redirect.js'

export const { connectedRouterRedirect, connectedReduxRedirect } = redirectUtil({
  locationHelperBuilder,
  getRouterRedirect: (props) => props.replace
})
