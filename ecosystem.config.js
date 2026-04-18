require("dotenv").config();

module.exports = {
  apps: [
    {
      name: "self-growth",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3030",
      cwd: __dirname,
      env: process.env,
    },
  ],
};
