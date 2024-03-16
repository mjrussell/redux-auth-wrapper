import * as url from 'url'
import queryString from 'query-string'

const defaults = {
  redirectQueryParamName: 'redirect',
  locationSelector: ({ location }) => location
}

export default (args) => {
  const { redirectQueryParamName, locationSelector } = {
    ...defaults,
    ...args
  }

  const getRedirectQueryParam = (props) => {
    const location = locationSelector(props)
    const query = queryString.parse(location.search)
    return query[redirectQueryParamName]
  }

  const createRedirectLoc = allowRedirectBack => (props, redirectPath) => {
    const location = locationSelector(props)
    const redirectLoc = url.parse(redirectPath, true)

    let query

    if (allowRedirectBack) {
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
      search: queryString.stringify(query)
    }
  }

  return {
    getRedirectQueryParam,
    createRedirectLoc
  }
}
