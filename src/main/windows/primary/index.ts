import path from "path";
import { app, dialog, ipcMain, netLog } from "electron";
import appState from "../../app-state";
import WindowBase from "../window-base";
const fs = require("fs");
// const puppeteer = require("puppeteer");
const puppeteer = require('puppeteer-core');
const log = require('electron-log');
log.transports.file.file = 'app.log';
log.transports.console.level = 'info';
let systemConfig: any = {
  isShowBrowser: false,
  maxOpenBrowserNumber: 15,
  defaultChromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
}
let accountLoginInfoMap = new Map();

const qs = require('qs');

//显示打开浏览器
// let loginBrowser;

//发送请求
const axios = require('axios');

//运维数据api 参数
let operationDataApiParam = ""

//店铺数据api 参数
let shopDataApiParam = ""

//万象台数据api 参数
let wanXiangTaiDataApiParam = ""

//其他指标数据api 参数
let otherDataApiParam = ""

//商品数据api 参数
let goodsDataApiParam = ""

//保证金数据api 
let depositDataApiParam = ""

//聚合余额数据api 
let aggregateBalanceDataApiParam = ""

//店铺等级数据api 
let shopLevelDataApiParam = ""

//统计数据api 
let statisticsDataApiParam = ""


let allShopsInfo = [];


let globalBrowser;


class SafeQueue<T> {
  private items: T[] = [];
  private lock: boolean = false;
  private currentTask: T | null = null;
  private taskCount: number = 0; // 当前正在执行的任务数量

  /**
   * 入队操作
   * @param element - 要添加到队列中的元素
   * @returns Promise<void>
   */
  async enqueue(element: T): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          this.items.push(element);
          this.lock = false; // 解锁队列
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 出队操作
   * @returns Promise<T> - 返回队列头部的元素
   * @throws 如果队列为空
   */
  async dequeue(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          if (this.items.length === 0) {
            this.lock = false;
            reject(new Error("Queue is empty"));
          } else {
            const item = this.items.shift()!;
            this.lock = false; // 解锁队列
            resolve(item);
          }
        }
      };
      operation();
    });
  }

  /**
   * 检查队列是否为空
   * @returns boolean - 队列是否为空
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * 获取队列大小
   * @returns number - 队列中元素的数量
   */
  size(): number {
    return this.items.length;
  }

  /**
   * 打印队列内容
   */
  print(): void {
    console.log(this.items);
  }

  /**
   * 清空队列
   */
  async clear(): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          this.items = [];
          this.lock = false; // 解锁队列
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 获取当前正在执行的任务
   * @returns Promise<T | null> - 当前任务，或者 null 如果没有任务
   */
  async getCurrentTask(): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          const task = this.currentTask;
          this.lock = false; // 解锁队列
          resolve(task);
        }
      };
      operation();
    });
  }

  /**
   * 设置当前正在执行的任务
   * @param task - 要设置的任务
   * @returns Promise<void>
   */
  async setCurrentTask(task: T | null): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          this.currentTask = task;
          this.lock = false; // 解锁队列
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 增加当前任务数量
   * @returns Promise<void>
   */
  async incrementTaskCount(): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          this.taskCount++;
          this.lock = false; // 解锁队列
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 减少当前任务数量
   * @returns Promise<void>
   */
  async decrementTaskCount(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果队列被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定队列
          if (this.taskCount > 0) {
            this.taskCount--;
            this.lock = false; // 解锁队列
            resolve();
          } else {
            this.lock = false;
            // reject(new Error("Task count is already 0"));
          }
        }
      };
      operation();
    });
  }

  /**
   * 获取当前任务数量
   * @returns number - 当前任务数量
   */
  getTaskCount(): number {
    return this.taskCount;
  }
}

class SafeMap<K, V> {
  private map: Map<K, V> = new Map();
  private lock: boolean = false;

  /**
   * 设置键值对
   * @param key - 键
   * @param value - 值
   * @returns Promise<void>
   */
  async set(key: K, value: V): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          this.map.set(key, value);
          this.lock = false; // 解锁Map
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 获取键对应的值
   * @param key - 键
   * @returns Promise<V | undefined> - 值，如果键不存在则返回undefined
   */
  async get(key: K): Promise<V | undefined> {
    return new Promise<V | undefined>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          const value = this.map.get(key);
          this.lock = false; // 解锁Map
          resolve(value);
        }
      };
      operation();
    });
  }

  /**
   * 删除键
   * @param key - 键
   * @returns Promise<boolean> - 如果键存在并被删除返回true，否则返回false
   */
  async delete(key: K): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          const result = this.map.delete(key);
          this.lock = false; // 解锁Map
          resolve(result);
        }
      };
      operation();
    });
  }

  /**
   * 检查键是否存在
   * @param key - 键
   * @returns Promise<boolean> - 如果键存在返回true，否则返回false
   */
  async has(key: K): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          const exists = this.map.has(key);
          this.lock = false; // 解锁Map
          resolve(exists);
        }
      };
      operation();
    });
  }

  /**
   * 清空Map
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          this.map.clear();
          this.lock = false; // 解锁Map
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 获取Map的大小
   * @returns Promise<number> - Map中键值对的数量
   */
  async size(): Promise<number> {
    return new Promise<number>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          const size = this.map.size;
          this.lock = false; // 解锁Map
          resolve(size);
        }
      };
      operation();
    });
  }

  /**
   * 获取所有键值对
   * @returns Promise<[K, V][]> - 键值对数组
   */
  async entries(): Promise<[K, V][]> {
    return new Promise<[K, V][]>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果Map被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定Map
          const entries = Array.from(this.map.entries());
          this.lock = false; // 解锁Map
          resolve(entries);
        }
      };
      operation();
    });
  }
}

class SafeCounter {
  private count: number = 0;
  private lock: boolean = false;

  /**
   * 增加计数器值
   * @param value - 增加的值，默认为1
   * @returns Promise<void>
   */
  async increment(value: number = 1): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果计数器被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定计数器
          this.count += value;
          this.lock = false; // 解锁计数器
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 减少计数器值
   * @param value - 减少的值，默认为1
   * @returns Promise<void>
   */
  async decrement(value: number = 1): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果计数器被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定计数器
          this.count -= value;
          this.lock = false; // 解锁计数器
          resolve();
        }
      };
      operation();
    });
  }

  /**
   * 获取当前计数器值
   * @returns Promise<number>
   */
  async getValue(): Promise<number> {
    return new Promise<number>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果计数器被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定计数器
          const value = this.count;
          this.lock = false; // 解锁计数器
          resolve(value);
        }
      };
      operation();
    });
  }

  /**
   * 重置计数器值
   * @param value - 重置为的值，默认为0
   * @returns Promise<void>
   */
  async reset(value: number = 0): Promise<void> {
    return new Promise<void>((resolve) => {
      const operation = () => {
        if (this.lock) {
          setTimeout(operation, 10); // 如果计数器被锁定，延迟尝试
        } else {
          this.lock = true; // 锁定计数器
          this.count = value;
          this.lock = false; // 解锁计数器
          resolve();
        }
      };
      operation();
    });
  }
}




let shopsInfoMap = new SafeMap<string, any>();
let monitoringMap = new SafeMap<string, any>();
let statisticsMap = new SafeMap<string, any>();
let retrievingFlagMap = new SafeMap<string, any>();
let monitoringretrievingFlagMap = new SafeMap<string, any>();
let statisticsretrievingFlagMap = new SafeMap<string, any>();
let currentOpenBrowserNumber = new SafeCounter();




const queue = new SafeQueue<any>();

class PrimaryWindow extends WindowBase {
  constructor() {
    // 调用WindowBase构造函数创建窗口
    super({
      width: 1200,
      height: 800,
      frame: false, //关闭原生导航栏
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false, //禁用 webSecurity 以允许 file:// 协议访问
      },
    });

    // 拦截close事件
    this._browserWindow?.on("close", (e) => {

      // if (!appState.allowExitApp) {
      //   this._browserWindow?.webContents.send("show-close-primary-win-msgbox");
      //   e.preventDefault();
      // }

      // 退出程序时，清理资源
      appState.uninitialize();
    });

    this.browserWindow?.maximize();
    this.openRouter("/login");
    // this.openRouter("/primary");

    try {

      //拿到appdata目录下qianniu-crawler-config.json
      let configPath = path.join(app.getPath("appData"), "qianniu-crawler-config.json");

      //如果不存在就创建一个
      if (!fs.existsSync(configPath)) {
        let defaultConfig = {
          isShowBrowser: false,
          maxOpenBrowserNumber: 5,
          defaultChromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          flag: true
        }

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      }


      //读取配置文件
      systemConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      if (!systemConfig.defaultChromePath) {
        systemConfig.defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      }

      if (systemConfig.maxOpenBrowserNumber > 5) {
        systemConfig.maxOpenBrowserNumber = 5;
      }

      log.info("系统配置：", systemConfig);
    } catch (e) {
    }

    // try {
    //   puppeteer.launch({
    //     headless: !systemConfig.isShowBrowser,
    //     args: [
    //       '--no-sandbox',
    //       '--disable-setuid-sandbox',
    //       '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
    //     ],
    //     executablePath: systemConfig.defaultChromePath
    //   }).then((browser: any) => {
    //     globalBrowser = browser;
    //   });

    // } catch (e) {
    // }

    try {
      let browserWindow = this.browserWindow;
      setInterval(() => {
        initSign(browserWindow)
      }, 1000);
    } catch (e) {

    }

