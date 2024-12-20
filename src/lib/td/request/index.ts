import axios from "axios";
import $td from "../index";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { h } from "vue";

axios.defaults.headers["Content-Type"] = "application/json;charset=utf-8";

// 创建axios实例
const requestAxios = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: getBaseURL(),
  // 超时
  timeout: 20000,
});

let getElectronApi = () => {
  return (window as any).primaryWindowAPI;
};

function getBaseURL() {
  return "http://localhost:10090";
  return "http://47.120.66.80:10090";
}

function getUploadAddress() {
  return getBaseURL() + "/upload";
}

function getDownloadAddress() {
  return getBaseURL() + "/download";
}

// request拦截器
requestAxios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.log(error);
    Promise.reject(error);
  }
);

// 响应拦截器
requestAxios.interceptors.response.use(
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
      return res.data;
    }
    if (code === 403) {
      $td.closeLoading();
      // //管理端未授权
      getElectronApi().toLogin();
      $td.message.warning("登录已失效 请重新登录");
      // $td.Modal.confirm({
      //   title: "登录状态已过期，您可以继续留在该页面，或者重新登录",
      //   icon: h(ExclamationCircleOutlined),
      //   okText: "重新登录",
      //   cancelText: "取消",
      //   onOk() {
      //     $td.removeToken();
      //     getElectronApi().toLogin();
      //     $td.message.warning("您已退出登录，请重新登录");
      //   },
      //   onCancel() {},
      // });
      return Promise.reject("无效的会话，或者会话已过期，请重新登录。");
    } else if (code !== 200) {
      $td.closeLoading();
      $td.message.error(msg);
      return Promise.reject(res);
    } else {
      $td.closeLoading();
      return res.data;
    }
  },
  (error) => {
    let msg = error.message;
    $td.closeLoading();

    if (msg == "Network Error") {
      msg = "后端接口连接异常";
    } else if (msg.includes("timeout")) {
      msg = "系统接口请求超时";
    } else if (msg.includes("Request failed with status code")) {
      msg = "系统接口" + msg.substr(msg.length - 3) + "异常";
    }

    $td.message.error(msg);
    return Promise.reject(error);
  }
);

const request = (param: any) => {
  let result = requestAxios({
    ...param,
    headers: {
      token: $td.getToken() || "",
      contentType: "application/json;charset=UTF-8",
      ...param.headers,
    },
  });

  return new Promise((resolve, reject) => {
    result
      .then((res) => {
        resolve(res);
        return false;
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const upload = (file: any) => {
  const formData = new FormData();
  // 取出json中的key,除了file
  formData.append("file", file.file);

  let result = requestAxios({
    url: getUploadAddress(),
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // onUploadProgress: (progressEvent: any) => {
    //   param.onUploadProgress(progressEvent);
    // },
    timeout: 99999999,
  });

  return new Promise((resolve, reject) => {
    result
      .then((res) => {
        resolve(res);
        return false;
      })
      .catch((err) => {
        reject(err);
      });
  });
};

//anync 同步选择文件
const selectFile = (type: any) => {
  return new Promise((resolve, reject) => {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = type || "*";
    input.style.display = "none";
    input.onchange = (e: any) => {
      resolve(e.target.files[0]);
    };
    document.body.appendChild(input);
    input.click();
  });
};

export default {
  request,
  upload,
  selectFile,
  getDownloadAddress,
  getBaseURL,
};
