import url from 'url'
import { stringify, parse } from 'query-string'

const defaults = {
  redirectQueryParamName: 'redirect',
  locationSelector: ({ location }) => location
}

export default (args) => {
  const { redirectQueryParamName, locationSelector } = {
    ...defaults,
    ...args
  }

  const getRedirect = (props) => {
    const location = locationSelector(props)
    const query = parse(location.search)
    return query[redirectQueryParamName]
  }

  const createRedirect = allowRedirectBack => (props, redirectPath) => {
    const location = locationSelector(props)
    const redirectLoc = url.parse(redirectPath, true)

    let query
    const canRedirect = typeof allowRedirectBack === 'function' ? allowRedirectBack(location, redirectPath) : allowRedirectBack

    if (canRedirect) {
      query = { [redirectQueryParamName]: `${location.pathname}${location.search}${location.hash}` }
    } else {
      query = {}
    }

    query = {
      ...query,
      ...redirectLoc.query
    }

    return {
      pathname: redirectLoc.pathname,
      hash: redirectLoc.hash,
      search: stringify(query)
    }
  }

  return {
    getRedirect,
    createRedirect
  }
}
