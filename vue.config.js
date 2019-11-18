const MonacoEditorPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  configureWebpack: {
    plugins: [new MonacoEditorPlugin({
      languages: ["json"]
    })]
  },
  productionSourceMap: true,
  publicPath: "/admin/",
  transpileDependencies: ["vuetify"],
}