    try {
      //获取appdata目录下qianniu-crawler-config.json
      let configPath = path.join(app.getPath("appData"), "qianniu-crawler-config.json");

      //如果没有flag属性
      if (!systemConfig.flag) {
        //删除qianniu-crawler-cookie目录下的所有文件
        let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");
        if (fs.existsSync(cookieDir)) {
          let files = fs.readdirSync(cookieDir);
          files.forEach((file: any) => {
            let filePath = path.join(cookieDir, file);
            fs.unlinkSync(filePath);
          });
        }

        //设置flag为true
        systemConfig.flag = true;

        //将配置写入文件
        fs.writeFileSync(configPath, JSON.stringify(systemConfig, null, 2));
      }
    } catch (e) {
    }

  }



  protected registerIpcMainHandler(): void {
    ipcMain.on("message", (event, message) => {
      if (!this.isIpcMainEventBelongMe(event)) return;

    });

    ipcMain.on("login-success", (event) => {
      this.openRouter("/primary");
    });

    ipcMain.on("to-login", (event) => {
      this.openRouter("/login");
    });

    ipcMain.on("open-router", (event, path) => {
      this.openRouter(path);
    });

    ipcMain.on("clear-app-configuration", (event) => {
      appState.cfgStore?.clear();
    });

    function delay(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    ipcMain.on("min-to-tray", (event) => {
      if (!this.isIpcMainEventBelongMe(event)) return;

      this.browserWindow?.hide();

      // 托盘气泡消息只显示一次，用配置文件记录是否已经显示
      if (!appState.cfgStore?.get("TrayBalloonDisplayed", false) as boolean) {
        appState.cfgStore?.set("TrayBalloonDisplayed", true);
        if (appState.tray) {
          appState.tray.displayBalloon({
            title: "",
            content:
              "客户端已经最小化到系统托盘。\n\n该气泡消息配置为只会显示一次!",
          });
        }
      }
    });

    ipcMain.handle("async-exit-app", async (event) => {
      // 暂停1500毫秒，模拟退出程序时的清理操作
      await delay(1500);
      appState.allowExitApp = true;
      app.quit();
    });

    // ipcMain.on("http-get-request", (event, url) => {
    //   axiosInst
    //     .get(url)
    //     .then((rsp) => {
    // dialog.showMessageBox(this._browserWindow!, {
    //   message: `在主进程中请求 ${url} 成功！状态码：${rsp.status}`,
    //   type: "info",
    // });
    //     })
    //     .catch((err) => {
    //       dialog.showMessageBox(this._browserWindow!, {
    //         message: `在主进程中请求 ${url} 失败！错误消息：${err.message}`,
    //         type: "error",
    //       });
    //     });
    // });

    ipcMain.on("set-win", (event, type) => {
      if (type === "max") {
        if (this.browserWindow?.isMaximized()) {
          this.browserWindow?.unmaximize();
        } else {
          this.browserWindow?.maximize();
        }
      } else if (type === "min") {
        this.browserWindow?.minimize();
      } else if (type === "close") {
        this.browserWindow?.close();
      }
    });

    //监听获取桌面地址
    ipcMain.on("get-desktop-path", async (event, fileName) => {
      let desktopPath = app.getPath("desktop");
      let savePath = path.join(desktopPath, fileName);

      this.browserWindow?.webContents.send("get-primary-value", savePath);
    });


    //店铺登录
    ipcMain.on("shops-login", async (event, param) => {
      let paramArr = JSON.parse(param);
      for (let requestParam of paramArr) {
        try {

          let userDataDir = path.join(app.getPath("appData"), "qianniu-crawler");

          let userDataDirName = requestParam.username.replace(":", "");

          //拼接上用户名
          userDataDir = path.join(userDataDir, userDataDirName);

          let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

          // let csrfIdDir = path.join(app.getPath("appData"), "qianniu-crawler-csrfId");

          if (!fs.existsSync(cookieDir)) {
            fs.mkdirSync(cookieDir);
          }

          // if (!fs.existsSync(csrfIdDir)) {
          //   fs.mkdirSync(csrfIdDir);
          // }

          let dirName = requestParam.username.replace(":", "") + ".json";

          // let csrfIdDirName = requestParam.username.replace(":", "") + ".txt";

          //拼接上用户名
          cookieDir = path.join(cookieDir, dirName);

          // csrfIdDir = path.join(csrfIdDir, csrfIdDirName);

          if (fs.existsSync(cookieDir)) {
            console.log("cookie文件存在");


            //读取cookie文件
            let cookies = JSON.parse(fs.readFileSync(cookieDir, "utf-8"));

            let csrfId = ""

            //将cookie组合成字符串
            let cookieStr = cookies.map((item: any) => {
              return item.name + "=" + item.value;
            }).join(";");

            let isLiginApi = `https://sycm.taobao.com/cem/enterprise/info.json`

            let isLoginRes = await axios.get(isLiginApi, {
              headers: {
                cookie: cookieStr
              }
            });

            if (isLoginRes.data.code === 0) {
              //将当前登录信息发送到渲染进程
              accountLoginInfoMap.set(requestParam.username, {
                username: requestParam.username,
                cookie: cookieStr,
                status: "waitInit"
              });

              this.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);

              continue
            }
          }

          let loginBrowser = await puppeteer.launch({
            headless: false,
            args: [
              '--disable-infobars',       // 禁用信息条（包括错误提示）
              '--disable-extensions',     // 禁用扩展
              '--disable-popup-blocking', // 禁用弹窗阻止
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-blink-features=AutomationControlled',  // 禁用浏览器的自动化标识
              '--start-maximized' //全屏
            ],
            userDataDir: userDataDir,
            executablePath: systemConfig.defaultChromePath
          });

          //打开新页面
          let loginPage: any = await loginBrowser.newPage();

          // 设置用户代理（User-Agent）
          await loginPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');

          // let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://web.m.taobao.com/app/operation-center/open-shop/home-pc"
          let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://myseller.taobao.com/home.htm/QnworkbenchHome/"
          // let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://myseller.taobao.com/home.htm/bc-templates/"
          loginPage.goto(url);

          //等待加载完毕
          await loginPage.waitForNavigation();

          //拿到#fm-login-id 输入账号
          await loginPage.waitForSelector('#fm-login-id');

          await loginPage.type('#fm-login-id', requestParam.username);

          //等待1秒
          await new Promise((resolve) => setTimeout(resolve, 1000));

          //拿到#fm-login-password 输入密码
          await loginPage.waitForSelector('#fm-login-password');

          await loginPage.type('#fm-login-password', requestParam.password);

          //拿到.password-login
          await loginPage.waitForSelector('.password-login');

          //等待1秒
          await new Promise((resolve) => setTimeout(resolve, 1000));

          //点击登录
          await loginPage.click('.password-login');

          try {
            // await loginPage.waitForNavigation();
            await loginPage.waitForNavigation({ waitUntil: 'networkidle0' });
          } catch (e) {
            log.error("等待超时");
          }
          // await loginPage.waitForNavigation({ waitUntil: 'networkidle0' });

          let thit = this;

          //拿到当前地址
          let currentUrl = loginPage.url();

          log.info("当前地址---：" + currentUrl);

          if (currentUrl.includes("login.taobao.com")) {

            let timer;
            // loginPage.on('framenavigated', (frame) => {
            //   if (frame.url().includes("myseller.taobao.com/home.htm")
            //     && !frame.url().includes("redirect_url")
            //   ) {
            //     log.info("登录成功,当前地址：" + frame.url());
            //     //删除定时器
            //     if (timer) {
            //       clearTimeout(timer);
            //     }
            //     timer = null;
            //     loginSuccess(loginBrowser, requestParam, thit);
            //   }
            // });

            try {
              //等待https://1bp.taobao.com/report/query.json接口响应
              let response = await loginPage.waitForResponse(
                (response) => response.url().includes("/qnrForm.json"),
                // (response) => response.url().includes("https://myseller.taobao.com/home.htm/bc-templates/"),
                { timeout: 300000 } // 超时时间设置为5分钟（300,000毫秒）
              );


              console.log("response", response.url());

              loginSuccess(loginPage, requestParam, thit);
            } catch (e) {
              log.error("登录失败");
              log.error(e);
              this.browserWindow?.webContents.send("show-error-msgbox", "账号: " + requestParam.username + " 登录失败 请稍后重试!");
            }




            // timer = await new Promise((resolve) => setTimeout(resolve, 6 * 60 * 1000));

            // if (timer) {

            //   //关闭浏览器
            //   try {
            //     setTimeout(async () => {
            //       if (loginBrowser) {
            //         await loginBrowser.close();
            //       }

            //     }, 50000);
            // } catch (e) {
            //   log.error("关闭浏览器失败");
            // }

            //   log.info("登录超时");
            //   //将软件窗口显示出来
            //   this.browserWindow?.show();
            //   this.browserWindow?.webContents.send("show-error-msgbox", "账号: " + requestParam.username + " 登录超时 请稍后重试!");
            // }

          } else {
            log.info("登录成功,当前地址：" + currentUrl);
            loginSuccess(loginPage, requestParam, thit);
          }
        } catch (e: any) {
          log.error("登录error：");
          log.error(e);
          this.browserWindow?.webContents.send("show-error-msgbox", "账号: " + requestParam.username + " 登录失败 请稍后重试!");
        }
      }


      //将软件窗口显示出来
      this.browserWindow?.show();


      //等待1s
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // //将登录浏览器的所有页面关闭
      // if (loginBrowser) {
      //   console.log("关闭浏览器");

      //   let pages = await loginBrowser.pages();
      //   pages.forEach(async (item: any) => {
      //     await item.close();
      //   });
      // }

    });

    //获取登录信息
    ipcMain.on("get-login-info", async (event) => {
      //将当前登录信息发送到渲染进程
      this.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);
    });



    //获取店铺信息
    ipcMain.on("get-shops-info", async (event, param, flag) => {
      let browser;
      let requestParam = JSON.parse(param);
      //如果正在获取中 则不再获取
      let retrievingFlag = await retrievingFlagMap.get(requestParam.id);

      if (retrievingFlag) {
        log.info(requestParam.id + " 正在获取中");
        return;
      }

      await retrievingFlagMap.set(requestParam.id, true);

      log.info("-----------收到执行获取：" + requestParam.id + "店铺信息的任务-----------");
      try {
        let loginFlag = accountLoginInfoMap.get(requestParam.username);


        if (!loginFlag) {
          requestParam.status = "not-login";
          //删除retrievingFlagMap中的标识
          await retrievingFlagMap.delete(requestParam.id);
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        if (flag) {
          let shopsInfo = await shopsInfoMap.get(requestParam.id)

          if (shopsInfo) {
            //删除获取中标识
            await retrievingFlagMap.delete(requestParam.id);
            this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(shopsInfo));
            return;
          }
        }


        systemConfig.maxOpenBrowserNumber = parseInt(systemConfig.maxOpenBrowserNumber);
        log.info("当前系统配置：", systemConfig);
        log.info("当前打开浏览器数量：", await currentOpenBrowserNumber.getValue());


        //自旋锁等待浏览器数量小于最大值
        while (await currentOpenBrowserNumber.getValue() >= systemConfig.maxOpenBrowserNumber) {
          log.info(requestParam.id + "-等待中");
          requestParam.status = "wait";
          //将当前店铺信息发送到渲染进程
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        log.info("开始执行获取：" + requestParam.id + "店铺信息的任务");
        requestParam.status = "retrieving";
        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));

        // currentOpenBrowserNumber.increment();

        //根据对应配置 创建一个隐藏的浏览器
        // browser = await puppeteer.launch({
        //   // headless: isShowBrowser,
        //   headless: !systemConfig.isShowBrowser,
        //   args: [
        //     '--no-sandbox',
        //     '--disable-setuid-sandbox',
        //     '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
        //   ],
        //   executablePath: systemConfig.defaultChromePath
        // });

        //打开新页面 用于恢复cookie
        // let initCookiePage: any = await browser.newPage();

        let isLogin;

        try {
          // isLogin = await initCookie(initCookiePage, requestParam) as any
          // isLogin = await initCookieByApi(initCookiePage, requestParam.username) as any
          isLogin = await initCookieByApi(null, requestParam.username) as any
        } catch (e: any) {
          log.error("恢复cookie失败", e);
          isLogin = false;
        }

        if (!isLogin) {
          //删除获取中标识
          await retrievingFlagMap.delete(requestParam.id);

          //删除登录信息
          accountLoginInfoMap.delete(requestParam.username);

          try {

            //删除cookie文件
            let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");
            let dirName = requestParam.username.replace(":", "") + ".json";

            //拼接上用户名
            cookieDir = path.join(cookieDir, dirName);

            if (fs.existsSync(cookieDir)) {
              fs.unlinkSync(cookieDir);
            }

          } catch (e: any) {
            console.log("登录失败");
          } finally {
            if (browser) {
              await browser.close();
              currentOpenBrowserNumber.decrement();
            }
          }

          //响应信息
          requestParam.status = "not-login";
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        let loginInfo = accountLoginInfoMap.get(requestParam.username);

        let currTimeStamp = new Date().getTime();

        if (!loginInfo.operationParam || currTimeStamp - loginInfo.operationParam.timestamp > 2.8 * 60 * 60 * 1000
          || !loginInfo.depositParam || currTimeStamp - loginInfo.depositParam.timestamp > 2.8 * 60 * 60 * 1000
          || !loginInfo.aggregateBalanceParam || currTimeStamp - loginInfo.aggregateBalanceParam.timestamp > 2.8 * 60 * 60 * 1000
          || !loginInfo.goodsParam || currTimeStamp - loginInfo.goodsParam.timestamp > 2.8 * 60 * 60 * 1000
        ) {
          currentOpenBrowserNumber.increment();
          browser = await puppeteer.launch({
            headless: !systemConfig.isShowBrowser,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
            ],
            executablePath: systemConfig.defaultChromePath
          });

          //初始化cookie
          let initCookiePage: any = await browser.newPage();

          await initCookie(initCookiePage, requestParam);
        }


        let { shopsName, shopsData, wanxiangtaiData, otherIndicatorsData } = await getOperationAndWanXiangTaiDataByApi(browser, requestParam.username) as any
        let operationData = await getOperationDataByApi(browser, requestParam.username) as any
        let depositData = await getDepositDataByApi(browser, requestParam.username)
        let aggregateBalance = await getAggregateBalanceDataByApi(browser, requestParam.username)

        let goodsData = await getGoodsDataByApi(browser, requestParam.username)

        let statisticsData = await getStatisticsDataByApi(requestParam.username);

        let responseInfo = {
          id: requestParam.id,
          remark: requestParam.remark,
          crawlerTime: new Date().getTime(),
          shopsName: shopsName,
          ...shopsData,
          ...operationData,
          ...wanxiangtaiData,
          ...otherIndicatorsData,
          ...goodsData,
          aggregateBalance: aggregateBalance,
          ...depositData,
          shopLevel: shopsData.shopLevel,
          ...statisticsData,

          status: "success",
        }

        console.log('responseInfo', responseInfo);

        await shopsInfoMap.set(requestParam.id, responseInfo);

        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(responseInfo));
      } catch (e) {

        requestParam.status = "error";
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
      } finally {
        if (browser) {
          await browser.close();
          currentOpenBrowserNumber.decrement();
        }
        let requestParam = JSON.parse(param);
        await retrievingFlagMap.delete(requestParam.id);
      }
    });

    ipcMain.on("get-monitor-info", async (event, param, flag) => {
      let browser;
      let requestParam = JSON.parse(param);
      //如果正在获取中 则不再获取
      let retrievingFlag = await monitoringretrievingFlagMap.get(requestParam.id);

      if (retrievingFlag) {
        log.info(requestParam.id + " 正在获取中");
        return;
      }

      await monitoringretrievingFlagMap.set(requestParam.id, true);

      log.info("-----------收到执行获取：" + requestParam.id + "店铺信息的任务-----------");
      try {
        let loginFlag = accountLoginInfoMap.get(requestParam.username);


        if (!loginFlag) {
          requestParam.status = "not-login";
          //删除monitoringretrievingFlagMap中的标识
          await monitoringretrievingFlagMap.delete(requestParam.id);
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        if (flag) {
          console.log("缓存中获取");

          let shopsInfo = await monitoringMap.get(requestParam.id)

          await monitoringretrievingFlagMap.delete(requestParam.id);
          if (!shopsInfo) {
            //删除获取中标识
            requestParam.status = "";
            this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
            return;
          } else {
            this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(shopsInfo));
          }
          return
        }


        systemConfig.maxOpenBrowserNumber = parseInt(systemConfig.maxOpenBrowserNumber);
        log.info("当前系统配置：", systemConfig);
        log.info("当前打开浏览器数量：", await currentOpenBrowserNumber.getValue());


        //自旋锁等待浏览器数量小于最大值
        while (await currentOpenBrowserNumber.getValue() >= systemConfig.maxOpenBrowserNumber) {
          log.info(requestParam.id + "-等待中");
          requestParam.status = "wait";
          //将当前店铺信息发送到渲染进程
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        log.info("开始执行获取：" + requestParam.id + "店铺信息的任务");
        requestParam.status = "retrieving";
        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));

        let isLogin;

        try {
          isLogin = await initCookieByApi(null, requestParam.username) as any
        } catch (e: any) {
          log.error("恢复cookie失败", e);
          isLogin = false;
        }

        if (!isLogin) {
          //删除获取中标识
          await monitoringretrievingFlagMap.delete(requestParam.id);

          //删除登录信息
          accountLoginInfoMap.delete(requestParam.username);

          try {

            //删除cookie文件
            let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");
            let dirName = requestParam.username.replace(":", "") + ".json";

            //拼接上用户名
            cookieDir = path.join(cookieDir, dirName);

            if (fs.existsSync(cookieDir)) {
              fs.unlinkSync(cookieDir);
            }

          } catch (e: any) {
            console.log("登录失败");
          } finally {
            if (browser) {
              await browser.close();
              currentOpenBrowserNumber.decrement();
            }
          }

          await monitoringretrievingFlagMap.delete(requestParam.id);

          //响应信息
          requestParam.status = "not-login";
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        let loginInfo = accountLoginInfoMap.get(requestParam.username);

        let currTimeStamp = new Date().getTime();

        if (!loginInfo.operationParam || currTimeStamp - loginInfo.operationParam.timestamp > 2.8 * 60 * 60 * 1000
          || !loginInfo.depositParam || currTimeStamp - loginInfo.depositParam.timestamp > 2.8 * 60 * 60 * 1000
          || !loginInfo.aggregateBalanceParam || currTimeStamp - loginInfo.aggregateBalanceParam.timestamp > 2.8 * 60 * 60 * 1000
          || !loginInfo.goodsParam || currTimeStamp - loginInfo.goodsParam.timestamp > 2.8 * 60 * 60 * 1000
        ) {
          currentOpenBrowserNumber.increment();
          browser = await puppeteer.launch({
            headless: !systemConfig.isShowBrowser,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
            ],
            executablePath: systemConfig.defaultChromePath
          });

          //初始化cookie
          let initCookiePage: any = await browser.newPage();

          await initCookie(initCookiePage, requestParam);
        }


        let { shopsName, shopsData, wanxiangtaiData, otherIndicatorsData } = await getOperationAndWanXiangTaiDataByApi(browser, requestParam.username) as any
        let operationData = await getOperationDataByApi(browser, requestParam.username) as any
        let depositData = await getDepositDataByApi(browser, requestParam.username)
        let aggregateBalance = await getAggregateBalanceDataByApi(browser, requestParam.username)

        let goodsData = await getGoodsDataByApi(browser, requestParam.username)

        // let statisticsData = await getStatisticsDataByApi(requestParam.username);

        let responseInfo = {
          id: requestParam.id,
          remark: requestParam.remark,
          crawlerTime: new Date().getTime(),
          shopsName: shopsName,
          ...shopsData,
          ...operationData,
          ...wanxiangtaiData,
          ...otherIndicatorsData,
          ...goodsData,
          aggregateBalance: aggregateBalance,
          ...depositData,
          shopLevel: shopsData.shopLevel,
          // ...statisticsData,

          status: "success",
        }

        console.log('responseInfo', responseInfo);

        await monitoringMap.set(requestParam.id, responseInfo);

        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(responseInfo));
      } catch (e) {

        requestParam.status = "error";
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
      } finally {
        if (browser) {
          await browser.close();
          currentOpenBrowserNumber.decrement();
        }
        let requestParam = JSON.parse(param);
        await monitoringretrievingFlagMap.delete(requestParam.id);
      }
    });

    ipcMain.on("get-statistics-data", async (event, param, flag) => {
      let requestParam = JSON.parse(param);
      //如果正在获取中 则不再获取
      let retrievingFlag = await statisticsretrievingFlagMap.get(requestParam.id);

      if (retrievingFlag) {
        log.info(requestParam.id + " 正在获取中");
        return;
      }

      await statisticsretrievingFlagMap.set(requestParam.id, true);

      log.info("-----------收到执行获取：" + requestParam.id + "店铺信息的任务-----------");
      try {
        let loginFlag = accountLoginInfoMap.get(requestParam.username);

        if (!loginFlag) {
          requestParam.status = "not-login";
          await statisticsretrievingFlagMap.delete(requestParam.id);
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        if (flag) {
          let shopsInfo = await statisticsMap.get(requestParam.id)
          await statisticsretrievingFlagMap.delete(requestParam.id);
          if (!shopsInfo) {
            requestParam.status = "";
            this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          } else {
            this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(shopsInfo));
          }
          return;
        }
        requestParam.status = "retrieving";
        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));

        let isLogin;

        try {
          isLogin = await initCookieByApi(null, requestParam.username) as any
        } catch (e: any) {
          log.error("恢复cookie失败", e);
          isLogin = false;
        }

        if (!isLogin) {
          //删除获取中标识
          await statisticsretrievingFlagMap.delete(requestParam.id);

          //删除登录信息
          accountLoginInfoMap.delete(requestParam.username);

          try {

            //删除cookie文件
            let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");
            let dirName = requestParam.username.replace(":", "") + ".json";

            //拼接上用户名
            cookieDir = path.join(cookieDir, dirName);

            if (fs.existsSync(cookieDir)) {
              fs.unlinkSync(cookieDir);
            }

          } catch (e: any) {
            console.log("登录失败");
          }
          //响应信息
          requestParam.status = "not-login";
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        let statisticsData = await getStatisticsDataByApi(requestParam.username);

        let responseInfo = {
          id: requestParam.id,
          remark: requestParam.remark,
          crawlerTime: new Date().getTime(),
          ...statisticsData,
          status: "success",
        }

        console.log('responseInfo', responseInfo);

        await statisticsMap.set(requestParam.id, responseInfo);

        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(responseInfo));
      } catch (e) {
        requestParam.status = "error";
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
      } finally {
        await statisticsretrievingFlagMap.delete(requestParam.id);
      }
    });

    //获取配置
    ipcMain.on("get-config", (event) => {
      log.info("获取配置");

      this.browserWindow?.webContents.send("get-config", JSON.stringify(systemConfig));
    })

    //设置配置
    ipcMain.on("set-config", (event, param) => {
      log.info("设置配置");
      log.info(param);

      systemConfig = JSON.parse(param);

      let configPath = path.join(app.getPath("appData"), "qianniu-crawler-config.json");

      fs.writeFileSync(configPath, JSON.stringify(systemConfig, null, 2));

      // log.info("设置成功");
      this.browserWindow?.webContents.send("show-success-msgbox", "设置成功");
    });
  }

}


//登录
const login = async (loginPage: any, username: string, password: string) => {

  // let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://web.m.taobao.com/app/operation-center/open-shop/home-pc"
  let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://myseller.taobao.com/home.htm/bc-templates/"
  loginPage.goto(url);

  //等待加载完毕
  await loginPage.waitForNavigation();

  //拿到#fm-login-id 输入账号
  await loginPage.waitForSelector('#fm-login-id');

  await loginPage.type('#fm-login-id', username);

  //等待1秒
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //拿到#fm-login-password 输入密码
  await loginPage.waitForSelector('#fm-login-password');

  await loginPage.type('#fm-login-password', password);

  //拿到.password-login
  await loginPage.waitForSelector('.password-login');

  //等待1秒
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //点击登录
  await loginPage.click('.password-login');

  await loginPage.waitForNavigation({ waitUntil: 'networkidle0' });

  //监听跳转后的地址
  loginPage.on("response", async (response: any) => {
    //拿到当前地址
    let currentUrl = response.url();

    if (currentUrl == 'https://myseller.taobao.com/home.htm/bc-templates/') {

      //保存cookies
      const cookies = await loginPage.cookies();

      //过期时间为10天后
      let expires = Date.now() / 1000 + 10 * 24 * 60 * 60;

      //将.之后的去掉
      expires = Math.floor(expires);

      const persistentCookies = cookies.map(cookie => ({
        ...cookie,
        expires: expires
      }));

      let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

      if (!fs.existsSync(cookieDir)) {
        fs.mkdirSync(cookieDir);
      }

      let dirName = username.replace(":", "") + ".json";

      //拼接上用户名
      cookieDir = path.join(cookieDir, dirName);

      //写入文件
      fs.writeFileSync(cookieDir, JSON.stringify(persistentCookies, null, 2));

      //关闭当前所有页面
      try {
        let pages = await loginPage.browser().pages();
        pages.forEach(async (item: any) => {
          await item.close();
        });
      } catch (e: any) {
        log.error("自动关闭失败", e);

      }
    }

  });
}

