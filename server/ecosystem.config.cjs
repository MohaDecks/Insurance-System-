/** PM2: run from repo with `pm2 start server/ecosystem.config.cjs` */
module.exports = {
  apps: [
    {
      name: "insurance-api",
      cwd: __dirname,
      script: "src/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
