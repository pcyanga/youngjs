import { get, router, youngService } from "@youngjs/core";
import { ApiCategory } from "@youngjs/swagger-doc";
import AdminMenuEntity from "../../../entity/admin/menu";
@router("/admin/system/menu", ["info", "list", "add", "update", "delete"])
@ApiCategory("菜单管理")
export default class AdminMenu extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminMenuEntity;
  }
  async list() {
    const menu = await this.sql(
      "select *,name as label from admin_menu order by sort desc"
    );
    return this.success(this.arrange(menu));
  }

  async delete() {
    await super.delete();
    await this.app.redis.del(`adminMenu:${this.ctx.adminUser.id}`);
    await this.app.redis.del(`adminRouter:${this.ctx.adminUser.id}`);
    return this.success();
  }

  async update() {
    await super.update();
    await this.app.redis.del(`adminMenu:${this.ctx.adminUser.id}`);
    await this.app.redis.del(`adminRouter:${this.ctx.adminUser.id}`);
    return this.success();
  }

  /**
   * 整理菜单层级
   * @param m 当下菜单
   * @param menu 所有菜单
   * @returns
   */
  arrange(menu) {
    //找出根菜单
    const menuRoot = menu.filter((m) => {
      return m.pid == 0;
    });
    //递归遍历
    function get(m) {
      m.children = [];
      menu.forEach((me) => {
        if (me.pid == m.id) {
          me = get(me);
          m.children.push(me);
        }
      });
      return m;
    }
    if (menuRoot.length) {
      menuRoot.forEach((mr) => {
        mr = get(mr);
      });
    }
    return menuRoot;
  }

  //获取所有路由
  @get("/getRouters")
  async getRouters() {
    const routers = this.app["router"];
    const list = [];
    for (const r of routers) {
      if (r.path.startsWith("/admin")) {
        const path = r.path.replace("/admin/", "");
        if (path == "") continue;
        const pathList = path.split("/");
        let find = false;
        for (const l of list) {
          if (l.value == pathList[0]) {
            find = true;
            if (pathList.length == 2) {
              l.children.push({
                value: pathList[1] + ":" + r.method,
                label: pathList[1],
                children: [],
              });
            } else {
              let findc = false;
              for (const lc of l.children) {
                if (lc.value == pathList[1]) {
                  if (pathList.length == 3) {
                    findc = true;
                    lc.children.push({
                      value: pathList[2] + ":" + r.method,
                      label: pathList[2],
                    });
                  }
                }
              }
              if (findc == false) {
                l.children.push({
                  value: pathList[1],
                  label: pathList[1],
                  children: [
                    {
                      value: pathList[2] + ":" + r.method,
                      label: pathList[2],
                    },
                  ],
                });
              }
            }
          }
        }
        if (find == false) {
          let tmp = {
            value: pathList[0],
            label: pathList[0],
            children: [],
          };
          if (pathList.length == 2) {
            tmp.children.push({
              value: pathList[1],
              label: pathList[1],
              children: [],
            });
          }
          if (pathList.length == 3) {
            tmp.children.push({
              value: pathList[1],
              label: pathList[1],
              children: [
                {
                  value: pathList[2] + ":" + r.method,
                  label: pathList[2],
                },
              ],
            });
          }
          list.push(tmp);
        }
      }
    }
    return this.success(list);
  }
}
