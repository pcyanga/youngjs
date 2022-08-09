import * as path from "path";
module.exports = {
  typeorm: {
    type: "mysql",
    host: "127.0.0.1",
    port: 3306,
    username: "young",
    password: "FwKHrkejdxyrCrn6",
    database: "young",
    synchronize: false,
    logging: false,
    filePath: path.join(__dirname, "../entity"),
    charset: "utf8mb4",
  },
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
  doc: {
    routePrefix: "api-doc",
    title: "Youngjs接口文档",
    version: "1.0.0",
    host: "https://admin.youngjs.top/api",
  },
};
