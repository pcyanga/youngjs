import { youngQueue } from "@youngjs/core";
export default class test extends youngQueue {
  async execute(job, done) {
    await this.app.service.Demo.consumeQueue(job.data);
    done();
  }
}
