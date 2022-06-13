import { router, youngService } from "@youngjs/core";
import { ApiCategory } from "@youngjs/swagger-doc";
import AdminTaskLogEntity from "../../entity/admin/task_log";
@ApiCategory("任务日志")
@router("/admin/task_log", ["info", "page", "list", "delete"])
export default class AdminTaskLog extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminTaskLogEntity;
  }
}
