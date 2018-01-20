[![Build Status](https://travis-ci.org/asfktz/autodll-webpack-plugin.svg?branch=master)](https://travis-ci.org/asfktz/autodll-webpack-plugin) [![Build Status](https://img.shields.io/npm/dm/autodll-webpack-plugin.svg)](https://www.npmjs.com/package/autodll-webpack-plugin)


# AutoDllPlugin
Webpack's DllPlugin without the boilerplate

`npm install --save-dev autodll-webpack-plugin`

---

## Table of contents

- [Introduction](#introduction)
- [Options](#options)
- [FAQ](#faq)
- [Examples](#running-examples)


## Introduction

Webpack's own DllPlugin it great, it can drastically reduce the amount of time needed to build (and rebuild) your bundles by reducing the amount of work needs to be done.

If you think about it, most of the code in your bundles come from NPM modules that you're rarely going to touch. You know that, but Webpack doesn't. So every time it compiles it has to analyze and build them too - and that takes time.

The DllPlugin allows you to to create a separate bundle in advance for all of those modules, and teach Webpack to reference them to that bundle instead.

That leads to a dramatic reduction in the amount of time takes Webpack to build your bundles.

For example, these are the measurements for the  [performance test](https://github.com/asfktz/autodll-webpack-plugin/tree/master/examples/performance) that you can find in the [examples](https://github.com/asfktz/autodll-webpack-plugin/tree/master/examples) folder:

|                   |  **Without DllPlugin**  | **With DllPlugin** |
|-------------------|-------------------|-----------------------|
| **Build Time** | 16461ms - 17310ms | 2991ms - 3505ms |
| **DevServer Rebuild** | 2924ms - 2997ms | 316ms - 369ms |



### The DllPlugin sounds great! So why AutoDllPlugin?

While the DllPlugin has many advantages, it's main drawback is that it requires a lot of boilerplate.

AutoDllPlugin serves as a high-level plugin for both the DllPlugin and the DllReferencePlugin, and hides away most of their complexity.

When you build your bundle for the first time, the AutoDllPlugin Compiles the DLL for you, and references all the specified modules from your bundle to the DLL.

The next time you compile your code, AutoDllPlugin will skip the build and read from the cache instead.

AutoDllPlugin will rebuild your DLLs every time you change the Plugin's configuration, install or remove a node module.

When using Webpack's Dev Server, the bundle are loaded into the memory preventing unnecessary reads from the FileSystem.

With the way the DLLPlugin works, you must load the DLL bundles before your own bundle. This is commonly accomplished by adding an additional script tag to the HTML.

Because that is such a common task, AutoDllPlugin can do this for you (in conjunction with the HtmlPlugin ).

```js
plugins: [
  new HtmlWebpackPlugin({
    inject: true,
    template: './src/index.html',
  }),
  new AutoDllPlugin({
    inject: true, // will inject the DLL bundles to index.html
    filename: '[name]_[hash].js',
    entry: {
      vendor: [
        'react',
        'react-dom',
        'moment'
      ]
    }
  })
]
```

Will Result in:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
</head>
<body>

  ...

  <script src="dist/vendor.dll.js"></script>
  <script src="dist/main.bundle.js"></script>
</body>
</html>
```


### Basic Usage ([example](https://github.com/asfktz/autodll-webpack-plugin/tree/master/examples/basic)):


```js
const webpack = require('webpack');
const path = require('path');
const AutoDllPlugin = require('autodll-webpack-plugin');

module.exports = {
  entry: {
    app: './src/index.js'
  },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
    publicPath: '/'
  },

  plugins: [
    new AutoDllPlugin({
      filename: '[name].dll.js',
      entry: {
        vendor: [
          'react',
          'react-dom',
          'moment'
        ]
      }
    })
  ]
};
```

### Recommended Usage ([example](https://github.com/asfktz/autodll-webpack-plugin/tree/master/examples/recommended)):

While it's not required, using AutoDllPlugin together with [HtmlWebpackPlugin](https://github.com/jantimon/html-webpack-plugin) is highly recommended, because its saves you the trouble of manually adding the DLL bundles to the HTML by yourself.

Use AutoDllPlugin's `inject` option to enable this feature.

```js
const webpack = require('webpack');
const path = require('path');
const AutoDllPlugin = require('autodll-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },

  plugins: [
    new HtmlWebpackPlugin({
      inject: true, // will inject the main bundle to index.html
      template: './src/index.html',
    }),
    new AutoDllPlugin({
      inject: true, // will inject the DLL bundle to index.html
      debug: true,
      filename: '[name]_[hash].js',
      path: './dll',
      entry: {
        vendor: [
          'react',
          'react-dom',
          'moment'
        ]
      }
    })
  ]
};
```

## Options

<table>
    <thead>
        <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>entry</td>
            <td>Object</td>
            <td>{}</td>
            <td>
              <p>
                The entry points for the DLL's. <br>
                Think of it as the entry option in your webpack config. <br>
                Each entry point represents a DLL bundle and expects an array of modules.
              </p>
<pre>entry: {
    // Create a DLL from NPM modules:
    vendor: [
      'react',
      'react-dom',
      'moment',
      'lodash'
    ],
    // Create a DLL from a part of your app
    // that you rarely change:
    admin: [
        './src/admin/index.js'
    ]
}</pre>
            </td>
        </tr>
        <tr>
            <td>filename</td>
            <td>String</td>
            <td>"[name].js"</td>
            <td>
              <p>The filename template. <br> Same as webpack's
                <a href="https://webpack.js.org/configuration/output/#output-filename">output.filename</a>.
              </p>
              <p>Examples:</p>
              <ul>
                <li>[name]_[hash].dll.js</li>
                <li>[id].bundle.js</li>
              </ul>
            </td>
        </tr>
        <tr>
            <td>context</td>
            <td>String</td>
            <td><p>process.cwd()</p></td>
            <td>
              <p>
                The base directory, an <strong>absolute path</strong>, for resolving entry points and loaders from the configuration.
              </p>
              <p>
                Same as webpack's <a href="https://webpack.js.org/configuration/entry-context/#context">context</a>
              </p>
              <p>
                <b>It is very important to make sure the context is set correctly</b>, <br>
                otherwise, you'll end up with having the same modules both in the DLL bundles and in your main bundles!
              </p>
              <p>Most of the time, the defaults (the current directory) should work for you, here's how it should work:</p>
              <p>If your webpack config is stored at the base of your project:</p>
              <p><i>~/my-project/webpack.config.js</i></p>
              <p>Set it up like this:</p>
<pre>
{
  context: __dirname
}
</pre>

<p>If your webpack config is stored in a nested directory:</p>
<p><i>~/my-project/<b>config</b>/webpack.config.js</i></p>
<p>It should look like this:</p>
<pre>
{
  context: path.join(__dirname, '..')
}
</pre>
          </td>
        </tr>
        <tr>
            <td>inject</td>
            <td>Boolean</td>
            <td>false</td>
            <td>
              <p>By setting inject to true, AutoDLL will inject the DLL bundles into the HTML for you.</p>
              <p>
                <b>Note:</b> <a href="https://github.com/jantimon/html-webpack-plugin">HtmlWebpackPlugin</a>
                is required for this feature to work.
              </p>
            </td>
        </tr>
        <tr>
            <td>path</td>
            <td>String</td>
            <td>""</td>
            <td>
                The path for the DLL bundles, relative to webpack's
                <a href="https://webpack.js.org/configuration/output/#output-publicpath">output.publicPath</a>
            </td>
        </tr>
        <tr>
            <td>debug</td>
            <td>Boolean</td>
            <td>false</td>
            <td>Use debug mode to see more clearly what AutoDLL is doing.</td>
        </tr>
        <tr>
            <td>plugins</td>
            <td>Array</td>
            <td>[]</td>
            <td>
              <p>
                Plugins for the DLL compiler. Same as webpack's
                <a href="https://webpack.js.org/configuration/plugins/">plugins</a>.
              </p>
              <pre>plugins: [
  new webpack.optimize.UglifyJsPlugin()
]</pre>
            </td>
        </tr>
    </tbody>
</table>

## FAQ

### I added my dependencies to the DLL, and now, when I make a change to one of them I don't see it! Why?

When you run webpack for the first time,  AutoDLL builds the DLL bundles and stores them in the cache for next time.

That leads to faster builds and rebuilds (using webpack's dev server).

There are two conditions for triggering a new build on the next run:
1. Running `npm install / remove / update package-name` (or Yarn equivalent).
2. Changing the plugin's configurations.

For performance considerations,  AutoDLL is not aware of any changes made to module's files themselves.

So as long as you intend to work on a module, just exclude it from the DLL.

For example, let's say you configured the plugin like so:

```js
new AutoDllPlugin({
  entry: {
    vendor: [
      'react',
      'react-dom',
      'moment'
    ]
  }
})
```

And then, while working on your project, you encountered some weird behavior with `moment` and decided to put a `console.log` statement in one of its files to see how it behaves.

As explained above, AutoDLL is not going to invalidate its cache in this case, and you might get surprised that you don't see the changes.

To fix that, all you have to do is comment out `moment` from the DLL, and uncomment it when you're done.

```js
new AutoDllPlugin({
  entry: {
    vendor: [
      'react',
      'react-dom'
     // 'moment'
    ]
  }
})
```


### The modules I added to the DLL are duplicated! They included both in the DLL bundle AND the main bundle.

That is most likely caused by using an incorrect context.

AutoDLL will try its best to set the context for you, but as with [webpack's own context](https://webpack.js.org/configuration/entry-context/#context) property, sometimes it is better to do it manually.

The context property should be an absolute path, pointing the base of your project.

For example, let's consider a project structured like so:

```
my-project
├── node_modules
│   └── react
│   └── react-dom
├── src
│   └── index.js
│   └── module.js
├── webpack.config.js
└── package.json
```

Then, inside `webpack.config.js`, You'll setup the context like so:

```js
__dirname;   // '/Users/username/my-project'

...

new AutoDllPlugin({
  context: __dirname,
  entry: {
    vendor: [
      'react',
      'react-dom'
    ]
  }
})
```

Note that the `__dirname` variable is [node's way](https://nodejs.org/docs/latest/api/globals.html#globals_dirname) to get the absolute path of the current module's directly, which is exactly what we need because webpack.config.js stored in the base of our project.

On the other hand, let's say your project is structured like so:

```
my-project
├── node_modules
│   └── react
│   └── react-dom
├── src
│   └── index.js
│   └── module.js
├── config
│   └── webpack.config.js
└── package.json
```

Notice that now our config is no longer stored at the base of our project, but in a subdirectory of its own. <br>
That means that now we have to subtract the relative path to our config file from `__dirname`.

We can use [node's path module](https://nodejs.org/docs/latest/api/path.html) to help us with that:

```js
var path = require('path');

__dirname;                   // '/Users/username/my-project/config'
path.join(__dirname, '..');  // '/Users/username/my-project'

...

new AutoDllPlugin({
  context: path.join(__dirname, '..'),
  entry: {
    vendor: [
      'react',
      'react-dom'
    ]
  }
})
```

If you still encounter an issue with the context set up correctly, please open an issue. I'll be happy to help you.

## Running Examples

1. `git clone git@github.com:asfktz/autodll-webpack-plugin.git`
2. `cd autodll-webpack-plugin`
3. `npm install`
4. `cd examples/recommended`
5. `npm install`
6. `npm start` or `npm run build`
