import { AxiosInstance } from "axios";
import $td from "../../td/";
import { message } from "ant-design-vue";

let getElectronApi = () => {
  return (window as any).primaryWindowAPI;
};

function PrepareAxios(axiosInst: AxiosInstance) {
  axiosInst.defaults.baseURL = "http://localhost:10086";
  // axiosInst.defaults.baseURL = "http://39.100.67.89:3000";
  axiosInst.defaults.timeout = 3000;
  //json格式数据
  axiosInst.defaults.headers.post["Content-Type"] = "application/json";

  axiosInst.interceptors.request.use(
    (config) => {
      config.headers["token"] = localStorage.getItem("token") || "";
      return config;
    },
    (error) => {
      // TODO: error handler
      return Promise.reject(error);
    }
  );

  axiosInst.interceptors.response.use(
    (res) => {
      // 未设置状态码则默认成功状态
      const code = res.data.code || 200;
      // 获取错误信息
      const msg = res.data.msg;
      // 二进制数据则直接返回
      if (
        res.request.responseType === "blob" ||
        res.request.responseType === "arraybuffer"
      ) {
        return res;
      }
      if (code === 401) {
        $td.closeLoading();
        //客户端未授权
        message.error("登录已过期 请重新登录");
        localStorage.removeItem("token");
        getElectronApi().toLogin();
        return Promise.reject("无效的会话，或者会话已过期，请重新登录。");
      } else if (code !== 200) {
        $td.closeLoading();
        message.error(msg);
        return Promise.reject(res);
      } else {
        $td.closeLoading();
        return res;
      }
    },
    (error) => {
      console.log("--");

      let msg = error.message;
      $td.closeLoading();

      if (msg == "Network Error") {
        msg = "后端接口连接异常";
      } else if (msg.includes("timeout")) {
        msg = "系统接口请求超时";
      } else if (msg.includes("Request failed with status code")) {
        msg = "系统接口" + msg.substr(msg.length - 3) + "异常";
      }

      // message.error(msg);
      return Promise.reject(error);
    }
  );
}

export { PrepareAxios };
