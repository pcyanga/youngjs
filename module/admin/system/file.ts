import { post, router, youngService } from "@youngjs/core";
import moment = require("moment");
import path = require("path");
import * as fs from "fs";
import { ApiCategory, ApiDoc } from "@youngjs/swagger-doc";
import * as OSS from "ali-oss";
import { randomUUID } from "crypto";

//测试
@router("/admin/file", [])
@router("/api/file", [])
@ApiCategory("文件")
export default class File extends youngService {
  @ApiDoc("上传", { file: { type: "file", name: "文件" } })
  @post("/upload")
  async upload() {
    const files = this.ctx.request.files.file;
    if (!files.name) throw new Error("请选择文件");
    const newName = randomUUID() + "." + files.name.split(".")[1];
    const config = this.app.config.upload || {
      type: "local",
      host: "/api",
    };
    if (!this[config.type]) throw new Error(`方法【${config.type}】不存在`);
    const res = await this[config.type](files, newName);
    return this.success(res);
  }

  //本地上传
  async local(files, name) {
    try {
      const today = moment().format("YYYY-MM-DD");
      const fileBasePath =
        path.join(__dirname, "/../../../public/upload/") + today;
      if (!fs.existsSync(fileBasePath))
        await fs.mkdirSync(fileBasePath, { recursive: true });
      const reader = fs.createReadStream(files.path);
      const filePath = fileBasePath + "/" + name;
      const upStream = fs.createWriteStream(filePath);
      const host = this.app.config.upload.host;
      const fileUrl = host + "/public/upload/" + today + "/" + name;
      reader.pipe(upStream);
      return fileUrl;
    } catch (err) {
      throw new Error(err);
    }
  }

  //阿里云上传
  async aliyun(files, name) {
    if (!this.app.config.upload.aliyun)
      throw new Error("阿里云上传文件配置不完整");
    try {
      const client = new OSS(this.app.config.upload.aliyun);
      const filePath = "/app/" + name;
      const res = await client.put(filePath, files.path);
      return res.url;
    } catch (err) {
      throw new Error(err);
    }
  }
}
