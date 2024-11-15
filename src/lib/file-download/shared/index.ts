/*
 * This code can be used in both renderer and main process.
 */

import { v4 as uuidv4 } from "uuid";

class Options {
  /**
  The unique id for each download, can use this uuid to cancel download.
  每次下载的唯一标识，可以使用该UUID取消下载。
  */
  uuid: string = uuidv4();

  /**
  The file url.
  文件URL。

  */
  url: string = "";

  /**
  The path to save the file in.
  保存文件的路径。
  The downloader will automatically create directories.
  下载器将自动创建目录。
  */
  savePath: string = "";

  /**
  Specify file size to avoid missing a "Content-Length" in the response header.
  指定文件大小以避免在响应头中缺少“Content-Length”。
  This value only used in progress callback.
  该值仅在进度回调中使用。
  */
  fileSize: number = 0;

  /**
  Whether send download pogress to renderer process or not.
  是否将下载进度发送到渲染进程。
  If set true, will send 'file-download-progress-feedback' to renderer.
  如果设置为true，将发送'file-download-progress-feedback'到渲染进程。
  */
  feedbackProgressToRenderer: boolean = false;

  /**
  The MD5 value of target file.
  目标文件的MD5值。
  */
  md5: string = "";

  /**
  Whether skip download when target file exist.
  当目标文件存在时是否跳过下载。
  */
  skipWhenFileExist: boolean = false;

  /**
  Whether skip download when target file exist and the md5 is same.
  当目标文件存在且MD5相同时是否跳过下载。
  */
  skipWhenMd5Same: boolean = false;

  /**
  Whether verify target file md5 after download finished.
  下载完成后是否验证目标文件MD5。
  */
  verifyMd5: boolean = false;
}

class CancelError extends Error {}

interface Result {
  uuid: string;
  success: boolean;
  canceled: boolean;
  error: string;
  fileSize: number;
}

interface ProgressCallback {
  (uuid: string, bytesDone: number, bytesTotal: number): void;
}

export { CancelError, Options, type Result, type ProgressCallback };
