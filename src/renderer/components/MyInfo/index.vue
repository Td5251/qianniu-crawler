<template>
  <div>
    <div class="my-outside" @click="showDrawer">
      <div class="my-inner">我的信息</div>
    </div>

    <a-drawer :width="500" title="我的信息" :placement="placement" :open="open" @close="onClose" :closable="false">
      <a-descriptions title="" layout="vertical" bordered>
        <a-descriptions-item label="账号">{{
          username
        }}</a-descriptions-item>

        <a-descriptions-item label="操作">
          <div class="options">
            <a-button type="dashed" size="small" @click="actionOfModal.open()">
              修改密码
            </a-button>

            <a-button type="dashed" size="small" @click="logout">退出登录
            </a-button>

            <a-button type="dashed" size="small" @click="configOfModal.open">软件配置</a-button>
          </div>
        </a-descriptions-item>
      </a-descriptions>

      <div class="downloadBox" v-if="downloadFlag">
        <h3>下载进度</h3>
        <div class="download">
          <a-progress type="circle" :percent="defaultPercent" />
        </div>
      </div>
    </a-drawer>

    <ActionOfModal ref="actionOfModal" />
    <ConfigOfModal ref="configOfModal" />
  </div>
</template>

<script setup lang="ts">
import { h, ref, defineProps, defineExpose } from "vue";
import type { DrawerProps } from "ant-design-vue";
import $td from "../../../lib/td";
import ActionOfModal from "./ActionOfModal/index.vue";
import ConfigOfModal from "./ConfigOfModal/index.vue";

let actionOfModal = ref<any>(null);
let configOfModal = ref<any>(null);

let myInfo: any = ref();

const placement = ref<DrawerProps["placement"]>("left");
const open = ref<boolean>(false);

let getElectronApi = () => {
  return (window as any).primaryWindowAPI;
};

let props = defineProps({
  defaultPercent: Number,
});

let downloadFlag = ref(false);
const showDrawer = () => {
  downloadFlag.value =
    sessionStorage.getItem("downloadFlag") == "1" ? true : false;
  console.log("info: ", $td.getInfo());

  open.value = true;
};

const onClose = () => {
  open.value = false;
};

const logout = () => {
  // 退出登录
  $td.removeToken();
  localStorage.removeItem("autologin");
  localStorage.removeItem("username");
  localStorage.removeItem("password");
  getElectronApi().toLogin();
};

let username = ref()
username.value = localStorage.getItem("username");
console.log("username: ", username.value);




const clearUpdateFile = () => {
  getElectronApi().clearUpdateFile();
};
let lock = ref(false);
getElectronApi().onShowSuccessMsgbox((msg: any) => {
  // try {

  //   if (lock.value) {
  //     return;
  //   }
  //   lock.value = true;

  //   setTimeout(() => {
  //     lock.value = false;
  //   }, 1000);
  // } catch (e) {
  //   console.log(e);
  //   lock.value = false;
  // }
});

getElectronApi().onShowErrorMsgbox((msg: any) => {
  // $td.closeLoading();
  // $td.message.error(msg);
});

defineExpose({
  showDrawer,
});


const softwareConfig = () => {

};
</script>

<style scoped>
.my-outside {
  position: fixed;
  bottom: 36px;
  left: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  cursor: pointer;
  z-index: 9998;
}

.my-inner {
  display: inline-block;
  color: #fff;
  font-size: 14px;
  height: 30px;
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  padding: 0 10px 0 10px;
  display: flex;
  align-items: center;
  z-index: 9997;
}

.options {
  display: flex;
  justify-content: space-between;
}

.downloadBox {
  margin-top: 20px;
  text-align: center;
}

.download {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
