#!/bin/bash

rm -rf node_modules/react-router*
rm -rf node_modules/history

if [ "$REACT_ROUTER_VERSION" = "3" ]; then
  yarn add react-router@3.2.5
  yarn add react-router-redux@4.0.8
  yarn run test:cov test/rrv3-test.js
elif [ "$REACT_ROUTER_VERSION" = "4" ]; then
  yarn add react-router@5.1.2
  yarn add history@4.7.2
  yarn add connected-react-router@6.6.1
  yarn run test:cov test/rrv4-test.js
fi
