import path from 'path'
import fs from 'fs'
import HtmlWebpackPlugin from 'html-webpack-plugin'

module.exports = {
  entry: './app.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devServer: {
    inline: true,
    historyApiFallback: true,
    stats: {
      colors: true,
      hash: false,
      version: false,
      chunks: false,
      children: false
    }
  },
  module: {
    rules: [ {
      test: /\.js$/,
      loaders: [ 'babel-loader' ],
      exclude: /node_modules/,
      include: __dirname
    } ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html', // Load a custom template
      inject: 'body' // Inject all scripts into the body
    })
  ]
}

// This will make the redux-auth-wrapper module resolve to the
// latest src instead of using it from npm. Remove this if running
// outside of the source.
const lib = path.join(__dirname, '..', '..', 'lib')
if (fs.existsSync(lib)) {
  // Use the latest src
  module.exports.resolve = { alias: { 'redux-auth-wrapper': lib } }
  // module.exports.module.loaders.push({
  //   test: /\.js$/,
  //   loaders: [ 'babel' ],
  //   include: lib
  // })
} else {
  throw "redux-auth-wrapper source not built. Run the following: 'pushd ../.. && rm -rf node_modules && yarn install && yarn run build && popd' and then rerun 'yarn start'"
}
