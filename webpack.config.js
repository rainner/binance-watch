/**
 * Webpack client-side config file
 */
const path = require( 'path' );
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const isProd = ( process.env.NODE_ENV === 'production' );

// dev server and globals styles
const serverHost = 'localhost';
const serverPort = 8000;
const serverRoot = path.join( __dirname, '/' );
const appEntry   = './src/app.js';
const bundleDir  = './public/bundles/';
const globalSass = './src/scss/globals.scss';

// get loader config based on env
const getLoaders = ( prod ) => {
  let loaders  = [ 'vue-style-loader', 'css-loader', 'postcss-loader', 'sass-loader' ];
  let fallback = prod ? loaders.shift() : '';
  let use      = loaders.join( '!' ) +'?data=@import "'+ globalSass +'";'
  return prod
    ? { scss: ExtractTextPlugin.extract( { use, fallback } ) }
    : { scss: use };
}

 // webpack config
module.exports = {

  entry: {
    app: appEntry,
  },

  output: {
    path: serverRoot,
    filename: path.join( bundleDir, '[name].min.js' ),
  },

  stats: {
    colors: true,
  },

  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|svg|map|css|eot|woff|woff2|ttf)$/,
        loader: 'ignore-loader',
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: { loaders: getLoaders( isProd ) }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ]
  },

  plugins: [
    new ExtractTextPlugin( path.join( bundleDir, '[name].min.css' ) )
  ],

  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  },

  devServer: {
    host: serverHost,
    port: serverPort,
    contentBase: serverRoot,
    clientLogLevel: 'info',
    hot: true,
    inline: true,
    quiet: false,
    noInfo: false,
    compress: false,
  },

  performance: {
    hints: false
  }
}

if ( isProd ) {
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
