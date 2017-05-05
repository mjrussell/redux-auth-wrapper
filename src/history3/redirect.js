import locationHelperBuilder from '../history3/locationHelper'
import redirectUtil from '../helper/redirect'

export const { connectedRouterRedirect, connectedReduxRedirect } = redirectUtil({
  locationHelperBuilder,
  getRouterRedirect: ({ router }) => router.replace
})
