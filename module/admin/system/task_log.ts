import { router, youngService } from "@youngjs/core";
import AdminTaskLogEntity from "../../../entity/admin/task_log";
/**
 * 任务日志
 */
@router("/admin/system/task_log", ["info", "page", "list", "delete"])
export default class AdminTaskLog extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminTaskLogEntity;
    this.searchOption.fieldEq = ["taskId"];
  }
}
