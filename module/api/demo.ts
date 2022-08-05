import { get, router, youngService } from "@youngjs/core";
import { ApiCategory } from "@youngjs/swagger-doc";
import ApiTestEntity from "../../entity/test";
@ApiCategory("示例")
@router("/demo", ["info", "page", "add", "delete", "update", "list"])
export default class Demo extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = ApiTestEntity;
    this.searchOption.fieldEq = ["id"];
  }

  //自由组装sql分页实例
  async page() {
    this.sqlPageObject.sql = `select b.*,a.roleId from admin_role_menu a
    left join admin_menu b on a.menuId = b.id  where 1 = 1 `;
    //模糊匹配，从参数获取，也可以自己传 params
    this.sqlJoin("keywords", "name like ? or actions like ? or `key` = ?");
    // this.sqlJoin("keywords", "name like ? or actions like ? or `key` = ?", [
    //   `%${this.body.keywords}%`,
    //   `%${this.body.keywords}%`,
    //   `%${this.body.keywords}%`,
    // ]);
    //全等
    // this.sqlJoin("roleId", "=");
    //大小，从post参数获取id
    // this.sqlJoin("b.id", ">=");
    //拼装聚合或者其他语句
    // this.sqlPageObject.sql += "group by a.menuId";
    // this.sqlPageObject.sql += " having a.menuId >= ?";
    // this.sqlPageObject.params.push(1);
    return this.sqlPage();
  }

  //路由设置参数
  @get("test/:id")
  async test() {
    return this.success(this.query);
  }

  //队列插入及消费
  @get("queue")
  async queue() {
    this.app.queue.test.add({ time: new Date().getTime() });
  }

  async consumeQueue(data) {
    console.log("消费队列", data);
    await this.app.comm.helper.sleep(100);
    return;
  }
}