//获取运维数据
const getOperationAndWanXiangTaiData = async (browserParam: any) => {
  let homePage = await browserParam.newPage();

  await homePage.setRequestInterception(true);
  homePage.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['stylesheet', 'font', 'image', 'media'].includes(resourceType)) {
      request.abort(); // 阻止加载样式和其他静态资源
    } else {
      request.continue();
    }
  });

  homePage.goto("https://myseller.taobao.com/home.htm/QnworkbenchHome/");

  //评分
  let shopsScore;
  try {
    //等待加载完毕
    await homePage.waitForNavigation();

    shopsScore = await homePage.evaluate(() => {
      let scoreEle = document.querySelector('[class*="shopCard_npsValue"]') as any

      return scoreEle?.innerText || "获取失败";
    });

    //写一个正则拿到字符串中的所有数字包含小数
    let score = shopsScore.match(/\d+(\.\d+)?/g);
    shopsScore = score ? score[0] : "获取失败";
  } catch (e: any) {
    log.error("获取店铺评分失败", e);

    shopsScore = "网络异常 请重新获取";
  }

  //店铺数据
  let shopsData;
  try {
    shopsData = await homePage.evaluate(() => {
      let shopsDataEle = document.querySelectorAll('[class*="shopCard_scoreValue"]') as any

      let babyBuality = shopsDataEle[0]?.innerText || "获取失败";
      let logisticsSpeed = shopsDataEle[1]?.innerText || "获取失败";
      let serviceGuarantee = shopsDataEle[2]?.innerText || "获取失败";

      return {
        babyBuality: babyBuality,
        logisticsSpeed: logisticsSpeed,
        serviceGuarantee: serviceGuarantee
      }
    });
  } catch (e: any) {
    log.error("获取店铺数据失败", e);

    shopsScore = {
      babyBuality: "获取失败",
      logisticsSpeed: "获取失败",
      serviceGuarantee: "获取失败"
    }
  }




  //获取店铺名称
  let shopName;

  try {
    //等待加载完毕

    //document.querySelectorAll('[class*="skip"]');

    await homePage.evaluate(() => {
      let skipBtnList = document.querySelectorAll('[class*="skip"]');
      skipBtnList.forEach((item: any) => {
        item.click();
      });
    });

    await homePage.evaluate(() => {
      let skipBtnList = document.querySelectorAll('[class*="Skip"]');
      skipBtnList.forEach((item: any) => {
        item.click();
      });
    });
    shopName = await homePage.evaluate(() => {
      let shopNameEle = document.querySelectorAll('#icestarkNode [class*="shopCard_shopName"]')[0] as any

      return shopNameEle?.innerText || "获取失败";
    });
  } catch (e: any) {
    log.error("获取店铺名称失败", e);

    shopName = "网络异常 请重新获取";
  }

  //运维数据
  let operationData;

  try {
    //等待.qndatafont_md元素加载完毕
    // await homePage.waitForSelector(".qndatafont_md");
    await homePage.waitForSelector('[title="待发货"]', { visible: true });
    await homePage.waitForSelector('[title="待付款"]', { visible: true });
    await homePage.waitForSelector('[title="待处理投诉"]', { visible: true });
    await homePage.waitForSelector('[title="待售后"]', { visible: true });
    await homePage.waitForSelector('[title="待评价"]', { visible: true });
    operationData = await homePage.evaluate(() => {
      //待发货
      let pendingDeliveryEle = document.querySelector('[title="待发货"]') as any
      let toBeDelivered = pendingDeliveryEle.previousElementSibling.innerText;

      //待付款
      let pendingPaymentEle = document.querySelector('[title="待付款"]') as any
      let toBePaid = pendingPaymentEle.previousElementSibling.innerText;

      //待处理投诉
      let pendingComplaintEle = document.querySelector('[title="待处理投诉"]') as any
      let toBeComplaint = pendingComplaintEle.previousElementSibling.innerText;

      //待售后
      let pendingAfterSaleEle = document.querySelector('[title="待售后"]') as any
      let toBeAfterSale = pendingAfterSaleEle.previousElementSibling.innerText;

      //待评价
      let pendingEvaluationEle = document.querySelector('[title="待评价"]') as any
      let toBeEvaluated = pendingEvaluationEle.previousElementSibling.innerText;


      return {
        toBeDelivered: toBeDelivered,
        toBePaid: toBePaid,
        toBeComplaint: toBeComplaint,
        toBeAfterSale: toBeAfterSale,
        toBeEvaluated: toBeEvaluated
      };
    });
  } catch (e: any) {
    log.error("获取运维数据失败");
    log.error(e.message);

    operationData = {
      toBeDelivered: "网络异常 请重新获取",
      toBePaid: "网络异常 请重新获取",
      toBeComplaint: "网络异常 请重新获取",
      toBeAfterSale: "网络异常 请重新获取",
      toBeEvaluated: "网络异常 请重新获取",
    }
  }

  //万相台数据
  let wanxiangtaiData;

  let checkedTags

  try {
    //等待.qn_plus_square元素加载完毕
    await homePage.waitForSelector(".qn_plus_square");

    //获取到此元素并点击
    await homePage.click(".qn_plus_square");

    await homePage.waitForSelector('.next-dialog-body .next-tag');

    checkedTags = await homePage.evaluate(() => {
      let checkTagArr: any = [];

      const tags = document.querySelectorAll('.next-dialog-body .next-tag') as any;

      tags.forEach((tag: any) => {
        // 判断元素是否包含 'checked' 类名
        if (tag.classList.contains('checked')) {
          checkTagArr.push(tag?.innerText);
        }
      });

      tags.forEach(tag => {
        // 判断元素是否包含 'checked' 类名
        if (tag.classList.contains('checked')) {
          // 如果包含 'checked' 类名，点击该元素
          tag.click();
        }
      });

      tags.forEach(tag => {
        // 判断元素是否包含 'checked' 类名
        if (tag.innerText.includes("万相台")) {
          //点击
          tag.click();
        }
      });

      let btnEle = document.querySelector(".next-dialog-footer button") as any
      btnEle.click();

      //将 checkedTags 返回
      return checkTagArr;
    });

    //等待.next-row元素加载完毕 
    await homePage.waitForSelector(".next-row");

    //睡眠1秒
    await new Promise((resolve) => setTimeout(resolve, 1500));

    wanxiangtaiData = await homePage.evaluate(() => {
      let boxEle = document.querySelector(".next-row") as any;

      return boxEle?.innerText || "";
    });

    // log.error("万相台数据：", wanxiangtaiData);


    let temp = wanxiangtaiData.split("\n");



    /**
     * [
     * '支付金额', '822.5', '昨日832.8', 
     * '访客数', '31', '昨日22', 
     * '支付子订单数', '9', '昨日9', 
     * '万相台账户余额', '171.54', '昨日-', 
     * '万相台花费', '2.17', '昨日2.23', 
     * '万相台展现量', '2,651', '昨日981', 
     * '万相台点击量', '16', '昨日15', 
     * '万相台成交金额', '0', '昨日0', 
     * '万相台投产比', '0', '昨日0'
     * ]
     */


    /**
      支付金额
      257.4
      昨日822.5
      访客数
      13
      昨日36
      支付子订单数
      1
      昨日9
      万相台账户余额
      -
      万相台花费
      -
      万相台展现量
      -
      万相台点击量
      -
      万相台成交金额
      -
      万相台投产比
      -
     */

    let visitor = ""
    let amount = ""
    let order = ""
    let wxtBalance = ""
    let wxtCharge = ""
    let wxtDisplay = ""
    let wxtClick = ""
    let wxtTransaction = ""
    let wxtProfit = ""

    for (let i = 0; i < temp.length; i += 3) {
      let item = temp[i];

      if (item.includes("访客数")) {
        visitor = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("支付子订单数")) {
        order = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("支付金额")) {
        amount = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台账户余额")) {
        wxtBalance = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台花费")) {
        wxtCharge = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台展现量")) {
        wxtDisplay = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台点击量")) {
        wxtClick = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台成交金额")) {
        wxtTransaction = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台投产比")) {
        wxtProfit = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }
    }

    wanxiangtaiData = {
      visitor: visitor,
      amount: amount,
      order: order,
      wxtBalance: wxtBalance,
      wxtCharge: wxtCharge,
      wxtDisplay: wxtDisplay,
      wxtClick: wxtClick,
      wxtTransaction: wxtTransaction,
      wxtProfit: wxtProfit
    }
  } catch (e: any) {
    log.error("获取万相台数据失败");

    log.error(e.message);

    wanxiangtaiData = {
      visitor: "获取失败",
      amount: "获取失败",
      order: "获取失败",
      wxtBalance: "获取失败",
      wxtCharge: "获取失败",
      wxtDisplay: "获取失败",
      wxtClick: "获取失败",
      wxtTransaction: "获取失败",
      wxtProfit: "获取失败"
    }
  }

  //睡眠1秒
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //其他指标数据
  let otherIndicatorsData;



  try {
    //等待.qn_plus_square元素加载完毕
    await homePage.waitForSelector(".qn_plus_square");

    //获取其他指标数据
    await homePage.click(".qn_plus_square");

    await homePage.waitForSelector(".next-dialog-body .next-tag");
    await homePage.evaluate(() => {

      const tags = document.querySelectorAll('.next-dialog-body .next-tag') as any;

      tags.forEach(tag => {
        // 判断元素是否包含 'checked' 类名
        if (tag.classList.contains('checked')) {
          // 如果包含 'checked' 类名，点击该元素
          tag.click();
        }
      });

      tags.forEach(tag => {

        if (tag.innerText.includes("加购人数")) {
          //点击
          tag.click();
        }

        if (tag.innerText.includes("浏览量")) {
          //点击
          tag.click();
        }

        if (tag.innerText.includes("支付买家数")) {
          //点击
          tag.click();
        }

        if (tag.innerText.includes("支付转化率")) {
          //点击
          tag.click();
        }

        if (tag.innerText.includes("客单价")) {
          //点击
          tag.click();
        }

        if (tag.innerText.includes("加购商品数")) {
          //点击
          tag.click();
        }

        if (tag.innerText.includes("收藏商品数")) {
          //点击
          tag.click();
        }
      });

      let btnEle = document.querySelector(".next-dialog-footer button") as any
      btnEle.click();
    });

    //等待.next-row元素加载完毕 
    await homePage.waitForSelector(".next-row");

    //睡眠1秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    //拿到.next-row元素的innerText
    otherIndicatorsData = await homePage.evaluate(() => {
      let boxEle = document.querySelector(".next-row") as any;

      return boxEle?.innerText || "";
    });




    let temp = otherIndicatorsData.split("\n");
    // console.log("其他指标数据：", temp);



    /**
     ['支付金额', '822.5', '昨日832.8', 
     '访客数', '37', '昨日22', 
     '支付子订单数', '9', '昨日9', 
     '支付转化率', '2.7%', '昨日4.55%', 
     '浏览量', '98', '昨日41', 
     '加购人数', '1', '昨日2', 
     '客单价', '822.5', '昨日832.8', 
     '支付买家数', '1', '昨日1', 
     '加购商品数', '1', 
     '收藏商品数', '3']
 
     */


    /**
    [
  '支付金额',     '257.4', '昨日822.5',
  '访客数',       '13',    '昨日36',
  '支付子订单数', '1',     '昨日9',
  '支付转化率',   '7.69%', '昨日2.78%',
  '浏览量',       '26',    '昨日86',
  '加购人数',     '0',     '昨日1',
  '客单价',       '257.4', '昨日822.5',
  '支付买家数',   '1',     '昨日1',
  '加购商品数',   '0',     
  '收藏商品数',   '0'
     */

    let addToCart = ""
    let conversionRate = ""
    let pageViews = ""
    let buyerNumber = ""
    let unitPrice = ""
    let addToCartNumber = ""
    let collectionNumber = ""

    for (let i = 0; i < temp.length; i += 3) {
      let item = temp[i];

      if (item.includes("加购人数")) {
        addToCart = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }


      if (item.includes("支付转化率")) {
        conversionRate = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("浏览量")) {
        pageViews = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("支付买家数")) {
        buyerNumber = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("客单价")) {
        unitPrice = temp[i + 1] + "/" + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("加购商品数")) {
        addToCartNumber = temp[i + 1];
      }

      // if (item.includes("收藏商品数")) {
      //   console.log("执行");
      //   console.log("当前索引：", i);


      //   collectionNumber = temp[i + 1];
      // }

    }

    collectionNumber = temp[temp.length - 1];

    otherIndicatorsData = {
      addToCart: addToCart,
      conversionRate: conversionRate,
      pageViews: pageViews,
      buyerNumber: buyerNumber,
      unitPrice: unitPrice,
      addToCartNumber: addToCartNumber,
      collectionNumber: collectionNumber
    }
  } catch (e: any) {
    log.error("获取其他指标数据失败");

    log.error(e.message);

    otherIndicatorsData = {
      addToCart: "获取失败",
      conversionRate: "获取失败",
      pageViews: "获取失败",
      buyerNumber: "获取失败",
      unitPrice: "获取失败",
      addToCartNumber: "获取失败",
      collectionNumber: "获取失败"
    }
  }

  //恢复指标
  try {
    //获取到此元素并点击
    await homePage.click(".qn_plus_square");

    await homePage.waitForSelector('.next-dialog-body .next-tag');

    await homePage.evaluate((arr) => {

      console.log("arr", arr);

      const tags = document.querySelectorAll('.next-dialog-body .next-tag') as any;

      tags.forEach((tag: any) => {
        if (tag.classList.contains('checked')) {
          // 如果包含 'checked' 类名，点击该元素
          tag.click();
        }
      });

      tags.forEach(tag => {
        let tagText = tag.innerText;

        for (let i = 0; i < arr.length; i++) {
          if (tagText == (arr[i])) {
            tag.click();
          }
        }
      });


      let btnEle = document.querySelector(".next-dialog-footer button") as any
      btnEle.click();

    }, checkedTags);
  } catch (e: any) {
    log.error("恢复指标失败");
    log.error(e.message);
  }

  //周数据 https://sycm.taobao.com/portal/home.htm?activeKey=operator&dateType=week

  try {

    homePage.goto("https://sycm.taobao.com/portal/home.htm?activeKey=operator&dateType=week");
    //等待页面加载完成
    await homePage.waitForNavigation();

    //等待.ebase-frame-header-text元素加载完毕
    await homePage.waitForSelector(".ebase-frame-header-text");

    await homePage.evaluate(() => {

      let ele = document.querySelector(".ebase-frame-header-text") as any;
      let text = ele?.innerText || "";

      if ("返回旧版" == text) {
        ele.click();
      }
    })

    //等待页面加载完成
    await homePage.waitForNavigation();

    //等待oui-floor-nav-floor1元素加载完毕
    await homePage.waitForSelector(".oui-floor-nav-floor1");

    await new Promise((resolve) => setTimeout(resolve, 500));

    //点击 .oui-floor-nav-floor1
    await homePage.evaluate(() => {
      let ele = document.querySelector(".oui-floor-nav-floor1 a") as any;

      ele.click();
    });

    //等待 .next-tabs-nav 加载完毕
    await homePage.waitForSelector(".oui-index-cell");

    // //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let data1 = await homePage.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });

    //等待.index-page-arrow元素加载完毕
    await homePage.waitForSelector(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //点击
    await homePage.click(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //等待.index-page-arrow元素加载完毕
    await homePage.waitForSelector(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //点击第二个.index-page-arrow
    await homePage.click(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");
    //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let data3 = await homePage.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });

    for (let i = 0; i < data1.length; i++) {
      let item = data1[i];

      if (item.key.includes("支付金额")) {
        wanxiangtaiData.amount += "/" + item.value;
      }

      if (item.key.includes("访客数")) {
        wanxiangtaiData.visitor += "/" + item.value;
      }
    }

    for (let i = 0; i < data3.length; i++) {
      let item = data3[i];

      if (item.key.includes("支付子订单数")) {
        wanxiangtaiData.order += "/" + item.value;
      }
    }

  } catch (e: any) {
    log.error("获取周数据失败");
    log.error(e.message);
    wanxiangtaiData.amount += "/获取失败";
    wanxiangtaiData.visitor += "/获取失败";

  }



  //月数据 https://sycm.taobao.com/portal/home.htm?activeKey=operator&dateType=month
  try {

    homePage.goto("https://sycm.taobao.com/portal/home.htm?activeKey=operator&dateType=month");
    //等待页面加载完成
    await homePage.waitForNavigation();

    //等待oui-floor-nav-floor1元素加载完毕
    await homePage.waitForSelector(".oui-floor-nav-floor1");

    await new Promise((resolve) => setTimeout(resolve, 500));

    //点击 .oui-floor-nav-floor1
    await homePage.evaluate(() => {
      let ele = document.querySelector(".oui-floor-nav-floor1 a") as any;

      ele.click();
    });

    //等待 .next-tabs-nav 加载完毕
    await homePage.waitForSelector(".oui-index-cell");

    // //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let data1 = await homePage.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });

    //等待.index-page-arrow元素加载完毕
    await homePage.waitForSelector(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //点击
    await homePage.click(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //等待.index-page-arrow元素加载完毕
    await homePage.waitForSelector(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //点击第二个.index-page-arrow
    await homePage.click(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");
    //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let data3 = await homePage.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });

    for (let i = 0; i < data1.length; i++) {
      let item = data1[i];

      if (item.key.includes("支付金额")) {
        wanxiangtaiData.amount += "/" + item.value;
      }

      if (item.key.includes("访客数")) {
        wanxiangtaiData.visitor += "/" + item.value;
      }
    }

    for (let i = 0; i < data3.length; i++) {
      let item = data3[i];

      if (item.key.includes("支付子订单数")) {
        wanxiangtaiData.order += "/" + item.value;
      }
    }

  } catch (e: any) {
    log.error("获取月数据失败");
    log.error(e.message);
    wanxiangtaiData.amount += "/获取失败";
    wanxiangtaiData.visitor += "/获取失败";

  }

  return {
    shopName: shopName,
    shopsScore: shopsScore,
    shopsData: shopsData,
    operationData: operationData,
    wanxiangtaiData: wanxiangtaiData,
    otherIndicatorsData: otherIndicatorsData
  }
}

const getOperationAndWanXiangTaiDataByApi = async (browserParam: any, username) => {

  let loginInfo = accountLoginInfoMap.get(username);

  let cookieStr = accountLoginInfoMap.get(username).cookie || "";

  let shopsData;

  let shopsName = "";
  try {
    let shopsDataApi = `https://sycm.taobao.com/portal/new/experience/scorecard.json`

    let shopsDataRes = await axios.get(shopsDataApi, {
      headers: {
        "cookie": cookieStr,
      }
    });

    /**
     {
  "content": {
    "code": 0,
    "data": {
      "industryRank": 39,
      "logisticsExpValueLevel": 1,
      "npsValue": "4.76",
      "goodsValueLevel": 1,
      "goodsExpValueLevel": 1,
      "npsValueOutLevel": 3,
      "npsStarNum": "0.00",
      "goodsValue": "5.00",
      "serviceExpValue": "4.41",
      "bcType": 0,
      "logisticsValue": "5.00",
      "npsValueLevel": 1,
      "goodsExpValue": "5.00",
      "logisticsValueLevel": 1,
      "serviceExpValueLevel": 2,
      "dateId": "20241216",
      "rankValue": 39,
      "logisticsExpValue": "5.00",
      "npsValueOut": "4.76"
    },
    "message": "操作成功",
    "traceId": "213dfbc917344430138311153e17ca"
  },
  "hasError": false
}
     */

    let code = shopsDataRes.data.content.code;
    let data = shopsDataRes.data.content.data;

    if (code != 0) {
      throw new Error("获取店铺数据失败" + shopsDataRes.data);
    }

    console.log("店铺数据：", data);

    shopsData = {
      babyBuality: data.goodsValue,
      logisticsSpeed: data.logisticsValue,
      serviceGuarantee: data.serviceExpValue,
      shopsScore: data.npsValue,
      shopsLevel: data.npsValueOutLevel
    }

    console.log("解析后的：", shopsData);

  } catch (e: any) {
    log.error("获取店铺数据失败", e);

    shopsData = {
      babyBuality: "获取失败",
      logisticsSpeed: "获取失败",
      serviceGuarantee: "获取失败",
      shopsScore: "获取失败",
      shopsLevel: "获取失败"
    }
  }


  try {
    let shopsNameApi = `https://sycm.taobao.com/custom/menu/getPersonalView.json`

    let shopsNameRes = await axios.get(shopsNameApi, {
      headers: {
        "cookie": cookieStr,
        "Referer": "https://sycm.taobao.com/portal/home.htm"
      }
    });

    /**
     {
    "traceId": "2127b52d17345170099822229e1361",
    "code": 0,
    "data": {
        "runAsUserName": "tb822174710238",
        "mainUserName": "tb822174710238",
        "runAsShopId": 485220654,
        "runAsShopTitle": "冉森家具馆",
        "runAsShopType": 0,
        "isRetailSeller": 0,
        "loginUserId": 2218932247834,
        "mainUserId": 2218137783636,
        "loginUserName": "tb822174710238:磊磊",
        "runAsUserId": 2218137783636
    },
    "message": "操作成功"
}
     */

    let code = shopsNameRes.data.code;
    let data = shopsNameRes.data.data;

    if (code != 0) {
      throw new Error(JSON.stringify(shopsNameRes.data));
    }

    shopsName = data.runAsShopTitle;

    console.log("店铺名称：", data);

  } catch (e: any) {
    log.error("获取店铺名称失败", e);
    shopsName = "获取失败";
  }



  // //万相台数据
  let wanxiangtaiData: any = {
    visitor: "", //访客数
    amount: "", //支付金额
    order: "", //支付子订单数
    wxtBalance: "", //万象台余额
    wxtCharge: "", //万象台花费
    wxtDisplay: "", //万象台展现量
    wxtClick: "", //万象台点击量
    wxtTransaction: "", //万相台成交金额
    wxtProfit: "" //万相台投产比
  };

  try {
    //万象台余额
    let wxtBalanceApi = `https://stlacct.taobao.com/settleAccount/account/getRealBalance.json?csrfId=3eceb42b7680db5d6e8c6a705240bf54_1_1_1&bizCode=universalBP&loginPointId=2166745d17344453454468463e1383`

    console.log("cookieStr", cookieStr);


    let wxtBalanceRes = await axios.get(wxtBalanceApi, {
      headers: {
        "Cookie": cookieStr,
        "Referer": "https://one.alimama.com/"
      }
    });

    console.log("wxtBalanceRes", wxtBalanceRes.data);

    wanxiangtaiData.wxtBalance = wxtBalanceRes.data.data.totalGeneralBalance || 0

    //判断wanxiangtaiData.wxtBalance是否为数字
    if (!isNaN(wanxiangtaiData.wxtBalance)) {
      wanxiangtaiData.wxtBalance = (wanxiangtaiData.wxtBalance / 100).toFixed(2);
    }


  } catch (e: any) {
    console.log("获取万象台余额失败", e);

    wanxiangtaiData.wxtBalance = "请开通万象台权限";
  }

  try {
    //今日万象台数据
    let csrfId = loginInfo.csrfId.split("|-|")[0];
    let cookieStr = loginInfo.csrfId.split("|-|")[1];


    // let api = `https://1bp.taobao.com/report/query.json?csrfId=${csrfId}&bizCode=universalBP`
    let api = `https://1bp.taobao.com/report/query.json?csrfId=${csrfId}&bizCode=universalBP`
    const headers = {
      'Content-Type': 'application/json', // 表示请求体是JSON格式
      'Cookie': cookieStr, // 替换为你的Cookie值
      'Referer': 'https://myseller.taobao.com/home.htm/tuiguangcenter_new/', // 替换为合适的Referer
    };

    let now = new Date();
    let startTime = formatDate(now) + ""
    console.log(startTime);

    let param = {
      "lite2": false,
      "source": "home",
      "fromRealTime": true,
      "splitType": "sum",
      "startTime": startTime,
      "endTime": startTime,
      "queryFieldIn": ["charge", "adPv", "click", "roi", "alipayInshopAmt"],
      "bizCode": "universalBP"
    }

    // 发送 POST 请求
    const response = await axios.post(api, param, { headers });

    console.log('响应数据:', response.data);

    /**
     {
  "data": {
    "list": [
      {
        "alipayDirAmt": 0,
        "alipayIndirAmt": 0,
        "alipayInshopAmt": 0,
        "operationList": [],
        "charge": 7.639999999999999,
        "adPv": 3425,
        "click": 49,
        "roi": 0,
        "memberId": 4132255568
      }
    ]
  },
  "info": {
    "strategyPoints": null,
    "lockSla": false,
    "redirectUrl": null,
    "errorEntityIdList": null,
    "httpStatus": null,
    "errorCode": null,
    "ok": true,
    "unlockUrl": null,
    "message": null,
    "disableTime": false
  }
}
     */

    let info = response.data.info

    if (!info.ok) {
      //删除csrfId
      let username = loginInfo.username;
      let csrfIdDir = path.join(app.getPath("appData"), "qianniu-crawler-csrfId");
      let csrfIdDirName = username.replace(":", "") + ".txt";
      csrfIdDir = path.join(csrfIdDir, csrfIdDirName);

      if (fs.existsSync(csrfIdDir)) {
        fs.unlinkSync(csrfIdDir);
      }

      if (!browserParam) {
        browserParam = await puppeteer.launch({
          headless: !systemConfig.isShowBrowser,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
          ],
          executablePath: systemConfig.defaultChromePath
        });
      }
      await initCsrfId(browserParam, username);

      throw new Error("csrfId过期");
    }

    let data = response.data.data.list[0]

    wanxiangtaiData.wxtCharge = data.charge || 0;

    if (!isNaN(wanxiangtaiData.wxtCharge)) {
      wanxiangtaiData.wxtCharge = (wanxiangtaiData.wxtCharge).toFixed(2);
    }

    wanxiangtaiData.wxtDisplay = data.adPv || 0;
    wanxiangtaiData.wxtClick = data.click || 0;
    wanxiangtaiData.wxtTransaction = data.alipayInshopAmt || 0;
    wanxiangtaiData.wxtProfit = data.roi || 0;


  } catch (e: any) {
    log.error("获取万象台其他数据失败");
    log.error(e.message);

    if (e.message.includes("403")) {
      //删除csrfId
      let username = loginInfo.username;
      let csrfIdDir = path.join(app.getPath("appData"), "qianniu-crawler-csrfId");
      let csrfIdDirName = username.replace(":", "") + ".txt";
      csrfIdDir = path.join(csrfIdDir, csrfIdDirName);

      if (fs.existsSync(csrfIdDir)) {
        fs.unlinkSync(csrfIdDir);
      }

      if (!browserParam) {
        browserParam = await puppeteer.launch({
          headless: !systemConfig.isShowBrowser,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
          ],
          executablePath: systemConfig.defaultChromePath
        });
      }
      log.error("csrfId过期，正在重新获取");
      let requestParam = {
        username: username,
      }
      let initCookiePage = await browserParam.newPage();
      await initCookie(initCookiePage, requestParam);
      await initCsrfId(browserParam, username);

      try {
        if (browserParam) {
          setTimeout(() => {
            browserParam.close();
          }, 3500);
        }
      } catch (e) {
      }
    }

    wanxiangtaiData.wxtCharge = "获取失败 请重新获取";
    wanxiangtaiData.wxtDisplay = "获取失败 请重新获取";
    wanxiangtaiData.wxtClick = "获取失败 请重新获取";
    wanxiangtaiData.wxtTransaction = "获取失败 请重新获取";
    wanxiangtaiData.wxtProfit = "获取失败 请重新获取";
  }


  //获取今日其他指标数据
  let otherIndicatorsData: any = {
    addToCart: "", //加购人数
    conversionRate: "", //支付转化率
    pageViews: "", //浏览量
    buyerNumber: "", //支付买家数
    unitPrice: "", //客单价
    addToCartNumber: "", //加购件数
    collectionNumber: "" //收藏商品数
  }

  try {
    let api = `https://sycm.taobao.com/flow/new/live/guide/trend/overview.json?dateType=today&device=0&indexCode=uv%2CitmUv%2CpayByrCnt`

    let otherIndicatorsDataRes = await axios.get(api, {
      headers: {
        cookie: cookieStr
      }
    });

    console.log("今日其他指标数据：", otherIndicatorsDataRes.data);

    let code = otherIndicatorsDataRes.data.code
    let data = otherIndicatorsDataRes.data.data.data;

    if (code != 0) {
      throw new Error("获取今日其他指标数据失败" + JSON.stringify(otherIndicatorsDataRes.data));
    }

    console.log("今日数据：", data);

    otherIndicatorsData.buyerNumber = data.payByrCnt.value || 0;
    otherIndicatorsData.conversionRate = data.payRate.value || 0;
    otherIndicatorsData.pageViews = data.pv.value || 0;
    otherIndicatorsData.unitPrice = data.payPct.value || 0;
    otherIndicatorsData.addToCart = data.cartByrCnt.value || 0;
    otherIndicatorsData.collectionNumber = data.itmCltByrCnt.value || 0;

    wanxiangtaiData.amount = data.payAmt.value || 0;
    wanxiangtaiData.visitor = data.uv.value || 0;

    if (otherIndicatorsData.conversionRate) {
      //如果包含小数点
      //四舍五入
      otherIndicatorsData.conversionRate = Math.round(otherIndicatorsData.conversionRate * 10000) / 100 + "%";
    } else {
      otherIndicatorsData.conversionRate = "0%";
    }


  } catch (e: any) {
    log.error("获取今日其他指标数据失败");
    log.error(e.message);

    wanxiangtaiData.amount = "获取失败";
    wanxiangtaiData.visitor = "获取失败";
    otherIndicatorsData.buyerNumber = "获取失败";
    otherIndicatorsData.unitPrice = "获取失败";

  }

  //获取子订单数
  try {
    let api = `https://sycm.taobao.com/portal/live/new/index/overview.json?dateType=today`

    let otherIndicatorsDataRes = await axios.get(api, {
      headers: {
        cookie: cookieStr
      }
    });

    console.log("今日其他指标数据：", otherIndicatorsDataRes.data);

    let code = otherIndicatorsDataRes.data.content.code
    let data = otherIndicatorsDataRes.data.content.data.data.today;

    if (code != 0) {
      throw new Error("获取其他指标数据失败" + JSON.stringify(otherIndicatorsDataRes.data));
    }

    //今日子订单数
    wanxiangtaiData.order = data.payOrdCnt.value || 0;
  } catch (e: any) {
    log.error("获取今日子订单数失败");
    log.error(e.message);

    wanxiangtaiData.order = "获取失败";
  }

  //获取做题日其他指标数据

  try {
    let yesterday = getYesterday()
    let dateRange = `${formatDate(yesterday)}%7C${formatDate(yesterday)}`
    let api = `https://sycm.taobao.com/portal/coreIndex/new/overview/v2.json?dateType=day&dateRange=${dateRange}`

    let otherIndicatorsDataRes = await axios.get(api, {
      headers: {
        cookie: cookieStr
      }
    });

    console.log("昨日其他指标数据：", otherIndicatorsDataRes.data);


    let code = otherIndicatorsDataRes.data.content.code;
    let data = otherIndicatorsDataRes.data.content.data;

    if (code != 0) {
      throw new Error("获取其他指标数据失败" + JSON.stringify(otherIndicatorsDataRes.data));
    }

    otherIndicatorsData.pageViews += "/" + (data.self.pv?.value || 0);
    let tempConversionRate = (data.self.payRate?.value || 0)
    otherIndicatorsData.buyerNumber += "/" + (data.self.payByrCnt?.value || 0);
    otherIndicatorsData.unitPrice += "/" + (data.self.payPct?.value || 0).toFixed(2);
    otherIndicatorsData.addToCart += "/" + (data.self.cartByrCnt?.value || 0);
    otherIndicatorsData.collectionNumber += "/" + (data.self.cltItmCnt?.value || 0);
    otherIndicatorsData.addToCartNumber += "/" + (data.self.cartItemCnt?.value || 0);

    wanxiangtaiData.amount += ("/" + (data.self.rePurchasePayAmount?.value || 0).toFixed(2))
    wanxiangtaiData.order += ("/" + (data.self.subPayOrdSubCnt?.value || 0))
    wanxiangtaiData.visitor += ("/" + (data.self.uv?.value || 0))

    if (tempConversionRate) {
      //如果包含小数点
      //四舍五入
      tempConversionRate = Math.round(tempConversionRate * 10000) / 100 + "%";
      otherIndicatorsData.conversionRate += ("/" + tempConversionRate)
    } else {
      otherIndicatorsData.conversionRate += ("/" + otherIndicatorsData.tempConversionRate)
    }

  } catch (e: any) {
    log.error("获取其他指标数据失败", e);

    otherIndicatorsData.addToCart += "/获取失败";
    otherIndicatorsData.conversionRate += "/获取失败";
    otherIndicatorsData.pageViews += "/获取失败";
    otherIndicatorsData.buyerNumber += "/获取失败";
    otherIndicatorsData.unitPrice += "/获取失败";
    otherIndicatorsData.addToCartNumber += "/获取失败";
    otherIndicatorsData.collectionNumber += "/获取失败";

  }



  //周数据 https://sycm.taobao.com/portal/home.htm?activeKey=operator&dateType=week

  try {
    const { firstDayOfLastWeek, lastDayOfLastWeek } = getFirstAndLastDayOfLastWeek()

    const weekDateRange = `${formatDate(firstDayOfLastWeek)}%7C${formatDate(lastDayOfLastWeek)}`

    const weekApi = `https://sycm.taobao.com/portal/coreIndex/getShopMainIndexes.json?dateType=week&dateRange=${weekDateRange}`

    console.log("weekApi", weekApi);




    const weekData = await axios.get(weekApi, {
      headers: {
        cookie: cookieStr
      }
    });

    console.log("weekData", weekData.data);



    let code = weekData.data.content.code;
    let data = weekData.data.content.data;

    if (code !== 0) {
      log.error("获取周数据失败", JSON.stringify(weekData.data));
      throw new Error("获取周数据失败");
    }

    //支付金额
    wanxiangtaiData.amount += "/" + data.subPayOrdAmt.value?.toFixed(2);

    //访客数
    wanxiangtaiData.visitor += "/" + data.uv.value;

    //支付子订单数
    wanxiangtaiData.order += "/" + data.payOrdCnt.value;

  } catch (e: any) {
    log.error("获取周数据失败");
    log.error(e.message);
    wanxiangtaiData.amount += "/获取失败";
    wanxiangtaiData.visitor += "/获取失败";
    wanxiangtaiData.order += "/获取失败";
  }

  //月数据 https://sycm.taobao.com/portal/home.htm?activeKey=operator&dateType=month
  try {

    const { firstDayOfLastMonth, lastDayOfLastMonth } = getFirstAndLastDayOfLastMonth()
    const monthDateRange = `${formatDate(firstDayOfLastMonth)}%7C${formatDate(lastDayOfLastMonth)}`

    const monthApi = `https://sycm.taobao.com/portal/coreIndex/getShopMainIndexes.json?dateType=month&dateRange=${monthDateRange}`
    const monthData = await axios.get(monthApi, {
      headers: {
        cookie: cookieStr
      }
    });

    console.log("monthApi", monthApi);


    console.log("monthData", monthData.data);

    let code = monthData.data.content.code;
    let data = monthData.data.content.data;

    if (code !== 0) {
      log.error("获取月数据失败", monthData.data);
      throw new Error("获取月数据失败");
    }

    //支付金额
    wanxiangtaiData.amount += "/" + data.subPayOrdAmt.value?.toFixed(2);

    //访客数
    wanxiangtaiData.visitor += "/" + data.uv.value;

    //支付子订单数
    wanxiangtaiData.order += "/" + data.payOrdCnt.value;


  } catch (e: any) {
    log.error("获取月数据失败");
    log.error(e.message);
    wanxiangtaiData.amount += "/获取失败";
    wanxiangtaiData.visitor += "/获取失败";
    wanxiangtaiData.order += "/获取失败";
  }

  console.log("wanxiangtaiData", wanxiangtaiData);


  return {
    shopsName: shopsName,
    shopsData: shopsData,
    wanxiangtaiData: wanxiangtaiData,
    otherIndicatorsData: otherIndicatorsData
  }
}

//获取商品数据
const getGoodsData = async (browserParam: any) => {
  let goodsPage = await browserParam.newPage();

  await goodsPage.setRequestInterception(true);
  goodsPage.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['', 'font', 'image', 'media'].includes(resourceType)) {
      request.abort(); // 阻止加载样式和其他静态资源
    } else {
      request.continue();
    }
  });

  goodsPage.goto("https://myseller.taobao.com/home.htm/SellManage/all?current=1&pageSize=1");


  let goodsData: any;
  let selling: any;
  let warehouse: any;

  try {
    //等待页面加载完成
    await goodsPage.waitForNavigation();


    //等待 .next-tabs-nav 加载完毕
    await goodsPage.waitForSelector(".next-tabs-nav");
    goodsData = await goodsPage.evaluate(() => {

      let navList = document.querySelector(".next-tabs-nav")?.children as any;

      return {
        //出售中
        selling: navList[1].innerText,
        //仓库中
        warehouse: navList[2].innerText,
      }
    });

    //将selling和warehouse中的数字正则匹配出来
    selling = goodsData.selling.match(/\d+/g);
    warehouse = goodsData.warehouse.match(/\d+/g);
  } catch (e: any) {
    log.error("获取商品数据失败");
    log.error(e.message);

    goodsData = {
      selling: "获取失败",
      warehouse: "获取失败"
    }
  }



  return {
    selling: selling[0],
    warehouse: warehouse[0]
  }
}

const getGoodsDataByApi = async (browserParam: any, username: any) => {
  let loginInfo = accountLoginInfoMap.get(username);
  let cookieStr = ""
  let api = ""
  let currTimeStamp = new Date().getTime();
  let goodsData = {
    selling: "",
    warehouse: ""
  }
  try {

    if (loginInfo.goodsParam && currTimeStamp - loginInfo.goodsParam.timestamp < 2 * 60 * 60 * 1000) {
      cookieStr = loginInfo.goodsParam.cookieStr;
      api = loginInfo.goodsParam.api;
    } else {

      let page = await browserParam.newPage();
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font', 'image', 'media'].includes(resourceType)) {
          request.abort(); // 阻止加载样式和其他静态资源
        } else {
          request.continue();
        }
      });

      page.goto("https://myseller.taobao.com/home.htm/SellManage/all?current=1&pageSize=1");


      const targetResponse = await page.waitForResponse(response => {
        return response.url().includes("https://h5api.m.taobao.com/h5/mtop.taobao.sell.pc.manage.async/1.0/") && response.status() === 200;
      });

      //通过aggregateBalancePage 拿到页面的cookie
      const cookies = await page.cookies();

      //将cookie组合成字符串
      cookieStr = cookies.map((item: any) => {
        return item.name + "=" + item.value;
      }).join(";");

      api = targetResponse.url();

      let goodsParam = {
        cookieStr: cookieStr,
        api: api,
        timestamp: currTimeStamp
      }

      loginInfo.goodsParam = goodsParam;
    }

    let res = await fetch(api, {
      "headers": {
        "accept": "application/json",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "cookie": cookieStr,
        "Referer": "https://myseller.taobao.com/home.htm/SellManage/all?current=1&pageSize=1",
        "Referrer-Policy": "no-referrer-when-downgrade"
      },
      "body": "data=%7B%22url%22%3A%22%2Ftaobao%2Fmanager%2Fasync.htm%3FoptType%3DqueryTabNum%22%2C%22jsonBody%22%3A%22%7B%5C%22tab%5C%22%3A%5C%22all%5C%22%7D%22%7D",
      "method": "POST"
    });

    let goodsDataRes = await res.json();

    console.log("goodsDataRes", goodsDataRes);

    /**
     {
  api: 'mtop.taobao.sell.pc.manage.async',
  data: {
    result: '{"success":true,"traceId":"215042ba17345240171186589ed6d9","data":{"all":498,"on_sale":495,"in_stock":3,"draft":10,"rubbish":0,"failed":1,"unsalable":0,"history":0},"msg":{"globalMessage":{"type":"success"}}}'
  },
  ret: [ 'SUCCESS::调用成功' ],
  v: '1.0'
}
     */


    let code = goodsDataRes.ret[0];
    let data = JSON.parse(goodsDataRes.data.result).data;

    if (code !== "SUCCESS::调用成功") {
      throw new Error("获取商品数据失败" + JSON.stringify(goodsDataRes));
    }

    goodsData = {
      selling: data.on_sale,
      warehouse: data.in_stock
    }


  } catch (e: any) {
    log.error("获取库存信息失败", e.message);

    goodsData = {
      selling: "获取失败",
      warehouse: "获取失败"
    }
  }

  return goodsData;
}

