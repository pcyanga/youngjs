import { youngService } from "@youngjs/core";
import * as fs from "fs";
import moment = require("moment");
//日志文件自动保存为每天1份
export default class AdminLog extends youngService {
  async logDay() {
    if (this.app.env != "prod") return;
    const yesterday = moment().add(-1, "day").format("YYYY-MM-DD");
    const fileDir = this.app.rootDir + "../logs/";
    const oldErrLog = fileDir + "err.log";
    const newErrLog = fileDir + `err-${yesterday}.log`;
    const oldLogLog = fileDir + "out.log";
    const newLogLog = fileDir + `out-${yesterday}.log`;
    if (fs.existsSync(oldErrLog)) {
      //复制文件
      fs.copyFileSync(oldErrLog, newErrLog);
      //将旧文件清空
      fs.writeFile(oldErrLog, "", function () {});
    }
    if (fs.existsSync(oldLogLog)) {
      //复制文件
      fs.copyFileSync(oldLogLog, newLogLog);
      //将旧文件清空
      fs.writeFile(oldLogLog, "", function () {});
    }
  }
}
