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
let shopsInfoMap = new Map();
let retrievingFlagMap = new Map();

let currentOpenBrowserNumber = 0;



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
    // this.openRouter("/login");
    this.openRouter("/primary");

    try {

      //拿到appdata目录下qianniu-crawler-config.json
      let configPath = path.join(app.getPath("appData"), "qianniu-crawler-config.json");

      //如果不存在就创建一个
      if (!fs.existsSync(configPath)) {
        let defaultConfig = {
          isShowBrowser: false,
          maxOpenBrowserNumber: 15,
          defaultChromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        }

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      }


      //读取配置文件
      systemConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      if (!systemConfig.defaultChromePath) {
        systemConfig.defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      }

      log.info("系统配置：", systemConfig);
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
      let requestParam = JSON.parse(param);

      try {

        let userDataDir = path.join(app.getPath("appData"), "qianniu-crawler");

        let userDataDirName = requestParam.username.replace(":", "");

        //拼接上用户名
        userDataDir = path.join(userDataDir, userDataDirName);

        let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

        if (!fs.existsSync(cookieDir)) {
          fs.mkdirSync(cookieDir);
        }

        let dirName = requestParam.username.replace(":", "") + ".json";

        //拼接上用户名
        cookieDir = path.join(cookieDir, dirName);

        if (fs.existsSync(cookieDir)) {
          accountLoginInfoMap.set(requestParam.username, {
            loginTime: new Date().getTime()
          });

          // //将当前登录信息发送到渲染进程
          this.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);

          return
        }

        //显示打开浏览器
        let browser = await puppeteer.launch({
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
        let loginPage: any = await browser.newPage();

        // 设置用户代理（User-Agent）
        await loginPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');


        // await login(loginPage, requestParam.username, requestParam.password);

        // try {
        //   await browser.close();
        // } catch (e: any) {
        // }


        // let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://web.m.taobao.com/app/operation-center/open-shop/home-pc"
        let url = "https://login.taobao.com/member/login.jhtml?redirectURL=https://myseller.taobao.com/home.htm/QnworkbenchHome/"
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
          await loginPage.waitForNavigation();
        } catch (e) {
          log.error("等待超时");
        }
        // await loginPage.waitForNavigation({ waitUntil: 'networkidle0' });

        let thit = this;

        //拿到当前地址
        let currentUrl = loginPage.url();

        log.info("当前地址---：" + currentUrl);

        if (currentUrl.includes("login.taobao.com")) {
          loginPage.on('framenavigated', (frame) => {
            log.info('地址变化:', frame.url());

            if (frame.url().includes("myseller.taobao.com/home.htm")
              && !frame.url().includes("redirect_url")
            ) {
              log.info("登录成功,当前地址：" + frame.url());
              loginSuccess(loginPage, requestParam, thit);
            }
          });

        } else {
          log.info("登录成功,当前地址：" + currentUrl);
          loginSuccess(loginPage, requestParam, thit);
        }

        //监听跳转后的地址
        // loginPage.on("response", async (response: any) => {
        //   //拿到当前地址
        //   let currentUrl = response.url();

        //   log.info("当前地址：" + currentUrl);


        //   // if (currentUrl == 'https://gm.mmstat.com/aes.1.1') {
        //   if (currentUrl == 'https://g.alicdn.com/tb/tracker/index.js') {

        //     //将浏览器最小化
        //     thit.browserWindow?.minimize();

        //     log.info("登录成功");

        //     //保存cookies
        //     const cookies = await loginPage.cookies();

        //     //过期时间为10天后
        //     let expires = Date.now() / 1000 + 10 * 24 * 60 * 60;

        //     //将.之后的去掉
        //     expires = Math.floor(expires);

        //     const persistentCookies = cookies.map(cookie => ({
        //       ...cookie,
        //       expires: expires
        //     }));

        //     let cookieDir = path.join(app.getPath("appData"), "qianniu-crawler-cookie");

        //     if (!fs.existsSync(cookieDir)) {
        //       fs.mkdirSync(cookieDir);
        //     }

        //     let dirName = requestParam.username.replace(":", "") + ".json";

        //     //拼接上用户名
        //     cookieDir = path.join(cookieDir, dirName);

        //     //写入文件
        //     fs.writeFileSync(cookieDir, JSON.stringify(persistentCookies, null, 2));

        //     accountLoginInfoMap.set(requestParam.username, {
        //       loginTime: new Date().getTime()
        //     });

        //     //关闭当前所有页面
        //     try {
        //       let pages = await loginPage.browser().pages();
        //       pages.forEach(async (item: any) => {
        //         await item.close();
        //       });
        //     } catch (e: any) {
        //       log.error("自动关闭失败", e);
        //     }

        //     thit.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);
        //   }

        // });

        // accountLoginInfoMap.set(requestParam.username, {
        //   loginTime: new Date().getTime()
        // });

        // //将当前登录信息发送到渲染进程
        // this.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);

      } catch (e: any) {
        log.error("登录error：");
        log.error(e);
        this.browserWindow?.webContents.send("show-error-msgbox", "账号: " + requestParam.username + " 登录失败 请稍后重试!");
      }

    });

    //获取登录信息
    ipcMain.on("get-login-info", async (event) => {
      //将当前登录信息发送到渲染进程
      this.browserWindow?.webContents.send("get-login-info", accountLoginInfoMap);
    });

    //获取店铺信息
    ipcMain.on("get-shops-info", async (event, param, flag) => {
      let requestParam = JSON.parse(param);
      //如果正在获取中 则不再获取
      let retrievingFlag = retrievingFlagMap.get(requestParam.id);

      if (retrievingFlag) {
        log.info(requestParam.id + " 正在获取中");

        return;
      }

      retrievingFlagMap.set(requestParam.id, true);

      log.info("-----------收到执行获取：" + requestParam.id + "店铺信息的任务-----------");
      try {
        let loginFlag = accountLoginInfoMap.get(requestParam.username);


        if (!loginFlag) {
          requestParam.status = "not-login";
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }

        if (flag) {
          let shopsInfo = shopsInfoMap.get(requestParam.id)

          if (shopsInfo) {
            this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(shopsInfo));
            return;
          }
        }



        systemConfig.maxOpenBrowserNumber = parseInt(systemConfig.maxOpenBrowserNumber);
        log.info("当前系统配置：", systemConfig);
        log.info("当前打开浏览器数量：", currentOpenBrowserNumber);


        //自旋锁等待浏览器数量小于最大值
        while (currentOpenBrowserNumber >= systemConfig.maxOpenBrowserNumber) {
          log.info(requestParam.id + "-等待中");

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        log.info("开始执行获取：" + requestParam.id + "店铺信息的任务");

        currentOpenBrowserNumber++;


        //根据对应配置 创建一个隐藏的浏览器
        let browser = await puppeteer.launch({
          // headless: isShowBrowser,
          headless: !systemConfig.isShowBrowser,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'  // 禁用浏览器的自动化标识
          ],
          executablePath: systemConfig.defaultChromePath
        });

        //打开新页面 用于恢复cookie
        let initCookiePage: any = await browser.newPage();

        let isLogin;

        try {
          isLogin = await initCookie(initCookiePage, requestParam) as any
        } catch (e: any) {
          log.error("恢复cookie失败", e);
          isLogin = false;
        }

        if (!isLogin) {
          //删除获取中标识
          retrievingFlagMap.delete(requestParam.id);

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
          }

          //响应信息
          requestParam.status = "not-login";
          this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));
          return;
        }


        //爬取对应数据 并对数据进行解析
        let { shopName, operationData, wanxiangtaiData, otherIndicatorsData } = await getOperationAndWanXiangTaiData(browser) as any
        let goodsData = await getGoodsData(browser) as any
        let depositData = await getDepositData(browser)
        let aggregateBalance = await getAggregateBalanceData(browser)
        let shopLevel = await getShopLevelData(browser);
        let statisticsData = await getStatisticsData(browser) as any;

        let responseInfo = {
          id: requestParam.id,
          remark: requestParam.remark,
          crawlerTime: new Date().getTime(),
          shopName: shopName,
          ...operationData,
          ...wanxiangtaiData,
          ...otherIndicatorsData,
          ...depositData,
          ...goodsData,
          aggregateBalance: aggregateBalance,
          shopLevel: shopLevel,
          ...statisticsData,

          status: "success",
        }
        shopsInfoMap.set(requestParam.id, responseInfo);

        //关闭浏览器
        try {
          await browser.close();
        } catch (e: any) {
          log.info("关闭浏览器失败");
          log.info(e);
        }

        //将当前店铺信息发送到渲染进程
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(responseInfo));
      } catch (e) {

        requestParam.status = "error";
        this.browserWindow?.webContents.send("get-shops-info", JSON.stringify(requestParam));

      } finally {
        let requestParam = JSON.parse(param);
        //等待1秒 删除获取中标识
        await new Promise((resolve) => setTimeout(resolve, 1000));
        retrievingFlagMap.delete(requestParam.id);
        currentOpenBrowserNumber--;
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
  homePage.goto("https://myseller.taobao.com/home.htm/QnworkbenchHome/");

  //获取店铺名称
  let shopName;

  try {
    //等待加载完毕
    await homePage.waitForNavigation();

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


  try {
    //等待.qn_plus_square元素加载完毕
    await homePage.waitForSelector(".qn_plus_square");

    //获取到此元素并点击
    await homePage.click(".qn_plus_square");

    await homePage.waitForSelector('.next-dialog-body .next-tag');

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
        // 判断元素是否包含 'checked' 类名
        if (tag.innerText.includes("万相台")) {
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
        visitor = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("支付子订单数")) {
        order = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("支付金额")) {
        amount = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台账户余额")) {
        wxtBalance = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台花费")) {
        wxtCharge = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台展现量")) {
        wxtDisplay = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台点击量")) {
        wxtClick = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台成交金额")) {
        wxtTransaction = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("万相台投产比")) {
        wxtProfit = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
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
        addToCart = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }


      if (item.includes("支付转化率")) {
        conversionRate = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("浏览量")) {
        pageViews = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("支付买家数")) {
        buyerNumber = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
      }

      if (item.includes("客单价")) {
        unitPrice = temp[i + 1] + " / " + temp[i + 2].replace("昨日", "");
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

  return {
    shopName: shopName,
    operationData: operationData,
    wanxiangtaiData: wanxiangtaiData,
    otherIndicatorsData: otherIndicatorsData
  }
}

//获取商品数据
const getGoodsData = async (browserParam: any) => {
  let goodsPage = await browserParam.newPage();
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

//获取保证金数据
const getDepositData = async (browserParam: any) => {
  //https://qn.taobao.com/home.htm/deposit 保证金页面
  let depositPage = await browserParam.newPage();

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

//获取聚合账户余额
const getAggregateBalanceData = async (browserParam: any) => {
  let aggregateBalancePage = await browserParam.newPage();

  aggregateBalancePage.goto("https://myseller.taobao.com/home.htm/whale-accountant/pay/capital/home");


  let data;

  try {
    //等待页面加载完成
    await aggregateBalancePage.waitForNavigation();

    await new Promise((resolve) => setTimeout(resolve, 3000));

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


  return data;

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

    // console.log("服务数据：", serviceData);


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

      if (item.key.includes("支付金额")) {
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

      if (item.key.includes("支付金额")) {
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

    for (let i = 0; i < data3.length; i++) {
      let item = data3[i];

      if (item.key.includes("支付金额")) {
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

const loginSuccess = async (loginPage: any, requestParam: any, thit: any) => {
  //将浏览器最小化
  thit.browserWindow?.minimize();

  //将软件窗口显示出来
  thit.browserWindow?.show();

  log.info("登录成功");

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

  let dirName = requestParam.username.replace(":", "") + ".json";

  //拼接上用户名
  cookieDir = path.join(cookieDir, dirName);

  //写入文件
  fs.writeFileSync(cookieDir, JSON.stringify(persistentCookies, null, 2));

  accountLoginInfoMap.set(requestParam.username, {
    loginTime: new Date().getTime()
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

export default PrimaryWindow;
