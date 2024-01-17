import locationHelperBuilder from '../history4/locationHelper'
import redirectUtil from '../helper/redirect'

export const { connectedRouterRedirect, connectedReduxRedirect } = redirectUtil({
  locationHelperBuilder,
  getRouterRedirect: (props) => props.replace
})
