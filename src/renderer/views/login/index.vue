<template>
  <div class="box">
    <div class="option">
      <div @click="setWin('min')">
        <LineOutlined />
      </div>
      <div @click="setWin('max')">
        <ExpandOutlined />
      </div>
      <div @click="setWin('close')">
        <CloseOutlined style="font-size: 16px" />
      </div>
    </div>
    <div class="login-form" @keydown.enter="login">
      <div class="title">欢迎使用千牛辅助查询系统</div>
      <div class="title-login">登录</div>

      <a-form>
        <span>账号</span>
        <a-form-item>
          <a-input class="ipt" placeholder="请输入账号" v-model:value="requestParam.username">
            <template #prefix>
              <UserOutlined class="site-form-item-icon" />
            </template>
          </a-input>
        </a-form-item>
        <span>密码</span>
        <a-form-item>
          <a-input-password class="ipt" placeholder="请输入密码" v-model:value="requestParam.password">
            <template #prefix>
              <LockOutlined class="site-form-item-icon" />
            </template>
          </a-input-password>
        </a-form-item>

        <!-- <a-form-item label="自动登录" class="auto-login">
          <a-switch v-model:checked="requestParam.autologin" />
        </a-form-item> -->

        <a-form-item class="login-btn">
          <a-button type="primary" class="login-form-button" @click="login">
            登录
            <LoginOutlined style="font-size: 16px" />
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  CloseOutlined,
  ExpandOutlined,
  LineOutlined,
} from "@ant-design/icons-vue";
import { ref } from "vue";
import axiosInst from "../../../lib/axios-inst/renderer/index";
import { message } from "ant-design-vue";
import $td from "../../../lib/td";

let requestParam = ref({
  username: "",
  password: "",
  authType: "admin",
  autologin: false,
});

let autoLogin = () => {
  let autologin = localStorage.getItem("autologin") == "true";
  requestParam.value.autologin = autologin;
  if (autologin) {
    requestParam.value.username = localStorage.getItem("username") || "";
    requestParam.value.password = localStorage.getItem("password") || "";
    login();
  }
};

let getElectronApi = () => {
  return (window as any).primaryWindowAPI;
};

let setWin = (type: string) => {
  getElectronApi().setWin(type);
};
let login = () => {
  // getElectronApi().showPrimary();

  if (!requestParam.value.username || !requestParam.value.password) {
    message.error("请输入账号密码");
    return;
  }
  $td.openLoading();

  $td.request
    .request({
      url: "/login",
      method: "post",
      data: requestParam.value,
    })
    .then((res: any) => {
      $td.closeLoading();

      if (requestParam.value.autologin) {
        localStorage.setItem("autologin", "true");
        localStorage.setItem("username", requestParam.value.username);
        localStorage.setItem("password", requestParam.value.password);
      }

      $td.setToken(res.data);
      localStorage.setItem("username", requestParam.value.username);


      // localStorage.setItem("token", res.data);

      getElectronApi().showPrimary();
    })
};

autoLogin();
</script>

<style scoped>
.box {
  width: 100vw;
  height: 100vh;
  background-image: url("/bg.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form {
  width: 500px;
  height: 460px;
  background-color: #fff;
  border-radius: 20px;
  box-sizing: border-box;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  padding-left: 2%;
  padding-right: 2%;
}

.title {
  font-size: 24px;
  text-align: center;
  margin-top: 20px;
  margin-bottom: 20px;
  color: #50649c;
  font-weight: 700;
}

.title-login {
  color: #a4abc5;
  font-size: 14px;
  text-align: center;
  transform: translateY(-10px);
}

.ipt {
  width: 100%;
  height: 40px !important;
  border: 1px solid #d9d9d9;
  border-radius: 20px;
  padding: 0 11px;
  margin-top: 5px;
}

.login-btn button {
  width: 100%;
  height: 40px;
  border-radius: 20px;
  background-color: #4d79f6;
}

.register {
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: #a4abc5;
}

.option {
  width: 100px;
  display: flex;
  justify-content: flex-end;
  position: fixed;
  right: 0px;
  top: 20px;
  cursor: pointer;
  color: #fff;
  z-index: 99;
}

.option div {
  margin-right: 10px;
}
</style>