//获取保证金数据
const getDepositData = async (browserParam: any) => {
  //https://qn.taobao.com/home.htm/deposit 保证金页面
  let depositPage = await browserParam.newPage();

  // await depositPage.setRequestInterception(true);
  // depositPage.on('request', (request) => {
  //   const resourceType = request.resourceType();
  //   if (['font', 'image', 'media'].includes(resourceType)) {
  //     request.abort(); // 阻止加载样式和其他静态资源
  //   } else {
  //     request.continue();
  //   }
  // });

  depositPage.goto("https://jibu.taobao.com/?nolayout=true#/home");



  let depositData;
  let margin = ""
  let riskMargin = ""
  let needToPayMargin = ""
  let transaction = ""

  try {
    //等待页面加载完成
    await depositPage.waitForNavigation();


    //等待.detail-btn元素加载完毕
    await depositPage.waitForSelector(".quota-header-box button");

    //点击
    await depositPage.click(".quota-header-box button");


    //等待0.5s
    await await new Promise((resolve) => setTimeout(resolve, 500));
    depositData = await depositPage.evaluate(() => {
      let depositEleList = document.querySelectorAll(".label-amount-detail") as any;

      let depositDataList: any = [];
      depositEleList.forEach((item: any) => {
        depositDataList.push(item.innerText);
      });

      return depositDataList;
    });

    /**
   *  
[
  '保证金可用余额\n500.00\n元\n明细',
  '冻结金额\n0.00\n元\n冻结明细',
  '待补缴金额\n0.00\n元',
  '近30天成交较高类目\n住宅家具',
  '近30天成交金额\n20,689.10\n元',
  '保证金额度\n500.00\n元\n额度说明',
  '保证金额度\n500.00',
  '基础额度\n500.00',
  '风险额度\n0.00',
  '特殊额度\n0.00'
]
   */



    for (let i = 0; i < depositData.length; i++) {
      let item = depositData[i];
      //将,去掉
      item = item.replaceAll(/,/g, "");

      if (item.includes("保证金可用余额")) {
        //正则出所有数字
        margin = item.match(/(\d+\.\d+|\d+)/)[0]
      }

      if (item.includes("风险")) {
        riskMargin = item.match(/(\d+\.\d+|\d+)/)[0]
      }

      if (item.includes("待补缴")) {
        needToPayMargin = item.match(/(\d+\.\d+|\d+)/)[0]
      }

      if (item.includes("近30天成交金额")) {
        item = item.replace("近30天成交金额", "");
        transaction = item.match(/(\d+\.\d+|\d+)/)[0]
      }
    }

  } catch (e: any) {
    log.error("获取保证金数据失败");
    log.error(e.message);


    depositData = [];
    margin = "获取失败";
    riskMargin = "获取失败";
    needToPayMargin = "获取失败";
    transaction = "获取失败";
  }


  return {
    margin: margin,
    riskMargin: riskMargin,
    needToPayMargin: needToPayMargin,
    transaction: transaction
  }


}

