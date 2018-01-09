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

  const getRedirectQueryParam = (props) => {
    const location = locationSelector(props)
    const query = parse(location.search)
    return query[redirectQueryParamName]
  }

  const createRedirectLoc = allowRedirectBack => (props, redirectPath) => {
    const location = locationSelector(props)
    const redirectLoc = url.parse(redirectPath, true)

    let query

    if (allowRedirectBack) {
      const regex = new RegExp(`${redirectQueryParamName}=(.+)`);
      const result = regex.exec(location.search)

      if (result === null) {
        query = { [redirectQueryParamName]: `${location.pathname}${location.search}${location.hash}` }
      } else {
        query = { [redirectQueryParamName]: `${decodeURIComponent(result[1])}${location.hash}` }
      }
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
    getRedirectQueryParam,
    createRedirectLoc
  }
}
