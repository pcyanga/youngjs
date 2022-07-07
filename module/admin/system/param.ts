import { router, youngService } from "@youngjs/core";
import AdminSystemParamEntity from "../../../entity/admin/param";
//测试
@router("/admin/system/param", [
  "info",
  "page",
  "list",
  "add",
  "update",
  "delete",
])
export default class AdminSystemParam extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminSystemParamEntity;
  }
}