const getDepositDataByApi = async (browserParam: any, username: any) => {

  let loginInfo = accountLoginInfoMap.get(username);
  let cookieStr = ""
  let api = ""
  let currTimeStamp = new Date().getTime();
  let margin: any = ""
  let riskMargin: any = ""
  let needToPayMargin: any = ""
  let transaction: any = ""



  try {
    if (loginInfo.depositParam && currTimeStamp - loginInfo.depositParam.timestamp < 2 * 60 * 60 * 1000) {
      cookieStr = loginInfo.depositParam.cookieStr;
      api = loginInfo.depositParam.api;
    } else {
      let depositPage = await browserParam.newPage();
      await depositPage.setRequestInterception(true);
      depositPage.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font', 'image', 'media'].includes(resourceType)) {
          request.abort(); // 阻止加载样式和其他静态资源
        } else {
          request.continue();
        }
      });

      depositPage.goto("https://jibu.taobao.com/?nolayout=true#/home");

      const targetResponse = await depositPage.waitForResponse(response => {
        return response.url().includes("https://acs.m.taobao.com/h5/mtop.alibaba.jibu.quotainfo.get/1.0/") && response.status() === 200;
      });


      //通过depositPage 拿到页面的cookie
      const cookies = await depositPage.cookies();

      //将cookie组合成字符串
      cookieStr = cookies.map((item: any) => {
        return item.name + "=" + item.value;
      }).join(";");

      api = targetResponse.url();

      let depositParam = {
        cookieStr: cookieStr,
        api: api,
        timestamp: currTimeStamp
      }

      loginInfo.depositParam = depositParam;
    }

    console.log("CookieStr", cookieStr);
    console.log("Api", api);

    //获取保证金数据
    const depositDataRes = await axios.get(api, {
      headers: {
        cookie: cookieStr,
        "Channel": "web"
      }
    });




    let code = depositDataRes.data.ret[0];
    let data = depositDataRes.data.data.model;

    if (!code.includes("SUCCESS")) {
      log.error("获取保证金失败", depositDataRes.data);
      throw new Error("获取保证金失败");
    }

    margin = data.basicTotalAmount || 0;
    riskMargin = data.riskTotalAmount || 0;
    needToPayMargin = data.specialTotalAmount || 0;
    transaction = data.basicDetailInfoDTO.amountDetailExplainList[0].componentExplainInfo.gmv30d || 0;

    if (margin > 0) {
      margin = ((margin / 100) + (riskMargin / 100)).toFixed(2);
    }

    if (riskMargin > 0) {
      riskMargin = (riskMargin / 100).toFixed(2);
    }

    if (needToPayMargin > 0) {
      needToPayMargin = (needToPayMargin / 100).toFixed(2);
    }

    if (transaction > 0) {
      transaction = (transaction / 100).toFixed(2);
    }

  } catch (e: any) {
    log.error("获取保证金失败", e.message);
    margin = "获取失败";
    riskMargin = "获取失败";
    needToPayMargin = "获取失败";
    transaction = "获取失败";
  }

  return {
    margin: margin,
    riskMargin: riskMargin,
    needToPayMargin: needToPayMargin,
    transaction: transaction
  }

}

//获取聚合账户余额
const getAggregateBalanceData = async (browserParam: any) => {
  let start = new Date().getTime()
  let aggregateBalancePage = await browserParam.newPage();


  await aggregateBalancePage.setRequestInterception(true);
  aggregateBalancePage.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['', 'font', 'image', 'media'].includes(resourceType)) {
      request.abort(); // 阻止加载样式和其他静态资源
    } else {
      request.continue();
    }
  });
  aggregateBalancePage.goto("https://myseller.taobao.com/home.htm/whale-accountant/pay/capital/home");


  let data;

  try {
    //等待页面加载完成
    await aggregateBalancePage.waitForNavigation();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    //.driver-close-btn 如果页面上有这个元素就点击
    await aggregateBalancePage.evaluate(() => {
      let ele = document.querySelector(".driver-close-btn") as any;
      ele?.click();
    });

    //等待.next-row元素加载完毕
    await aggregateBalancePage.waitForSelector(".next-row");
    data = await aggregateBalancePage.evaluate(() => {
      let ele = document.querySelector('#icestarkNode [class*="BalanceCommon_contentValue-large"]') as any;
      return ele?.innerText || "获取失败";
    });
  } catch (e: any) {
    log.error("获取聚合账户余额失败");
    log.error(e.message);

    data = "获取失败";

  }


  let end = new Date().getTime();

  console.log("耗时：", end - start);
  return data;

}

const getAggregateBalanceDataByApi = async (browserParam: any, username: any) => {

  let loginInfo = accountLoginInfoMap.get(username);
  let cookieStr = ""
  let api = ""
  let currTimeStamp = new Date().getTime();
  let aggregateBalance = ""
  try {

    if (loginInfo.aggregateBalanceParam && currTimeStamp - loginInfo.aggregateBalanceParam.timestamp < 2 * 60 * 60 * 1000) {
      cookieStr = loginInfo.aggregateBalanceParam.cookieStr;
      api = loginInfo.aggregateBalanceParam.api;
    } else {

      let aggregateBalancePage = await browserParam.newPage();


      await aggregateBalancePage.setRequestInterception(true);
      aggregateBalancePage.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font', 'image', 'media'].includes(resourceType)) {
          request.abort(); // 阻止加载样式和其他静态资源
        } else {
          request.continue();
        }
      });

      aggregateBalancePage.goto("https://myseller.taobao.com/home.htm/whale-accountant/pay/capital/home");


      const targetResponse = await aggregateBalancePage.waitForResponse(response => {
        return response.url().includes("AGGREGATED") && response.status() === 200;
      });

      //通过aggregateBalancePage 拿到页面的cookie
      const cookies = await aggregateBalancePage.cookies();

      //将cookie组合成字符串
      cookieStr = cookies.map((item: any) => {
        return item.name + "=" + item.value;
      }).join(";");

      api = targetResponse.url();

      let aggregateBalanceParam = {
        cookieStr: cookieStr,
        api: api,
        timestamp: currTimeStamp
      }

      loginInfo.aggregateBalanceParam = aggregateBalanceParam;
    }

    //获取聚合账户余额
    let aggregateBalanceDataRes = await axios.get(api, {
      headers: {
        cookie: cookieStr
      }
    });

    aggregateBalanceDataRes = aggregateBalanceDataRes.data;

    let regex = /\((.*?)\)/;
    let match = aggregateBalanceDataRes.match(regex);

    if (!aggregateBalanceDataRes) {
      throw new Error(JSON.stringify(aggregateBalanceDataRes));
    }

    // 如果匹配成功，输出括号中的内容
    let jsonRes = JSON.parse(match[1]);

    if (!(jsonRes.ret + "".includes("SUCCESS"))) {
      throw new Error(JSON.stringify(aggregateBalanceDataRes));
    } else {
      aggregateBalance = jsonRes.data?.aggregatedAccount?.totalBalance
    }
  } catch (e: any) {
    log.error("获取聚合账户余额失败", e.message);
    aggregateBalance = "获取失败";
  }
  return aggregateBalance;
}

//测试多页面不同cookie
const testMultiPage = async (browserParam: any, requestParam: any) => {
  console.log("测试多页面不同cookie");
  try {

    let context = browserParam.createIncognitoBrowserContext()


    let page = await context.newPage();


    let username = requestParam.username;

    let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

    let dirName = requestParam.username.replace(":", "") + ".json";

    cookieDir = path.join(cookieDir, dirName);

    let cookies = JSON.parse(fs.readFileSync(cookieDir, "utf-8"));

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];

      try {
        await page.setCookie(cookie);
      } catch (e: any) {
        // console.log("设置cookie失败");
      }
    }

    page.goto("https://myseller.taobao.com/home.htm/whale-accountant/pay/capital/home");


  } catch (e: any) {
    console.log("错误", e.message);
  }



}

//获取店铺层级
const getShopLevelData = async (browserParam: any) => {
  let shopLevelPage = await browserParam.newPage();
  let shopLevel;
  try {
    //https://sycm.taobao.com/portal/home.htm 店铺层级
    shopLevelPage.goto("https://sycm.taobao.com/portal/home.htm");

    //等待页面加载完成
    await shopLevelPage.waitForNavigation();

    //等待.ebase-frame-header-text元素加载完毕
    await shopLevelPage.waitForSelector(".ebase-frame-header-text");

    await shopLevelPage.evaluate(() => {

      let ele = document.querySelector(".ebase-frame-header-text") as any;
      let text = ele?.innerText || "";

      if ("返回旧版" == text) {
        ele.click();
      }
    })

    //等待页面加载完成
    await shopLevelPage.waitForNavigation();

    //等待.detail元素加载完毕
    await shopLevelPage.waitForSelector(".detail");



    shopLevel = await shopLevelPage.evaluate(() => {
      let shopLevelEle = document.querySelector(".detail") as any;
      return shopLevelEle?.innerText || "获取失败"
    })

  } catch (e: any) {
    log.error("获取店铺层级失败");
    log.error(e.message);

    shopLevel = "获取失败";
  }

  return shopLevel;
}

