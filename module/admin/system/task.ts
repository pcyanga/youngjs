import { get, router, youngService } from "@youngjs/core";
import * as moment from "moment";
import AdminTaskEntity from "../../../entity/admin/task";
import * as _ from "lodash";
/**
 * 任务管理
 */
@router("/admin/system/task", [
  "info",
  "page",
  "list",
  "add",
  "update",
  "delete",
])
export default class Task extends youngService {
  constructor(ctx) {
    super(ctx);
    this.entity = AdminTaskEntity;
    this.searchOption.keywords = ["name"];
  }
  //任务初始化
  async init() {
    //做一个判断
    if (!this.app.config.typeorm) {
      this.app.log.warn("config typeorm undefined,task uninitialized!");
      return;
    }
    const tasks: any = await this.app.orm.AdminTaskEntity.find({ status: 1 });
    const old = await this.app.task.getRepeatableJobs();
    for (const t of tasks) {
      //已存在的不处理
      const find = _.find(old, { id: t.id });
      if (find) {
        this.app.log.info(`task [${t.name}] exits!`, true);
        continue;
      }
      const config = this.getRepeatConfig(t);
      await this.app.task.add(t, {
        jobId: t.id,
        repeat: config,
        removeOnComplete: true,
        removeOnFail: true,
      });
      this.app.log.info(`task [${t.name}] init successfully!`, true);
    }
  }
  getRepeatConfig(task) {
    let params: any = { name: `young-${task.id}` };
    if (task.limit) params.limit = Number(task.limit);
    if (task.startDate) params.startDate = task.startDate;
    if (task.endDate) params.endDate = task.endDate;
    if (task.type == 1) {
      params.every = Number(task.every);
    } else {
      params.cron = task.cron;
    }
    return params;
  }
  //任务执行
  async execute(job, done) {
    this.executeForAsync(job);
    if (this.app.config.typeorm) {
      this.updateNextTime(job.data.id);
    }
    done();
  }
  //异步执行
  async executeForAsync(job) {
    let result;
    let status;
    try {
      if (job.data.service) {
        const tmp = job.data.service.split(".");
        const method = tmp[1].split("(")[0];
        const paramString = tmp[1].split("(")[1].split(")")[0];
        const params = paramString ? JSON.parse(paramString) : "";
        result = await this.app.service[tmp[0]][method](params);
        status = 1;
      }
    } catch (err) {
      result = err.stack;
      status = 0;
      this.app.log.error("task running error:" + err.stack);
    }
    this.app.orm.AdminTaskLogEntity.save({
      taskId: job.data.id,
      status,
      result: result
        ? typeof result == "object"
          ? JSON.stringify(result)
          : result
        : "",
    });
  }

  //添加
  async add() {
    await this.app.orm.AdminTaskEntity.save(this.body);
    const config = this.getRepeatConfig(this.body);
    if (this.body.status) {
      await this.app.task.add(this.body, {
        jobId: this.body.id,
        repeat: config,
        removeOnComplete: true,
        removeOnFail: true,
      });
    }
    this.updateNextTime(this.body.id);
    return this.success();
  }

  //更新
  async update() {
    await this.app.orm.AdminTaskEntity.update({ id: this.body.id }, this.body);
    const jobs = await this.app.task.getRepeatableJobs();
    jobs.forEach((j) => {
      if (j.id == this.body.id) {
        this.app.task.removeRepeatableByKey(j.key);
      }
    });
    if (this.body.status) {
      const config = this.getRepeatConfig(this.body);
      await this.app.task.add(this.body, {
        jobId: this.body.id,
        repeat: config,
        removeOnComplete: true,
        removeOnFail: true,
      });
      this.updateNextTime(this.body.id);
    }
    return this.success();
  }

  //删除
  async delete() {
    const jobs = await this.app.task.getRepeatableJobs();
    jobs.forEach((j) => {
      this.body.ids
        .toString()
        .split(",")
        .forEach((id) => {
          if (j.id == id) {
            this.app.task.removeRepeatableByKey(j.key);
          }
        });
    });
    await super.delete();
    return this.success();
  }

  //立即执行
  @get("/doNow")
  async doNow() {
    const info = await this.app.orm.AdminTaskEntity.findOne({
      id: this.query.id,
    });
    if (!info) throw new Error("任务不存在");
    await this.app.task.add(info, {
      removeOnComplete: true,
      removeOnFail: true,
    });
    return this.success();
  }

  //更新下次执行时间
  async updateNextTime(id) {
    const jobs = await this.app.task.getRepeatableJobs();
    jobs.forEach((j) => {
      if (j.id == id) {
        this.app.orm.AdminTaskEntity.update(
          { id },
          { nextRunTime: moment(j.next).format("YYYY-MM-DD HH:mm:ss") }
        );
      }
    });
  }
}
