const path = require('path');

const shared = {
  mode: 'development',
  devtool: false,
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
    ],
  },
};

module.exports = [
  {
    ...shared,
    entry: './src/index.js',
    output: {
      filename: 'blockide_bundle.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'BlockIDE',
      libraryTarget: 'window',
    },
  },
  {
    ...shared,
    entry: './src/ui/react_islands.tsx',
    output: {
      filename: 'ui_islands.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },
];