//根据api获取店铺层级
const getShopLevelDataByApi = async (username: any) => {
  let cookieStr = accountLoginInfoMap.get(username).cookie || "";

  let api = "https://sycm.taobao.com/portal/coupon/show.json"

  let res = await axios.get(api, {
    headers: {
      "cookie": cookieStr
    }
  });

  /**
   {
  content: {
    code: 0,
    data: {
      currentCoupons: [Array],
      nextCoupons: [Array],
      cashCouponArticleItemCode: 'SERV_SQ_SYCM_SCHQBZB_6073',
      updateDate: '20241208',
      cateLevel1Name: '住宅家具',
      isHit: false,
      oldCateLevel1Id: '50008164',
      cateLevel1Id: '111119964350008164',
      cashCouponArticleCode: 'SERV_SQ_SYCM_SCHQBZB',
      layer: 3
    },
    message: '操作成功',
    traceId: '21363af517343535618104153e13d3'
  },
  hasError: false
}
   */

  let shopLevel;
  try {
    let code = res.data.content.code;

    if (code != 0) {
      log.error("获取店铺层级失败");
      log.error("响应信息：", res.data);

      return "获取失败";
    }

    shopLevel = res.data.content.data.layer;

  } catch (e: any) {
    log.error("获取店铺层级失败");
    log.error("响应信息：", res.data);
    log.error(e.message);

    shopLevel = "获取失败";
  }



  return shopLevel;

}

const initCookie = async (initCookiePage: any, requestParam: any) => {

  //恢复cookie
  let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

  if (!fs.existsSync(cookieDir)) {
    fs.mkdirSync(cookieDir);
  }

  let dirName = requestParam.username.replace(":", "") + ".json";

  //拼接上用户名
  cookieDir = path.join(cookieDir, dirName);

  //判断文件是否存在
  if (!fs.existsSync(cookieDir)) {
    log.error("cookie文件不存在");

    return false;
  }

  let cookies = JSON.parse(fs.readFileSync(cookieDir, "utf-8"));

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];

    try {
      await initCookiePage.setCookie(cookie);
    } catch (e: any) {
      // console.log("设置cookie失败");
    }
  }


  initCookiePage.goto("https://myseller.taobao.com/home.htm/bc-templates/");
  await initCookiePage.waitForNavigation();

  //拿到当前网址
  let currentUrl = initCookiePage.url();


  //如果包含loginmyseller
  if (currentUrl.includes("loginmyseller")) {
    return false;
  }

  return true;
}

const initCookieByApi = async (initCookiePage: any, username) => {

  let cookieStr = accountLoginInfoMap.get(username).cookie || "";

  if (!cookieStr) {
    return false;
  }


  let isLiginApi = `https://sycm.taobao.com/cem/enterprise/info.json`

  let isLoginRes = await axios.get(isLiginApi, {
    headers: {
      cookie: cookieStr
    }
  });

  /**
  成功: {
      "code": 0,
      "message": "",
      "traceId": "2166907917344089926483932e15c7"
    }
   */

  if (isLoginRes.data.code != 0) {
    return false;
  }

  //恢复cookie
  let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

  if (!fs.existsSync(cookieDir)) {
    fs.mkdirSync(cookieDir);
  }

  let dirName = username.replace(":", "") + ".json";

  //拼接上用户名
  cookieDir = path.join(cookieDir, dirName);

  //判断文件是否存在
  if (!fs.existsSync(cookieDir)) {
    log.error("cookie文件不存在");

    return false;
  }

  // let cookies = JSON.parse(fs.readFileSync(cookieDir, "utf-8"));

  // for (let i = 0; i < cookies.length; i++) {
  //   let cookie = cookies[i];

  //   try {
  //     await initCookiePage.setCookie(cookie);
  //   } catch (e: any) {
  //     // console.log("设置cookie失败");
  //   }
  // }

  return true;


}


const getStatisticsData = async (browserParam: any) => {
  //支付金额
  let payAmount = ""
  //成功退款金额
  let refund = ""
  //净支付金额
  let netAmount = ""

  //全站推广花费
  let promotionCost = ""

  //关键词推广花费
  let keywordCost = ""

  //精准人群推广花费
  let accurateAudienceCost = ""

  //智能场景花费
  let smartSceneCost = ""

  //淘宝客佣金
  let taobaoCommission = ""

  //店铺客户数
  let shopCustomerNumber = ""

  //支付转化率
  let statisticsConversionRate = ""

  //客单价
  let statisticsUnitPrice = ""

  //老客复购率
  let oldCustomerRepurchaseRate = ""

  //老客复购金额
  let oldCustomerRepurchaseAmount = ""

  //支付子订单数
  let paySubOrderNumber = ""

  //支付件数
  let payNumber = ""

  //访客数
  let visitorNumber = ""

  //浏览量
  let statisticsPageViews = ""

  //加购件数
  let statisticsAddToCartNumber = ""

  //加购人数
  let addToCartPeopleNumber = ""

  //收藏人数
  let collectionPeopleNumber = ""

  //咨询率
  let consultationRate = ""

  //成功退款率
  let refundRate = ""

  let page = await browserParam.newPage();
  page.goto("https://sycm.taobao.com/portal/home.htm?activeKey=service");
  // page.goto("https://sycm.taobao.com/portal/home.htm");



  try {
    //等待页面加载完成
    await page.waitForNavigation();

    //获取.oui-floor-nav-floor3元素
    await page.waitForSelector(".oui-floor-nav");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await page.evaluate(() => {
      window.scrollBy(0, 300);

      let ele = document.querySelector(".oui-floor-nav ul") as any;

      ele = ele?.childNodes[3]?.children[0]

      ele.click();
    });

    //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));

    //获取服务数据
    //等待.oui-index-cell-indexValue元素加载完毕
    await page.waitForSelector(".oui-index-cell-indexValue");



    let serviceData: any = await page.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;

    });


    for (let i = 0; i < serviceData.length; i++) {

      let item = serviceData[i];


      if (item.key.includes("咨询率")) {
        consultationRate = item.value;
      }

      if (item.key.includes("退款率")) {
        refundRate = item.value;
      }
    }


  } catch (e: any) {
    log.error("获取监控-服务数据失败");
    log.error(e.message);

    consultationRate = "获取失败";
    refundRate = "获取失败";
  }


  //获取运营数据
  page.goto("https://sycm.taobao.com/portal/home.htm");

  try {
    //等待页面加载完成
    await page.waitForNavigation();

    //等待oui-floor-nav-floor1元素加载完毕
    await page.waitForSelector(".oui-floor-nav-floor1");

    await new Promise((resolve) => setTimeout(resolve, 500));

    //点击 .oui-floor-nav-floor1
    await page.evaluate(() => {
      let ele = document.querySelector(".oui-floor-nav-floor1 a") as any;

      ele.click();
    });


    //等待 .next-tabs-nav 加载完毕
    await page.waitForSelector(".oui-index-cell");

    // //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let data1 = await page.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });

    //等待.index-page-arrow元素加载完毕
    await page.waitForSelector(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //点击
    await page.click(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let data2 = await page.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });

    //等待.index-page-arrow元素加载完毕
    await page.waitForSelector(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //点击第二个.index-page-arrow
    await page.click(".alife-one-design-sycm-indexes-trend-index-container .anticon-angle-right");

    //等待1s
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let data3 = await page.evaluate(() => {

      let eleList = document.querySelectorAll(".oui-index-cell-indexValue") as any;

      let data: any = [];

      for (let i = 0; i < eleList.length; i++) {
        let ele = eleList[i];
        let key = ele?.previousElementSibling.innerText || ""
        let value = ele?.innerText || ""
        data.push({
          key: key,
          value: value
        });
      }

      return data;
    });



    for (let i = 0; i < data1.length; i++) {
      let item = data1[i];

      if (item.key == "支付金额") {
        payAmount = item.value;
        netAmount = item.value;
      }

      if (item.key.includes("成功退款金额")) {
        refund = item.value;
      }

      if (item.key.includes("净支付金额")) {
        netAmount = item.value;
      }

      if (item.key.includes("全站推广花费")) {
        promotionCost = item.value;
      }

      if (item.key.includes("关键词推广花费")) {
        keywordCost = item.value;
      }

      if (item.key.includes("精准人群推广花费")) {
        accurateAudienceCost = item.value;
      }

      if (item.key.includes("智能场景花费")) {
        smartSceneCost = item.value;
      }

      if (item.key.includes("淘宝客佣金")) {
        taobaoCommission = item.value;
      }

      if (item.key.includes("支付转化率")) {
        statisticsConversionRate = item.value;
      }

      if (item.key.includes("客单价")) {
        statisticsUnitPrice = item.value;
      }

      if (item.key.includes("老客复购率")) {
        oldCustomerRepurchaseRate = item.value;
      }

      if (item.key.includes("老买家支付金额")) {
        oldCustomerRepurchaseAmount = item.value;
      }

      if (item.key.includes("支付子订单数")) {
        paySubOrderNumber = item.value;
      }

      if (item.key.includes("支付件数")) {
        payNumber = item.value;
      }

      if (item.key.includes("访客数")) {
        visitorNumber = item.value;
      }

      if (item.key.includes("浏览量")) {
        statisticsPageViews = item.value;
      }

      if (item.key.includes("加购件数")) {
        statisticsAddToCartNumber = item.value;
      }

      if (item.key.includes("加购人数")) {
        addToCartPeopleNumber = item.value;
      }

      if (item.key.includes("收藏人数")) {
        collectionPeopleNumber = item.value;
      }

      if (item.key.includes("咨询率")) {
        consultationRate = item.value;
      }

      if (item.key.includes("成功退款率")) {
        refundRate = item.value;
      }

    }

    for (let i = 0; i < data2.length; i++) {
      let item = data2[i];


      if (item.key.includes("成功退款金额")) {
        refund = item.value;
      }

      if (item.key.includes("净支付金额")) {
        netAmount = item.value;
      }

      if (item.key.includes("全站推广花费")) {
        promotionCost = item.value;
      }

      if (item.key.includes("关键词推广花费")) {
        keywordCost = item.value;
      }

      if (item.key.includes("精准人群推广花费")) {
        accurateAudienceCost = item.value;
      }

      if (item.key.includes("智能场景花费")) {
        smartSceneCost = item.value;
      }

      if (item.key.includes("淘宝客佣金")) {
        taobaoCommission = item.value;
      }

      if (item.key.includes("支付转化率")) {
        statisticsConversionRate = item.value;
      }

      if (item.key.includes("客单价")) {
        statisticsUnitPrice = item.value;
      }

      if (item.key.includes("老客复购率")) {
        oldCustomerRepurchaseRate = item.value;
      }

      if (item.key.includes("老买家支付金额")) {
        oldCustomerRepurchaseAmount = item.value;
      }

      if (item.key.includes("支付子订单数")) {
        paySubOrderNumber = item.value;
      }

      if (item.key.includes("支付件数")) {
        payNumber = item.value;
      }

      if (item.key.includes("访客数")) {
        visitorNumber = item.value;
      }

      if (item.key.includes("浏览量")) {
        statisticsPageViews = item.value;
      }

      if (item.key.includes("加购件数")) {
        statisticsAddToCartNumber = item.value;
      }

      if (item.key.includes("加购人数")) {
        addToCartPeopleNumber = item.value;
      }

      if (item.key.includes("收藏人数")) {
        collectionPeopleNumber = item.value;
      }

      if (item.key.includes("咨询率")) {
        consultationRate = item.value;
      }

      if (item.key.includes("成功退款率")) {
        refundRate = item.value;
      }

    }

    for (let i = 0; i < data3.length; i++) {
      let item = data3[i];

      if (item.key.includes("成功退款金额")) {
        refund = item.value;
      }

      if (item.key.includes("净支付金额")) {
        netAmount = item.value;
      }

      if (item.key.includes("全站推广花费")) {
        promotionCost = item.value;
      }

      if (item.key.includes("关键词推广花费")) {
        keywordCost = item.value;
      }

      if (item.key.includes("精准人群推广花费")) {
        accurateAudienceCost = item.value;
      }

      if (item.key.includes("智能场景花费")) {
        smartSceneCost = item.value;
      }

      if (item.key.includes("淘宝客佣金")) {
        taobaoCommission = item.value;
      }

      if (item.key.includes("支付转化率")) {
        statisticsConversionRate = item.value;
      }

      if (item.key.includes("客单价")) {
        statisticsUnitPrice = item.value;
      }

      if (item.key.includes("老客复购率")) {
        oldCustomerRepurchaseRate = item.value;
      }

      if (item.key.includes("老买家支付金额")) {
        oldCustomerRepurchaseAmount = item.value;
      }

      if (item.key.includes("支付子订单数")) {
        paySubOrderNumber = item.value;
      }

      if (item.key.includes("支付件数")) {
        payNumber = item.value;
      }

      if (item.key.includes("访客数")) {
        visitorNumber = item.value;
      }

      if (item.key.includes("浏览量")) {
        statisticsPageViews = item.value;
      }

      if (item.key.includes("加购件数")) {
        statisticsAddToCartNumber = item.value;
      }

      if (item.key.includes("加购人数")) {
        addToCartPeopleNumber = item.value;
      }

      if (item.key.includes("收藏人数")) {
        collectionPeopleNumber = item.value;
      }

      if (item.key.includes("咨询率")) {
        consultationRate = item.value;
      }

      if (item.key.includes("成功退款率")) {
        refundRate = item.value;
      }

    }

  } catch (e: any) {
    log.error("获取监控-运营数据失败");
    log.error(e.message);
    payAmount = "获取失败";
    refund = "获取失败"
    netAmount = "获取失败";
    promotionCost = "获取失败";
    keywordCost = "获取失败";
    accurateAudienceCost = "获取失败";
    smartSceneCost = "获取失败";
    taobaoCommission = "获取失败";
    statisticsConversionRate = "获取失败";
    statisticsUnitPrice = "获取失败";
    oldCustomerRepurchaseRate = "获取失败";
    oldCustomerRepurchaseAmount = "获取失败";
    paySubOrderNumber = "获取失败";
    payNumber = "获取失败";
    visitorNumber = "获取失败";
    statisticsPageViews = "获取失败";
    statisticsAddToCartNumber = "获取失败";
    addToCartPeopleNumber = "获取失败";
    collectionPeopleNumber = "获取失败";
  }


  try {
    page.goto("https://sycm.taobao.com/cc/customer/overview");
    //等待页面加载完成
    await page.waitForNavigation();

    //等待.next-row元素加载完毕
    await page.waitForSelector(".index-value");

    //等待2s
    await new Promise((resolve) => setTimeout(resolve, 2000));

    shopCustomerNumber = await page.evaluate(() => {
      let ele = document.querySelector(".index-value") as any;
      return ele?.innerText || "获取失败";
    });

  } catch (e: any) {
    log.error("获取店铺客户数失败");
    log.error(e.message);


    shopCustomerNumber = "获取失败";
  }


  return {
    payAmount: payAmount,
    refund: refund,
    netAmount: netAmount,
    promotionCost: promotionCost,
    keywordCost: keywordCost,
    accurateAudienceCost: accurateAudienceCost,
    smartSceneCost: smartSceneCost,
    taobaoCommission: taobaoCommission,
    shopCustomerNumber: shopCustomerNumber,
    statisticsConversionRate: statisticsConversionRate,
    statisticsUnitPrice: statisticsUnitPrice,
    oldCustomerRepurchaseRate: oldCustomerRepurchaseRate,
    oldCustomerRepurchaseAmount: oldCustomerRepurchaseAmount,
    paySubOrderNumber: paySubOrderNumber,
    payNumber: payNumber,
    visitorNumber: visitorNumber,
    statisticsPageViews: statisticsPageViews,
    statisticsAddToCartNumber: statisticsAddToCartNumber,
    addToCartPeopleNumber: addToCartPeopleNumber,
    collectionPeopleNumber: collectionPeopleNumber,
    consultationRate: consultationRate,
    refundRate: refundRate
  }

}

//获取上个月月初和月末
const getFirstAndLastDayOfLastMonth = () => {
  // 当前时间
  const now = new Date();

  // 上个月的第一天
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // 上个月的最后一天
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // 设置日期为0，会自动调整为上个月最后一天

  return {
    firstDayOfLastMonth: firstDayOfLastMonth,
    lastDayOfLastMonth: lastDayOfLastMonth
  }
}

//获取上周周初和周末
const getFirstAndLastDayOfLastWeek = () => {
  const now = new Date();
  // 获取当前是本周的第几天（周日是0，周一是1，...，周六是6）
  const currentDay = now.getDay();

  // 如果以周一为第一天，调整偏移量（周一是0，周日是6）
  const offset = (currentDay === 0 ? 7 : currentDay) - 1;

  // 上周最后一天（上周日）
  const lastDayOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset - 1);

  // 上周第一天（上周一）
  const firstDayOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset - 7);

  return {
    firstDayOfLastWeek: firstDayOfLastWeek,
    lastDayOfLastWeek: lastDayOfLastWeek
  }
}

//获取昨天日期
const getYesterday = () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return yesterday;
}

