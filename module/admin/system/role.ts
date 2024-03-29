import { get, router, youngService } from "@youngjs/core";
import { In } from "typeorm";
import AdminRoleEntity from "../../../entity/admin/role";
/**
 * 角色管理
 */
@router("/admin/system/role", [
  "info",
  "page",
  "list",
  "add",
  "update",
  "delete",
])
export default class AdminRole extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminRoleEntity;
    this.searchOption.keywords = ["rolename"];
  }
  /**
   * 新增角色
   * @returns
   */
  async add() {
    const { menuIds = [] } = this.body;
    await this.app.orm.AdminRoleEntity.insert(this.body);
    if (menuIds.length) {
      menuIds.forEach((mid) => {
        this.app.orm.AdminRoleMenuEntity.insert({
          roleId: this.body.id,
          menuId: mid,
        });
      });
    }
    return this.success(this.body);
  }
  /**
   * 修改角色
   * @returns
   */
  async update() {
    const { menuIds = [] } = this.body;
    delete this.body.menuId;
    await this.app.orm.AdminRoleEntity.update(
      { id: this.body.id },
      { rolename: this.body.rolename }
    );
    if (menuIds.length) {
      //先查出所有旧的
      const old: any = await this.app.orm.AdminRoleMenuEntity.find({
        roleId: this.body.id,
      });
      menuIds.forEach(async (mid) => {
        let repeat = false;
        old.forEach((o) => {
          if (o.menuId == mid) {
            repeat = true;
            o.repeat = true;
          }
        });
        //新的则插入
        if (repeat === false) {
          this.app.orm.AdminRoleMenuEntity.insert({
            roleId: this.body.id,
            menuId: mid,
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
        this.app.orm.AdminRoleMenuEntity.delete({ id: In(deleteArray) });
    }
    await this.app.redis.del(`adminMenu:${this.ctx.adminUser.id}`);
    return this.success();
  }
  /**
   * 删除
   * @returns
   */
  async delete() {
    await super.delete();
    this.app.orm.AdminRoleMenuEntity.delete({
      roleId: In(this.body.ids.toString().split(",")),
    });
    return this.success();
  }

  /**
   * 获取角色菜单
   * @returns
   */
  @get("/getRoleMenu")
  async getRoleMenu() {
    const { roleId } = this.query;
    const data = await this.app.orm.AdminRoleMenuEntity.find({ roleId });
    return this.success(
      data.map((d) => {
        return d.menuId;
      })
    );
  }
}
