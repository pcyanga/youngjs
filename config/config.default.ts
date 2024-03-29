module.exports = {
  port: 3001, //项目启动端口
  middleware: ["requestCheck", "exception"], //启用的中间件
  passwordStr: "young963456", //加密字符串
  //swagger 文档配置
  doc: {
    routePrefix: "api-doc",
    title: "Youngjs接口文档",
    version: "1.0.0",
  },
  //上传文件配置
  upload: {
    type: "local",
    host: "",
    // type: "aliyun",
    // aliyun: {
    //   region: "",
    //   accessKeyId: "",
    //   accessKeySecret: "",
    //   bucket: "",
    // },
  },
  // socket: true,
};
