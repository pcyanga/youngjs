import { Base } from "@youngjs/core";
import { Entity, Column } from "typeorm";
@Entity({ name: "api_user" })
export default class ApiUserEntity extends Base {
  @Column({ comment: "用户名", length: 30 })
  username: String;

  @Column({ comment: "昵称", length: 30, default: "" })
  nickname: String;

  @Column({ comment: "头像", length: 255, default: "" })
  avatar: String;

  @Column({ comment: "状态", default: true })
  status: Boolean;
}
