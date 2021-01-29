const MonacoEditorPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  configureWebpack: {
    plugins: [new MonacoEditorPlugin({
      languages: ["json"]
    })]
  },
  productionSourceMap: false,
  publicPath: "/admin/",
  transpileDependencies: ["vuetify"],
}