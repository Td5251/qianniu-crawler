<template>
  <div class="primary-box">
    <div class="primary-nav">
      <Nav />
    </div>
    <div class="primary-body">
      <router-view />
    </div>
  </div>

  <MyInfo ref="myInfo" :default-percent="defaultPercent" />
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import Nav from "../../components/nav/index.vue";
import utils from "../../../lib/utils/renderer/index";
import $td from "../../../lib/td";
import MyInfo from "../../components/MyInfo/index.vue";
import fd from "../../../lib/file-download/renderer";
import * as fdTypes from "../../../lib/file-download/shared";

let myInfo = ref<any>(null);

let defaultPercent = ref(0);

let getElectronApi = () => {
  return (window as any).primaryWindowAPI;
};

// 与文件下载相关的数据和状态
interface FileDownloadState {
  url: string;
  savePath: string;
  md5: string;
  downloading: boolean;
  uuid: string;
  percent: number;
}
const fdState = reactive<FileDownloadState>({
  url: "",
  savePath: "",
  md5: new Date().getTime() + "",
  downloading: false,
  uuid: "",
  percent: 0,
});

let isUpdate = async () => {
  const res: any = await $td.request.request({
    url: "/admin/update/info",
    method: "GET",
  });
  console.log("版本信息：", res);
  let currentVersion = utils.getAppVersion();
  let latestVersion = res.data.version;
  if (currentVersion !== latestVersion) {
    $td.Modal.confirm({
      title: "发现新版本",
      content: `当前版本：${currentVersion}，最新版本：${latestVersion}，是否立即更新？`,
      okText: "立即更新",
      cancelText: "暂不更新",
      onOk: () => {
        $td.openLoading();
        $td.message.info("正在更新 请稍等。。。");

        getElectronApi().getDesktopPath("ims.zip");
        setTimeout(() => {
          fdState.url = res.data.app;
          console.log("下载地址：", fdState.url);

          console.log("下载路径：", fdState.savePath);

          sessionStorage.setItem("downloadFlag", "1");
          myInfo.value.showDrawer();
          onStartDownloadFile();
        }, 1000);
      },
    });
  }
};

// 开始下载文件
async function onStartDownloadFile() {
  // 文件下载选项
  const options = new fdTypes.Options();
  options.url = fdState.url;
  options.savePath = fdState.savePath;
  options.skipWhenMd5Same = true;
  options.verifyMd5 = false;
  options.md5 = fdState.md5;
  options.feedbackProgressToRenderer = true;

  fdState.downloading = true;
  fdState.uuid = options.uuid;
  fdState.percent = 0;

  const result: fdTypes.Result = await fd.download(
    options,
    (uuid: string, bytesDone: number, bytesTotal: number) => {
      // 文件下载进度反馈
      defaultPercent.value = Math.floor((bytesDone * 100) / bytesTotal);
    }
  );

  fdState.downloading = false;
  if (result.success) {
    $td.closeLoading();
    // $td.message.success("发送消息到主进程 通知解压");

    getElectronApi().updateSuccess();
  } else if (result.canceled) {
    $td.closeLoading();
    $td.message.warning(`[${result.uuid}] 用户取消！`);
  } else {
    $td.closeLoading();
    $td.message.error(`[${result.uuid}] 下载失败: ${result.error}!`);
  }
}

getElectronApi().onGetPrimaryValue((savePath: any) => {
  fdState.savePath = savePath;
});

getElectronApi().onShowSuccessMsgbox((msg: any) => {
  $td.closeLoading();
  $td.message.success(msg);
});

getElectronApi().onShowErrorMsgbox((msg: any) => {
  $td.closeLoading();
  $td.message.error(msg);
});
// isUpdate();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.primary-box {
  width: 100vw;
  height: 100vh;
}

.primary-nav {
  width: 100%;
  height: 92px;
  overflow: hidden;
  /* background-color: #409eff; */
  background-color: #18222c;
}

.primary-body {
  width: 100%;
  height: calc(100% - 92px);
  background-color: #f5f7fa;
  /* background-color: #18222c; */
  box-sizing: border-box;
  padding: 20px;
}

.ant-menu-overflow {
  overflow: hidden;
  /* background-color: #409eff !important; */
  background-color: #18222c !important;
  color: #fff !important;
}

.ant-menu-item-selected {
  /* color: #18222c !important; */
  color: #409eff !important;
}

.ant-menu-item-active {
  color: #409eff !important;
}

.ant-menu-item {
  margin-right: 10px !important;
}

.ant-menu-overflow-item {
  -webkit-app-region: no-drag;
}

button {
  overflow: hidden !important;
}

.table-striped {
  background-color: #fafafa;
}

.ant-drawer-header {
  overflow: hidden;
}

.ant-transfer-list {
  max-height: 525px !important;
}

.ant-descriptions-item-content {
  text-align: center;
}

.ant-image-preview-mask {
  -webkit-app-region: no-drag;
}

.ant-table-cell {
  text-align: center;
  /* background-color: #fafafa; */
}

.ant-table-summary tr {
  background-color: #fafafa;
}

.ant-input-number-handler-wrap {
  display: none !important;
}

.ant-table-cell {
  overflow: hidden;
}
</style>
