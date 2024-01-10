import { useEffect } from 'react'
import PropTypes from 'prop-types'

const Redirect = (props) => {
  useEffect(() => {
    if (!!props.redirect && !!props.redirectPath) {
      props.redirect(props, props.redirectPath);
    }
  }, [props.redirect, props.redirectPath])

  return null
}

Redirect.propTypes = {
  redirectPath: PropTypes.string.isRequired,
  redirect: PropTypes.func.isRequired
};

export default Redirect;