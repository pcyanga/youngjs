import { Base } from "@youngjs/core";
import { Entity, Column } from "typeorm";
@Entity({ name: "admin_user" })
export default class AdminUserEntity extends Base {
  @Column({ comment: "用户名", length: 30 })
  username: String;

  @Column({ comment: "昵称", length: 30 })
  nickname: String;

  @Column({ comment: "密码", length: 50 })
  password: String;

  @Column({ comment: "状态", default: true })
  status: Boolean;

  @Column({ comment: "ip", length: 100, default: "" })
  ip: String;

  @Column({ comment: "ip所在地", length: 100, default: "" })
  ipAddr: String;
}
