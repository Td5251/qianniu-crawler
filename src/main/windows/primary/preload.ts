import { contextBridge, ipcRenderer } from "electron";

/*
暴露primary窗口主进程的方法到primary窗口的渲染进程
*/
contextBridge.exposeInMainWorld("primaryWindowAPI", {
  sendMessage: (message: string) => ipcRenderer.send("message", message),
  openExternalLink: (url: string) =>
    ipcRenderer.send("open-external-link", url),
  clearAppConfiguration: () => ipcRenderer.send("clear-app-configuration"),

  asyncExitApp: () => ipcRenderer.invoke("async-exit-app"),
  minToTray: () => ipcRenderer.send("min-to-tray"),
  httpGetRequest: (url: string) => ipcRenderer.send("http-get-request", url),
  showPrimary: () => ipcRenderer.send("login-success"),
  toLogin: () => ipcRenderer.send("to-login"),
  openRouter: (path: string) => ipcRenderer.send("open-router", path),
  setWin: (type: string) => ipcRenderer.send("set-win", type),
  exportExcel: (data: any) => ipcRenderer.send("export-excel", data),

  removeFileList: (data: any) => ipcRenderer.send("remove-file-list", data),
  //获取文件下载存储地址
  getDesktopPath: (fileName: any) =>
    ipcRenderer.send("get-desktop-path", fileName),
  //更新成功
  updateSuccess: () => ipcRenderer.send("update-success"),

  //清空更新文件
  clearUpdateFile: () => ipcRenderer.send("clear-update-file"),
  //获取更新缓存
  getUpdateCache: () => ipcRenderer.send("get-update-cache"),

  //打开登录界面
  showLoginPage: (param: any) => ipcRenderer.send("show-login-page", param),

  //店铺登录
  shopsLogin: (param: any) => ipcRenderer.send("shops-login", param),

  //获取登录信息
  getLoginInfo: () => ipcRenderer.send("get-login-info"),

  //获取店铺信息
  getShopsInfo: (param: any, flag: any, type: any) => {
    if (type) {
      ipcRenderer.send("get-shops-info-2", param, flag)
    } else {
      ipcRenderer.send("get-shops-info-1", param, flag)
    }
  },
  //获取监控信息
  getMonitorInfo: (param: any, flag: any) => ipcRenderer.send("get-monitor-info", param, flag),

  //获取统计数据
  getStatisticsData: (param: any, flag: any) => ipcRenderer.send("get-statistics-data", param, flag),

  //发送所有店铺信息
  sendAllShopsInfo: (param: any) => ipcRenderer.send("send-all-shops-info", param),

  //获取配置
  getConfig: () => ipcRenderer.send("get-config"),

  //设置配置
  setConfig: (param: any) => ipcRenderer.send("set-config", param),

  onShowExitAppMsgbox: (callback) =>
    ipcRenderer.on("show-exit-app-msgbox", () => {
      callback();
    }),
  onShowClosePrimaryWinMsgbox: (callback) =>
    ipcRenderer.on("show-close-primary-win-msgbox", () => {
      callback();
    }),
  //渲染进程监听主进程的事件
  onShowSuccessMsgbox: (callback) =>
    ipcRenderer.on("show-success-msgbox", (event, message) => {
      callback(message);
    }),
  onShowErrorMsgbox: (callback) =>
    ipcRenderer.on("show-error-msgbox", (event, message) => {
      callback(message);
    }),

  //渲染进程接收主进程传递的值
  onGetPrimaryValue: (callback) =>
    ipcRenderer.on("get-primary-value", (event, value) => {
      callback(value);
    }),

  //将登录信息发送到渲染进程
  onGetLoginInfo: (callback) =>
    ipcRenderer.on("get-login-info", (event, value) => {
      callback(value);
    }),

  //将店铺信息发送到渲染进程
  onGetShopsInfo: (callback) =>
    ipcRenderer.on("get-shops-info", (event, value) => {
      callback(value);
    }),

  //将配置传递给渲染进程
  onGetConfig: (callback) =>
    ipcRenderer.on("get-config", (event, value) => {
      callback(value);
    }),
});
