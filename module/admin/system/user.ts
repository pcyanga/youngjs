import { router, post, youngService, get } from "@youngjs/core";
import { In } from "typeorm";
import * as _ from "lodash";
import AdminUserEntity from "../../../entity/admin/user";
/**
 * 后台用户
 */
@router("/admin/system/user", ["info", "add", "update", "delete", "page"])
export default class AdminUser extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminUserEntity;
    this.searchOption.keywords = ["username", "nickname"];
    this.searchOption.fieldEq = ["id"];
  }

  /**
   * 登录
   * @param username string 用户名 require
   * @param password string 密码 require
   * @returns
   */
  @post("/login")
  async login() {
    const user = await this.app.orm.AdminUserEntity.findOne({
      username: this.body.username,
    });
    if (!user) throw new Error("账号不存在");
    const pwd = this.app.comm.helper.decrypt(
      user.password,
      this.app.config.passwordStr || "young"
    );
    //验证密码
    if (pwd != this.body.password) throw new Error("账号或者密码错误");
    //判断状态
    if (!user.status) throw new Error("用户被禁止登陆");
    const token = await this.ctx.makeUserToken({
      id: user.id,
      nickname: user.nickname,
    });
    this.saveIp(user.id);
    return this.success(token);
  }
  /**
   * 用户详情
   * @returns data 用户信息
   */
  async info() {
    const userId = this.query.id;
    const user: any = await this.app.orm.AdminUserEntity.findOne({
      id: userId,
    });
    if (!user) throw new Error("用户不存在");
    delete user.password;
    user.roleIds = (
      await this.app.orm.AdminUserRoleEntity.find({ userId })
    ).map((r) => {
      return r.roleId;
    });
    return this.success(user);
  }
  /**
   * 获取用户菜单
   * @param user 用户信息
   * @returns
   */
  async getUserMenu(user) {
    const key = `adminMenu:${user.id}`;
    const exist = await this.app.redis.get(key);
    if (exist) {
      user.menu = JSON.parse(exist);
      return;
    }
    const menu = await this.sql(
      `select a.id,a.name,a.pid,a.type,a.key,a.icon from admin_menu a
      left join admin_role_menu b on a.id = b.menuId 
      where b.roleId in (?) 
      group by a.id
      order by sort desc`,
      [user.roleIds]
    );
    user.menu = this.app.service.AdminMenu.arrange(_.cloneDeep(menu));
    this.app.redis.set(key, JSON.stringify(user.menu));
    return user;
  }

  /**
   * 获取用户所有能访问的路径权限
   * @param user
   */
  async getUserRouters(user) {
    const key = `adminRouter:${user.id}`;
    const exist = await this.app.redis.get(key);
    if (exist) {
      user.aciotnsList = JSON.parse(exist);
      return;
    }
    const aciotns = await this.sql(
      `select actions from admin_menu a
      left join admin_role_menu b on a.id = b.menuId 
      where b.roleId in (?)`,
      [user.roleIds]
    );
    const aciotnsList = [];
    aciotns.forEach((a) => {
      if (a.actions) {
        const l = a.actions.split(";");
        aciotnsList.push(...l);
      }
    });
    this.app.redis.set(key, JSON.stringify(aciotnsList));
    user.aciotnsList = aciotnsList;
  }

  async getUserRoutersById(userId) {
    const key = `adminRouter:${userId}`;
    const exist = await this.app.redis.get(key);
    if (exist) {
      return JSON.parse(exist);
    }
    const user: any = await this.app.orm.AdminUserEntity.findOne({
      id: userId,
    });
    if (!user) throw new Error("用户不存在");
    user.roleIds = (
      await this.app.orm.AdminUserRoleEntity.find({ userId })
    ).map((r) => {
      return r.roleId;
    });
    await this.getUserRouters(user);
    return user.aciotnsList;
  }
  /**
   * 添加用户
   * @param user object 用户信息
   * @returns
   */
  async add() {
    this.body.password = this.app.comm.helper.encrypt(
      this.body.password,
      this.app.config.passwordStr || "young"
    );
    const exists = await this.app.orm.AdminUserEntity.findOne({
      username: this.body.username,
    });
    if (exists) throw new Error("用户名已存在");
    await this.app.orm.AdminUserEntity.insert(this.body);
    //操作角色
    if (this.body.roleIds && this.body.roleIds.length) {
      this.body.roleIds.forEach((roleId) => {
        this.app.orm.AdminUserRoleEntity.insert({
          userId: this.body.id,
          roleId,
        });
      });
    }
    return this.success();
  }
  /**
   * 更新
   * @returns
   */
  async update() {
    const { roleIds = [] } = this.body;
    if (!this.body.id) this.body.id = this.ctx.adminUser.id;
    delete this.body.roleIds;
    if (this.body.password) {
      this.body.password = this.app.comm.helper.encrypt(
        this.body.password,
        this.app.config.passwordStr || "young"
      );
    } else {
      delete this.body.password;
    }
    await this.app.orm.AdminUserEntity.update({ id: this.body.id }, this.body);
    //操作角色
    if (roleIds.length > 0) {
      //先查出所有旧的
      const old: any = await this.app.orm.AdminUserRoleEntity.find({
        userId: this.body.id,
      });
      //新的插入
      roleIds.forEach((roleId) => {
        let repeat = false;
        old.forEach((o) => {
          if (o.roleId == roleId) {
            repeat = true;
            o.repeat = true;
          }
        });
        if (repeat === false) {
          this.app.orm.AdminUserRoleEntity.insert({
            userId: this.body.id,
            roleId,
          });
        }
      });
      //挑选出旧的删除
      const deleteArray = old
        .filter((o) => {
          return o.repeat != true;
        })
        .map((o) => {
          return o.id;
        });
      if (deleteArray.length)
        this.app.orm.AdminUserRoleEntity.delete({ id: In(deleteArray) });
    }
    return this.success();
  }
  /**
   * 删除
   * @returns
   */
  async delete() {
    super.delete();
    this.app.orm.AdminUserRoleEntity.delete({
      userId: In(this.body.ids.toString().split(",")),
    });
    return this.success();
  }

  /**
   * 当前用户详情
   * @returns
   */
  @get("/userInfo")
  async userInfo() {
    const userId = this.ctx.adminUser.id;
    const user: any = await this.app.orm.AdminUserEntity.findOne({
      id: userId,
    });
    if (!user) throw new Error("用户不存在");
    delete user.password;
    user.roleIds = (
      await this.app.orm.AdminUserRoleEntity.find({ userId })
    ).map((r) => {
      return r.roleId;
    });
    await this.getUserMenu(user);
    await this.getUserRouters(user);
    return this.success(user);
  }

  async saveIp(userId) {
    const ipAddr = await this.app.comm.helper.getIpAddr(this.ctx);
    if (ipAddr.ip) {
      this.app.orm.AdminUserEntity.update(
        { id: userId },
        { ip: ipAddr.ip, ipAddr: ipAddr.addr }
      );
    }
  }
}
