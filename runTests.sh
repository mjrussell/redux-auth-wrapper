#!/bin/bash

rm -rf node_modules/react-router*
rm -rf node_modules/history

if [ "$REACT_ROUTER_VERSION" = "3" ]; then
  npm install react-router@3.0.2
  npm install react-router-redux@4.0.8
  npm run test:cov -- test/rrv3-test.js
elif [ "$REACT_ROUTER_VERSION" = "4" ]; then
  npm install react-router@4.0.0
  npm install history@4.6.1
  npm install react-router-redux@5.0.0-alpha.6
  npm run test:cov -- test/rrv4-test.js
fi
