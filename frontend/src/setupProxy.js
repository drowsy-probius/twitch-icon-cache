const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    '/v1',
    createProxyMiddleware({
      target: "http://localhost:32189",
      changeOrigin: false,
      ws: false,
      pathRewrite: {
        "^/v1": "",
      },
    })
  );
};