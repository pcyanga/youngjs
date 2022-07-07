import { router, youngService } from "@youngjs/core";
import ApiUserEntity from "../../../entity/api/user";
//业务-用户
@router("/admin/business/user", [
  "info",
  "page",
  "list",
  "add",
  "update",
  "delete",
])
export default class AdminBusinessUser extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = ApiUserEntity;
    this.searchOption.keywords = ["username"];
  }
}