const getStatisticsDataByApi = async (username: any) => {
  let cookieStr = accountLoginInfoMap.get(username).cookie || "";

  //获取当前月份


  const { firstDayOfLastMonth, lastDayOfLastMonth } = getFirstAndLastDayOfLastMonth();


  let t = new Date().getTime();

  let dateRange = formatDate(firstDayOfLastMonth) + "%7C" + formatDate(lastDayOfLastMonth);



  const { firstDayOfLastWeek, lastDayOfLastWeek } = getFirstAndLastDayOfLastWeek();

  const weekRange = formatDate(firstDayOfLastWeek) + "%7C" + formatDate(lastDayOfLastWeek);

  let monthApi = `https://sycm.taobao.com/portal/coreIndex/getShopMainIndexes.json?dateType=month&dateRange=${dateRange}&device=0&_=${t}`

  let weekApi = `https://sycm.taobao.com/portal/coreIndex/getShopMainIndexes.json?dateType=week&dateRange=${weekRange}&device=0&_=${t}`


  let monthData = await axios.get(monthApi, {
    headers: {
      "cookie": cookieStr
    }
  });

  let weekData = await axios.get(weekApi, {
    headers: {
      "cookie": cookieStr
    }
  });

  console.log("monthData", monthData.data);

  console.log("weekData", weekData.data);

  //支付金额
  let payAmount: any = ""
  //成功退款金额
  let refund: any = ""
  //净支付金额
  let netAmount: any = ""

  //全站推广花费
  let promotionCost: any = ""

  //关键词推广花费
  let keywordCost: any = ""

  //精准人群推广花费
  let accurateAudienceCost: any = ""

  //智能场景花费
  let smartSceneCost: any = ""

  //淘宝客佣金
  let taobaoCommission: any = ""

  //店铺客户数
  let shopCustomerNumber: any = ""

  //支付转化率
  let statisticsConversionRate: any = ""

  //客单价
  let statisticsUnitPrice: any = ""

  //老客复购率
  let oldCustomerRepurchaseRate: any = ""

  //老客复购金额
  let oldCustomerRepurchaseAmount: any = ""

  //支付子订单数
  let paySubOrderNumber: any = ""

  //支付件数
  let payNumber: any = ""

  //访客数
  let visitorNumber: any = ""

  //浏览量
  let statisticsPageViews: any = ""

  //加购件数
  let statisticsAddToCartNumber: any = ""

  //加购人数
  let addToCartPeopleNumber: any = ""

  //收藏人数
  let collectionPeopleNumber: any = ""

  //咨询率
  let consultationRate = ""

  //成功退款率
  let refundRate = ""

  //拿到昨天的日期
  let yesterday = getYesterday();


  let refundRateApi = ` https://sycm.taobao.com/qos/portal/service/refund/overview.json?dateType=day&dateRange=${formatDate(yesterday)}%7C${formatDate(yesterday)}`

  let refundRateData = await axios.get(refundRateApi, {
    headers: {
      "cookie": cookieStr
    }
  });

  /**
   {
  code: 0,
  data: {
    statDate: { value: 1734192000000 },
    rfdSucRate: { cycleCrc: 0.0126582278, syncCrc: 1.135021097, value: 0.00843882 },
    rfdSucAmt: { cycleCrc: null, syncCrc: null, value: 0 },
    rfdSucCnt: { cycleCrc: null, syncCrc: null, value: 0 }
  },
  message: '操作成功',
  traceId: '213ff4ec17343558608756058e14bd'
}
   */
  // console.log("refundRateData", refundRateData.data);

  let code = refundRateData.data.code;

  if (code != 0) {
    log.error("获取成功退款率失败");
    log.error("响应信息：", refundRateData.data);

    refundRate = "获取失败";
  } else {
    refundRate = (parseFloat(refundRateData.data.data.rfdSucRate.value) * 100).toFixed(2) + "%";
  }


  let consultationRateApi = `https://sycm.taobao.com/qos/portal/service/consulting/trend.json?dateType=week&dateRange=${weekRange}`

  let consultationRateData = await axios.get(consultationRateApi, {
    headers: {
      "cookie": cookieStr
    }
  });

  // console.log("consultationRateData", consultationRateData.data);
  /**
   * {
  code: 0,
  data: {
    uv: [
        0,   0,   0,   0,   0,   0,   0,   0,
        0,   0,   0,   0,  47, 101,  11,  50,
      145, 137, 205, 297, 250, 345, 457, 340
    ],
    statDate: [
      1720281600000, 1720886400000,
      1721491200000, 1722096000000,
      1722700800000, 1723305600000,
      1723910400000, 1724515200000,
      1725120000000, 1725724800000,
      1726329600000, 1726934400000,
      1727539200000, 1728144000000,
      1728748800000, 1729353600000,
      1729958400000, 1730563200000,
      1731168000000, 1731772800000,
      1732377600000, 1732982400000,
      1733587200000, 1734192000000
    ],
    consultingUv: [
      0, 0, 0, 0, 0,  0, 0, 0,
      0, 0, 0, 0, 0,  2, 0, 3,
      5, 5, 5, 3, 7, 13, 9, 7
    ],
    consultRate: [
               0,          0,          0,
               0,          0,          0,
               0,          0,          0,
               0,          0,          0,
               0, 0.01980198,          0,
            0.06, 0.03448276, 0.03649635,
      0.02439024, 0.01010101,      0.028,
      0.03768116, 0.01969365, 0.02058824
    ],
    onSubAccountCnt: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 3, 0, 1,
      1, 2, 1, 1, 2, 1, 1, 1
    ]
  },
  message: '操作成功',
  traceId: '2166e17417343558610441586e153d'
}

   */

  let consultationRateCode = consultationRateData.data.code;


  if (consultationRateCode != 0) {
    log.error("获取咨询率失败");
    log.error("响应信息：", consultationRateData.data);

    consultationRate = "获取失败";
  } else {
    let uv = consultationRateData.data.data.uv;
    let consultingUv = consultationRateData.data.data.consultingUv;

    let sumUv = uv.reduce((prev: any, cur: any) => {
      return prev + cur;
    });

    let sumConsultingUv = consultingUv.reduce((prev: any, cur: any) => {
      return prev + cur;
    });

    consultationRate = (sumConsultingUv / sumUv * 100).toFixed(2) + "%";
  }


  console.log("咨询率：", consultationRate);
  console.log("成功退款率：", refundRate);


  //获取运营数据

  // let operationDataApi = `https://sycm.taobao.com/portal/live/index/overview.json?sellerType=online`
  let operationDataApi = ` https://sycm.taobao.com/portal/coreIndex/getTableData.json?dateRange=${formatDate(yesterday)}%7C${formatDate(yesterday)}&dateType=day&indexCode=payAmt%2Cuv%2CpayRate%2CpayPct%2CrfdSucAmt%2CadmCostFamtQzt%2Cp4pExpendAmt%2CcubeAmt%2CadStrategyAmt%2CtkExpendAmt%2CpayByrCnt%2ColdRepeatByrRate%2CpayOldByrCnt%2ColderPayAmt%2CpayOrdCnt%2CpayItmCnt%2CcartByrCnt%2CcartItemCnt%2CcltItmCnt%2Cpv`
  let operationData = await axios.get(operationDataApi, {
    headers: {
      "cookie": cookieStr
    }
  });

  console.log("operationData", operationData.data);

  let operationDataCode = operationData.data?.content.code


  try {
    if (operationDataCode != 0) {
      //抛出异常
      throw new Error("获取运营数据失败");

    } else {
      let data = operationData.data.content.data

      if (data.length == 0) {
        throw new Error("获取运营数据失败");
      }

      data = data[data.length - 1];

      // 支付金额
      payAmount = data.payAmt?.value || 0.0;
      // 成功退款金额
      refund = data.rfdSucAmt?.value || 0.0;
      // 净支付金额
      netAmount = payAmount - refund

      // 全站推广花费
      promotionCost = data.adStrategyAmt?.value || 0.0;

      if (payAmount) {
        payAmount = payAmount.toFixed(2);
      }

      if (refund) {
        refund = refund.toFixed(2);
      }

      if (netAmount) {
        netAmount = netAmount.toFixed(2);
      }

      if (promotionCost) {
        promotionCost = promotionCost.toFixed(2);
      }

      // 关键词推广花费
      keywordCost = data.p4pExpendAmt?.value || 0.0;

      if (keywordCost) {
        keywordCost = keywordCost.toFixed(2);
      }

      // 精准人群推广花费
      accurateAudienceCost = data.cubeAmt?.value || 0.0;

      if (accurateAudienceCost) {
        accurateAudienceCost = accurateAudienceCost.toFixed(2);
      }

      // 智能场景花费
      smartSceneCost = data.admCostFamtQzt?.value || 0.0;

      if (smartSceneCost) {
        smartSceneCost = smartSceneCost.toFixed(2);
      }

      // 淘宝客佣金
      taobaoCommission = data.tkExpendAmt?.value || 0.0;

      if (taobaoCommission) {
        taobaoCommission = taobaoCommission.toFixed(2);
      }

      // 店铺客户数
      shopCustomerNumber = data.cartByrCnt?.value || 0;

      // 支付转化率
      statisticsConversionRate = data.payRate?.value || 0.0;

      //statisticsConversionRate四舍五入保留两位小数
      statisticsConversionRate = Math.round(statisticsConversionRate * 10000) / 100 + "%";

      // 客单价
      if (!data.payByrCnt?.value || data.payByrCnt?.value == 0) {
        statisticsUnitPrice = 0.0;
      } else {
        statisticsUnitPrice = payAmount / (data.payByrCnt?.value || 1);
      }

      // 老客复购率
      oldCustomerRepurchaseRate = data.oldRepeatByrRate?.value || 0.0;

      // 老客复购金额
      oldCustomerRepurchaseAmount = data.olderPayAmt?.value || 0.0;

      if (oldCustomerRepurchaseAmount) {
        oldCustomerRepurchaseAmount = oldCustomerRepurchaseAmount.toFixed(2);
      }

      // 支付子订单数
      paySubOrderNumber = data.payOrdCnt?.value || 0;

      // 支付件数
      payNumber = data.payItmCnt?.value || 0;

      // 访客数
      visitorNumber = data.uv?.value || 0;

      // 浏览量
      statisticsPageViews = data.pv?.value || 0;

      // 加购件数
      statisticsAddToCartNumber = data.cartItemCnt?.value || 0;

      // 加购人数
      addToCartPeopleNumber = data.cartByrCnt?.value || 0;

      // 收藏人数
      collectionPeopleNumber = data.cltItmCnt?.value || 0;


      console.log("获取完所有数据");

    }

  } catch (e: any) {
    log.error("获取运营数据失败");
    log.error("响应信息：", operationData.data);
    log.error(e.message);

    // payAmount = "获取失败";
    // refund = "获取失败"
    // netAmount = "获取失败";
    // promotionCost = "获取失败";
    // keywordCost = "获取失败";
    // accurateAudienceCost = "获取失败";
    // smartSceneCost = "获取失败";
    // taobaoCommission = "获取失败";
    // statisticsConversionRate = "获取失败";
    // statisticsUnitPrice = "获取失败";
    // oldCustomerRepurchaseRate = "获取失败";
    // oldCustomerRepurchaseAmount = "获取失败";
    // paySubOrderNumber = "获取失败";
    // payNumber = "获取失败";
    // visitorNumber = "获取失败";
    // statisticsPageViews = "获取失败";
    // statisticsAddToCartNumber = "获取失败";
    // addToCartPeopleNumber = "获取失败";
    // collectionPeopleNumber = "获取失败";

    if (!payAmount) {
      payAmount = "获取失败";
    }

    if (!refund) {
      refund = "获取失败";
    }

    if (!netAmount) {
      netAmount = "获取失败";
    }

    if (!promotionCost) {
      promotionCost = "获取失败";
    }

    if (!keywordCost) {
      keywordCost = "获取失败";
    }

    if (!accurateAudienceCost) {
      accurateAudienceCost = "获取失败";
    }

    if (!smartSceneCost) {
      smartSceneCost = "获取失败";
    }

    if (!taobaoCommission) {
      taobaoCommission = "获取失败";
    }

    if (!statisticsConversionRate) {
      statisticsConversionRate = "获取失败";
    }

    if (!statisticsUnitPrice) {
      statisticsUnitPrice = "获取失败";
    }

    if (!oldCustomerRepurchaseRate) {
      oldCustomerRepurchaseRate = "获取失败";
    }

    if (!oldCustomerRepurchaseAmount) {
      oldCustomerRepurchaseAmount = "获取失败";
    }

    if (!paySubOrderNumber) {
      paySubOrderNumber = "获取失败";
    }

    if (!payNumber) {
      payNumber = "获取失败";
    }

    if (!visitorNumber) {
      visitorNumber = "获取失败";
    }

    if (!statisticsPageViews) {
      statisticsPageViews = "获取失败";
    }

    if (!statisticsAddToCartNumber) {
      statisticsAddToCartNumber = "获取失败";
    }

    if (!addToCartPeopleNumber) {
      addToCartPeopleNumber = "获取失败";
    }

    if (!collectionPeopleNumber) {
      collectionPeopleNumber = "获取失败";
    }



  }

  console.log("payAmount", payAmount);
  console.log("refund", refund);
  console.log("netAmount", netAmount);
  console.log("promotionCost", promotionCost);



  return {
    payAmount: payAmount,
    refund: refund,
    netAmount: netAmount,
    promotionCost: promotionCost,
    keywordCost: keywordCost,
    accurateAudienceCost: accurateAudienceCost,
    smartSceneCost: smartSceneCost,
    taobaoCommission: taobaoCommission,
    shopCustomerNumber: shopCustomerNumber,
    statisticsConversionRate: statisticsConversionRate,
    statisticsUnitPrice: statisticsUnitPrice,
    oldCustomerRepurchaseRate: oldCustomerRepurchaseRate,
    oldCustomerRepurchaseAmount: oldCustomerRepurchaseAmount,
    paySubOrderNumber: paySubOrderNumber,
    payNumber: payNumber,
    visitorNumber: visitorNumber,
    statisticsPageViews: statisticsPageViews,
    statisticsAddToCartNumber: statisticsAddToCartNumber,
    addToCartPeopleNumber: addToCartPeopleNumber,
    collectionPeopleNumber: collectionPeopleNumber,
    consultationRate: consultationRate,
    refundRate: refundRate
  }

}

// 格式化为 YYYY-MM-DD 格式
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const loginSuccess = async (loginPage: any, requestParam: any, thit: any) => {
  //将浏览器最小化
  // thit.browserWindow?.minimize();
  try {

    //将软件窗口显示出来
    thit.browserWindow?.show();

    // let loginPage = await loginBrowser.newPage();

    //拦截静态文件
    // await loginPage.setRequestInterception(true);

    // loginPage.on("request", (request) => {
    //   const resourceType = request.resourceType();
    //   if (['font', 'image', 'media'].includes(resourceType)) {
    //     request.abort(); // 阻止加载样式和其他静态资源
    //   } else {
    //     request.continue();
    //   }
    // });

    //监听页面所有的请求
    // loginPage.on("request", (request) => {
    //   console.log("request.url()", request.url());
    // });

    // log.info("登录成功");

    //跳转到https://myseller.taobao.com/home.htm/tuiguangcenter_new/
    // await loginPage.goto("https://myseller.taobao.com/home.htm/tuiguangcenter_new/");

    //document.querySelectorAll("[class*='FirstClassMenu--navListWra']")[0].children[7].click()

    //等待.FirstClassMenu--navItem--Izq9hLb元素加载完毕
    // await loginPage.waitForSelector(".FirstClassMenu--navItem--Izq9hLb");

    // //点击推广中心
    // await loginPage.evaluate(() => {
    //   let ele = document.querySelectorAll("[class*='FirstClassMenu--navListWra']")[0].children[7] as any
    //   ele.click();
    // });

    // return

    //等待所有网络请求完成
    // await loginPage.waitForNetworkIdle();

    //等待页面加载完成
    // await loginPage.waitForNavigation();

    // let res = await loginPage.evaluate(() => {
    //   let ele = document.querySelector("#icestarkNode") as any;
    //   return ele?.innerText || "";
    // });

    // console.log("res", res);

    // if(res.includes("暂无权限")) {
    //   // throw new Error("暂无权限");
    // }

    //获取.document.querySelector("#icestarkNode").innerText

    // 等待特定的XHR请求完成
    // const targetResponse = await loginPage.waitForResponse(response => {
    //   return response.url().includes("https://1bp.taobao.com/report/query.json?") && response.status() === 200;
    // }, {
    //   timeout: 2 * 60 * 1000
    // });


    // console.log('目标XHR请求已完成', targetResponse.url());

    //https://1bp.taobao.com/report/query.json?csrfId=f738e3bf3b8aeb678ad72812a3f4253d_1_1_1&bizCode=universalBP

    //创建url对象 拿到csrfId
    // const url = new URL(targetResponse.url());

    //获取csrfId
    // const csrfId = url.searchParams.get("csrfId");

    //在appData目录下拿到qianniu-crawler-csrfId目录
    // let csrfIdDir = path.join(app.getPath("appData"), "qianniu-crawler-csrfId");

    // if (!fs.existsSync(csrfIdDir)) {
    //   fs.mkdirSync(csrfIdDir);
    // }

    //创建一个txt文件 保存csrfId
    // let csrfIdFile = requestParam.username.replace(":", "") + ".txt";

    //拼接路径
    // csrfIdDir = path.join(csrfIdDir, csrfIdFile);

    //写入文件
    // fs.writeFileSync(csrfIdDir, csrfId);


    //保存cookies
    const cookies = await loginPage.cookies();

    console.log(cookies);

    //过期时间为10天后
    let expires = Date.now() / 1000 + 10 * 24 * 60 * 60;

    //将.之后的去掉
    expires = Math.floor(expires);

    const persistentCookies = cookies.map(cookie => ({
      ...cookie,
      expires: expires
    }));

    let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

    if (!fs.existsSync(cookieDir)) {
      fs.mkdirSync(cookieDir);
    }

    let dirName = requestParam.username.replace(":", "") + ".json";

    //拼接上用户名
    cookieDir = path.join(cookieDir, dirName);

    //写入文件
    fs.writeFileSync(cookieDir, JSON.stringify(persistentCookies, null, 2));

    //将cookie组合成字符串
    let cookieStr = cookies.map((item: any) => {
      return item.name + "=" + item.value;
    }).join(";");

    console.log(cookieStr);


    accountLoginInfoMap.set(requestParam.username, {
      username: requestParam.username,
      cookie: cookieStr,
      // csrfId: csrfId,
      status: "waitInit"
    });

    thit.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);

    //关闭当前所有页面
    try {
      let pages = await loginPage.browser().pages();

      //等待1s
      await new Promise((resolve) => setTimeout(resolve, 500));
      pages.forEach(async (item: any) => {
        await item.close();
      });
    } catch (e: any) {
      log.error("自动关闭失败", e);
    }
  } catch (e: any) {
    //删除cookie文件
    let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");
    let dirName = requestParam.username.replace(":", "") + ".json";
    cookieDir = path.join(cookieDir, dirName);

    if (fs.existsSync(cookieDir)) {
      fs.unlinkSync(cookieDir);
    }

    //删除csrfId文件
    let csrfIdDir = path.join(app.getPath("appData"), "qianniu-crawler-csrfId");
    let csrfIdFile = requestParam.username.replace(":", "") + ".txt";
    csrfIdDir = path.join(csrfIdDir, csrfIdFile);

    if (fs.existsSync(csrfIdDir)) {
      fs.unlinkSync(csrfIdDir);
    }

    //发送 登录失败
    thit.browserWindow?.webContents.send("login-fail", requestParam.username);
  }

}

