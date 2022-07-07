import { Base } from "@youngjs/core";
import { Entity, Column, Index } from "typeorm";
@Entity({ name: "admin_param" })
export default class AdminSystemParamEntity extends Base {
  @Column({ length: 50, comment: "参数名" })
  @Index()
  key: String;

  @Column({ type: "longtext", comment: "参数值" })
  value: string;

  @Column({ length: 50, comment: "备注" })
  remark: String;
}
