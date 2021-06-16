module.exports = {
  apps : [{
    name: process.env.npm_package_name,
    script: "bin/www",
    watch: false,
    ignore_watch: [
      ".git",
      ".vscode",
      "node_modules",
      "_dist",
      "_src",
      "public",
      "static",
    ],
    //注释以下两行以关闭集群模式
    // instances: 0,
    // exec_mode: "cluster",
    env: {
      "NODE_ENV": "development",
    },
    env_staging: {
      "NODE_ENV": "production",
    },
    env_production: {
      "NODE_ENV": "production",
      "HOST": "127.0.0.1",  //设置主机/端口, 比package.json中的优先级更高
      "PORT": "",
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "E:\\pm2_log5\\"+process.env.npm_package_name+"\\err.log",
    out_file: "E:\\pm2_log5\\"+process.env.npm_package_name+"\\out.log",
    merge_logs: true,
  }]
}