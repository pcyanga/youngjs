import { Base } from "@youngjs/core";
import { Entity, Column } from "typeorm";
@Entity({ name: "admin_menu" })
export default class AdminMenuEntity extends Base {
  @Column({ comment: "菜单名称", length: 30 })
  name: String;

  @Column({ comment: "路径", length: 100 })
  key: String;

  @Column({ comment: "类型 1菜单 2权限", length: 100 })
  type: String;

  @Column({ comment: "上级", default: 0 })
  pid: Number;

  @Column({ comment: "排序", default: 0 })
  sort: Number;

  @Column({ comment: "图标", length: 100, default: "" })
  icon: string;

  @Column({ comment: "权限组", type: "longtext", nullable: true })
  actions: string;
}