// 捕获全局的 uncaughtException 错误
process.on('uncaughtException', (error) => {
  // console.error('捕获到未处理的错误:', error);
  // 可以选择在这里处理错误，比如日志记录，或者显示自定义错误信息
  // 但防止默认弹框：
  // 阻止 Electron 默认的错误弹框显示
  // 注意：在生产环境中，最好不要继续抛出异常，避免导致应用崩溃
  // 可以选择退出或记录错误
  // app.exit(1); // 可以退出应用
  log.error("捕获到未处理的错误:", error);

});

process.on('unhandledRejection', (reason, promise) => {

  log.error("捕获到未处理的错误:", reason);

});

//通过api获取运维数据
const getOperationDataByApi = async (browserParam: any, username: any) => {
  //使用axios发送请求 
  let loginInfo = accountLoginInfoMap.get(username);
  let cookieStr = ""
  let api = ""
  let currTimeStamp = new Date().getTime();
  let operationData: any = {
    toBeDelivered: 0,
    toBePaid: 0,
    toBeComplaint: 0,
    toBeAfterSale: 0,
    toBeEvaluated: 0
  }
  try {

    if (loginInfo.operationParam && currTimeStamp - loginInfo.operationParam.timestamp < 2 * 60 * 60 * 1000) {
      cookieStr = loginInfo.operationParam.cookieStr;
      api = loginInfo.operationParam.api;
    } else {
      let page = await browserParam.newPage();
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font', 'image', 'media'].includes(resourceType)) {
          request.abort(); // 阻止加载样式和其他静态资源
        } else {
          request.continue();
        }
      });

      page.goto("https://myseller.taobao.com/home.htm/QnworkbenchHome/");

      const targetResponse = await page.waitForResponse(response => {
        return response.url().includes("https://h5api.m.taobao.com/h5/mtop.taobao.qianniu.number.get.v2/1.0") && response.status() === 200;
      });


      const cookies = await page.cookies();

      //将cookie组合成字符串
      cookieStr = cookies.map((item: any) => {
        return item.name + "=" + item.value;
      }).join(";");

      api = targetResponse.url();

      let operationParam = {
        cookieStr: cookieStr,
        api: api,
        timestamp: currTimeStamp
      }

      loginInfo.operationParam = operationParam;
    }
    //在请求头配置Cookie 并发送get请求
    let response = await axios.get(api, {
      headers: {
        'Cookie': cookieStr
      }
    });

    console.log("运维数据:", response.data);

    response = response.data + ""

    let regex = /\((.*?)\)/;
    let match = response.match(regex);

    // if (!response) {
    //   throw new Error(JSON.parse(response));
    // }

    let jsonRes = JSON.parse(match[1]);

    // if (!(jsonRes.ret + "".includes("SUCCESS"))) {
    //   throw new Error(JSON.stringify(response));
    // }

    let data = jsonRes.data?.result || {};

    console.log("解析后的运维数据：", data);

    //待付款
    operationData.toBePaid = data.waitForBuyerPay || 0;

    //待发货
    operationData.toBeDelivered = data.waitForSellerSendGoods || 0;

    //待投诉
    operationData.toBeComplaint = data.complainedCount || 0;

    //售后
    operationData.toBeAfterSale = data.refundNum || 0;

    //待评价
    operationData.toBeEvaluated = data.waitForRated || 0;

  } catch (e: any) {
    log.error("获取运维数据失败");
    log.error(e.message);
    operationData = {
      toBeDelivered: "获取失败",
      toBePaid: "获取失败",
      toBeComplaint: "获取失败",
      toBeAfterSale: "获取失败",
      toBeEvaluated: "获取失败"
    }
  }

  return operationData;
}

//根据api获取店铺数据
const getShopDataByApi = async (username: any) => {

  //启动一个浏览器
  let browser = await puppeteer.launch({
    headless: !systemConfig.isShowBrowser,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',  // 禁用浏览器的自动化标识
    ],
    executablePath: systemConfig.defaultChromePath
  });


  let api = 'https://h5api.m.taobao.com/h5/mtop.taobao.jdy.resource.shop.info.get/1.0/?' + shopDataApiParam;
  let loginInfo = accountLoginInfoMap.get(username);

  if (!loginInfo) {
    console.log("登录信息不存在");
    return {}
  }

  let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

  let dirName = username.replace(":", "") + ".json";

  //拼接上用户名
  cookieDir = path.join(cookieDir, dirName);

  //判断文件是否存在
  if (!fs.existsSync(cookieDir)) {
    log.error("cookie文件不存在");
    return {}
  }

  let cookies = JSON.parse(fs.readFileSync(cookieDir, "utf-8"));

  let cookieStr = cookies.map((item: any) => {
    return item.name + "=" + item.value;
  }).join(";");

  console.log(cookieStr);

  console.log("api:", api);






  //使用axios发送请求
  // let response = await axios.get(api, {
  //   headers: {
  //     'Cookie': cookie
  //   }
  // });

  // console.log("response:", response.data);
}

//是否正在执行
// let isRunning = false;
// let currentUsername = "";

const initSign = async (browserWindow: any) => {

  // if (isRunning) {
  //   console.log("正在初始化：" + currentUsername);
  //   return
  // }

  if (await currentOpenBrowserNumber.getValue() >= systemConfig.maxOpenBrowserNumber) {
    console.log(currentOpenBrowserNumber.getValue());

    log.info("当前打开的浏览器数量已经达到最大值");
    return;
  }

  try {
    //拿到所有的key
    let keys: any = accountLoginInfoMap.keys();

    if (keys.length == 0) {
      log.info("没有需要初始化的账号");
      return;
    }

    for (let key of keys) {
      let loginInfo = accountLoginInfoMap.get(key);


      if (loginInfo.status == "waitInit") {
        // isRunning = true;
        loginInfo.status = "initing";
        await currentOpenBrowserNumber.increment();
        console.log("初始化中：" + key);


        let browser
        try {
          let userDataDir = path.join(app.getPath("appData"), "qianniu-crawler");
          let userDataDirName = key.replace(":", "");
          userDataDir = path.join(userDataDir, userDataDirName);
          browserWindow.webContents.send("get-login-info", accountLoginInfoMap);
          // currentUsername = key;

          browser = await puppeteer.launch({
            headless: !systemConfig.isShowBrowser,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-blink-features=AutomationControlled',  // 禁用浏览器的自动化标识
            ],
            executablePath: systemConfig.defaultChromePath,
          });

          let page = await browser.newPage();

          //删除页面上的所有cookie
          // await page.deleteCookie();

          let loginInfo = accountLoginInfoMap.get(key);
          //恢复cookie
          let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

          if (!fs.existsSync(cookieDir)) {
            fs.mkdirSync(cookieDir);
          }

          let dirName = key.replace(":", "") + ".json";

          //拼接上用户名
          cookieDir = path.join(cookieDir, dirName);

          let baseCookies = JSON.parse(fs.readFileSync(cookieDir, "utf-8"));

          for (let i = 0; i < baseCookies.length; i++) {
            let cookie = baseCookies[i];

            try {
              await page.setCookie(cookie);
            } catch (e: any) {
              // console.log("设置cookie失败");
            }
          }

          try {
            await initDepositSign(browser, key);
          } catch (e: any) {
          }
          try {
            await initOperationSign(browser, key);
          } catch (e: any) {
            console.log("初始化运维数据失败");
            console.log(e);
          }
          try {
            await initGoodsSign(browser, key);
          } catch (e: any) {
          }
          try {
            await initAggregateBalanceSign(browser, key);
          } catch (e: any) {
          }

          try {
            await initCsrfId(browser, key);
          } catch (e: any) {
          }


          loginInfo.status = "success";
          loginInfo.loginTime = new Date().getTime();

          console.log("初始化成功");
          console.log(loginInfo);


        } catch (e: any) {
          log.error("初始化失败");
          log.error(e);
          //删除loginInfo
          accountLoginInfoMap.delete(key);
        } finally {
          // currentUsername = "";
          // isRunning = false;
          //发送初始化完成
          browserWindow.webContents.send("get-login-info", accountLoginInfoMap);

          await currentOpenBrowserNumber.decrement();

          if (browser) {
            setTimeout(() => {
              browser.close();
            }, 3000)
          }

        }

        break
      }
    }


  } catch (e: any) {
    log.error("初始化失败");
    log.error(e.message);
  }

}

const initOperationSign = async (browserParam: any, username) => {
  let loginInfo = accountLoginInfoMap.get(username);
  let currTimeStamp = new Date().getTime();
  let page = await browserParam.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['font', 'image', 'media'].includes(resourceType)) {
      request.abort(); // 阻止加载样式和其他静态资源
    } else {
      request.continue();
    }
  });

  page.goto("https://myseller.taobao.com/home.htm/QnworkbenchHome/");

  const targetResponse = await page.waitForResponse(response => {
    return response.url().includes("https://h5api.m.taobao.com/h5/mtop.taobao.qianniu.number.get.v2/1.0") && response.status() === 200;
  });

  const cookies = await page.cookies();

  //将cookie组合成字符串
  let cookieStr = cookies.map((item: any) => {
    return item.name + "=" + item.value;
  }).join(";");

  let api = targetResponse.url();

  loginInfo.operationParam = {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }

  try {
    await page.deleteCookie();
    setTimeout(async () => {
      page.close();
    }
      , 3500);
  } catch (e: any) {
    log.error("关闭页面失败", e);
  }

  return {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }
}

const initDepositSign = async (browserParam: any, username) => {
  let currTimeStamp = new Date().getTime();
  let depositPage = await browserParam.newPage();
  // await depositPage.setRequestInterception(true);
  // depositPage.on('request', (request) => {
  //   const resourceType = request.resourceType();
  //   if (['font', 'image', 'media'].includes(resourceType)) {
  //     request.abort(); // 阻止加载样式和其他静态资源
  //   } else {
  //     request.continue();
  //   }
  // });

  depositPage.goto("https://jibu.taobao.com/?nolayout=true#/home");

  const targetResponse = await depositPage.waitForResponse(response => {
    return response.url().includes("https://acs.m.taobao.com/h5/mtop.alibaba.jibu.quotainfo.get/1.0/") && response.status() === 200;
  }, {
    timeout: 0.5 * 60 * 1000
  });


  //通过depositPage 拿到页面的cookie
  const cookies = await depositPage.cookies();

  //将cookie组合成字符串
  let cookieStr = cookies.map((item: any) => {
    return item.name + "=" + item.value;
  }).join(";");

  let api = targetResponse.url();

  let loginInfo = accountLoginInfoMap.get(username);

  loginInfo.depositParam = {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }

  // try {
  //   await depositPage.deleteCookie();
  //   setTimeout(async () => {
  //     depositPage.close();
  //   }, 3500);
  // } catch (e: any) {
  //   log.error("关闭页面失败", e);
  // }

  return {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }
}

const initAggregateBalanceSign = async (browserParam: any, username) => {
  let currTimeStamp = new Date().getTime();
  let aggregateBalancePage = await browserParam.newPage();


  // await aggregateBalancePage.setRequestInterception(true);
  // aggregateBalancePage.on('request', (request) => {
  //   const resourceType = request.resourceType();
  //   if (['font', 'image', 'media'].includes(resourceType)) {
  //     request.abort(); // 阻止加载样式和其他静态资源
  //   } else {
  //     request.continue();
  //   }
  // });

  aggregateBalancePage.goto("https://myseller.taobao.com/home.htm/whale-accountant/pay/capital/home");


  const targetResponse = await aggregateBalancePage.waitForResponse(response => {
    return response.url().includes("AGGREGATED") && response.status() === 200;
  });

  //通过aggregateBalancePage 拿到页面的cookie
  const cookies = await aggregateBalancePage.cookies();

  //将cookie组合成字符串
  let cookieStr = cookies.map((item: any) => {
    return item.name + "=" + item.value;
  }).join(";");

  let api = targetResponse.url();

  let loginInfo = accountLoginInfoMap.get(username);

  loginInfo.aggregateBalanceParam = {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }

  // try {
  //   await aggregateBalancePage.deleteCookie();
  //   setTimeout(async () => {
  //     await aggregateBalancePage.close();
  //   }, 3500);
  // } catch (e: any) {
  //   log.error("关闭页面失败", e);
  // }

  return {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }
}

const initGoodsSign = async (browserParam: any, username) => {
  let currTimeStamp = new Date().getTime();
  let page = await browserParam.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['font', 'image', 'media'].includes(resourceType)) {
      request.abort(); // 阻止加载样式和其他静态资源
    } else {
      request.continue();
    }
  });

  page.goto("https://myseller.taobao.com/home.htm/SellManage/all?current=1&pageSize=1");


  const targetResponse = await page.waitForResponse(response => {
    return response.url().includes("https://h5api.m.taobao.com/h5/mtop.taobao.sell.pc.manage.async/1.0/") && response.status() === 200;
  });

  //通过aggregateBalancePage 拿到页面的cookie
  const cookies = await page.cookies();

  //将cookie组合成字符串
  let cookieStr = cookies.map((item: any) => {
    return item.name + "=" + item.value;
  }).join(";");

  let api = targetResponse.url();

  let loginInfo = accountLoginInfoMap.get(username);

  loginInfo.goodsParam = {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }

  // try {
  //   await page.deleteCookie();
  //   setTimeout(async () => {
  //     await page.close();
  //   }, 3500);
  // } catch (e: any) {
  //   log.error("关闭页面失败", e);
  // }

  return {
    cookieStr: cookieStr,
    api: api,
    timestamp: currTimeStamp
  }
}

const initCsrfId = async (browserParam: any, username: any) => {

  let loginInfo = accountLoginInfoMap.get(username);


  let csrfIdDir = path.join(app.getPath("appData"), "qianniu-crawler-csrfId");

  if (!fs.existsSync(csrfIdDir)) {
    fs.mkdirSync(csrfIdDir);
  }

  let csrfIdDirName = username.replace(":", "") + ".txt";

  csrfIdDir = path.join(csrfIdDir, csrfIdDirName);

  //如果文件存在
  if (fs.existsSync(csrfIdDir)) {
    let csrfId = fs.readFileSync(csrfIdDir, "utf-8");
    loginInfo.csrfId = csrfId;
    return csrfId
  }

  console.log(username, "开始获取csrfId");


  let page = await browserParam.newPage();

  //拦截静态文件
  // await page.setRequestInterception(true);


  page.on('request', (request) => {
    // const resourceType = request.resourceType();
    // if (['font', 'image', 'media'].includes(resourceType)) {
    //   request.abort(); // 阻止加载样式和其他静态资源
    // } else {
    //   request.continue();
    // }

    // let targetUrl = request.url();
    // console.log("targetUrl", targetUrl);


    // if (targetUrl.includes("https://1bp.taobao.com/report/query.json?")) {
    //   // //创建url对象 拿到csrfId
    //   const url = new URL(targetUrl);

    //   //获取csrfId
    //   const csrfId = url.searchParams.get("csrfId");

    //   //创建一个txt文件 保存csrfId
    //   let csrfIdFile = username.replace(":", "") + ".txt";

    //   //拼接路径
    //   csrfIdDir = path.join(csrfIdDir, csrfIdFile);

    //   //写入文件
    //   fs.writeFileSync(csrfIdDir, csrfId);

    //   loginInfo.csrfId = csrfId;
    // }
  });

  // page.goto("https://myseller.taobao.com/home.htm/tuiguangcenter_new/");
  // page.goto("https://myseller.taobao.com/home.htm/QnworkbenchHome/");
  page.goto("https://one.alimama.com/index.html");

  try {

    const targetResponse = await page.waitForResponse(response => {
      return response.url().includes("onebpSearch") && response.status() === 200;
    }, {
      timeout: 10000
    });

    //拿到页面上的cookie
    const cookies = await page.cookies();

    //将cookie组合成字符串
    let cookieStr = cookies.map((item: any) => {
      return item.name + "=" + item.value;
    }).join(";");

    //   //创建url对象 拿到csrfId
    const url = new URL(targetResponse.url());

    //   //获取csrfId
    const csrfId = url.searchParams.get("csrfId") + "|-|" + cookieStr;

    //   //写入文件
    fs.writeFileSync(csrfIdDir, csrfId);

    loginInfo.csrfId = csrfId;

    return csrfId;
  } catch (e: any) {
    console.log(e);

    log.error(`${username}没有万象台权限权限`);
    return ""
  }


}

export default PrimaryWindow;
