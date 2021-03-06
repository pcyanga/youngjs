import * as jwt from "jsonwebtoken";
import * as _ from "lodash";
import * as uuid from "uuid";

module.exports = async (ctx: any, next: () => void) => {
  //配置文件
  const config = {
    secret: "young963456", //token加密串
    expires: 3600 * 24 * 7, //token有效时长
    ignoreUrl: ["admin/system/user/login"], //忽略检测的路由数组
    checkUrlPrefix: ["admin"], //需要检测的路由前缀
    checkRepeatUrl: ["api/test", "api-doc"],
  };
  //生成唯一token
  ctx.createUuidToken = function () {
    const uid = uuid.v1();
    const key = `token_uuid:${uid}`;
    ctx.app.redis.set(key, uid);
    ctx.app.redis.expire(key, 60 * 5);
    return uid;
  };
  //检测唯一token
  const checkUuidToken = async function (token) {
    const key = `token_uuid:${token}`;
    const exists = await ctx.app.redis.get(key);
    if (exists) ctx.app.redis.del(key);
    return exists;
  };
  //生成用户token
  ctx.makeUserToken = function (user) {
    const expiresIn = config.expires || 3600 * 24 * 7;
    const secret = config.secret || "young";
    const token = jwt.sign(user, secret, { expiresIn });
    return { token, expiresIn };
  };

  const url = ctx.request.url.split("?")[0].replace("/", "");
  for (let i in config.checkUrlPrefix) {
    const prefix = config.checkUrlPrefix[i];
    if (url.indexOf(prefix) == 0) {
      //防止重复请求
      if (config.checkRepeatUrl.indexOf(url) >= 0) {
        const token = ctx.request.headers.token || "";
        if ((await checkUuidToken(token)) == null) {
          ctx.body = "token valid";
          ctx.status = 403;
          return;
        }
      }
      //检测用户token并解析
      if (config.ignoreUrl.indexOf(url) < 0) {
        const authorization = ctx.request.headers.authorization || "";
        //验证token
        if (!authorization) {
          ctx.body = "Forbidden";
          ctx.status = 403;
          return;
        }
        const secret = config.secret || "young";
        try {
          ctx[prefix + "User"] = jwt.verify(authorization, secret);
          //判断权限
          let rights = await ctx.app.service.AdminUser.getUserRoutersById(
            ctx.adminUser.id
          );
          const action =
            url.replace("admin/", "") + ":" + ctx.method.toLowerCase();
          const find = rights.filter((r) => {
            return r == action;
          });
          if (find.length == 0) {
            ctx.status = 401;
            ctx.body = {
              code: 401,
              message: "没有权限",
            };
            return;
          }
        } catch (err) {
          console.log(err);
          ctx.status = 403;
          ctx.body = "Forbidden";
          return;
        }
      }
    }
  }

  await next();
};
