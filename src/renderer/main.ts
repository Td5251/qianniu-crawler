import { createApp } from "vue";
import "./style.css";

// 导入 FontAwesome 图标
import { library as fontAwesomeLibrary } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons"; // solid样式图标
fontAwesomeLibrary.add(fas);

import App from "./App.vue";
import router from "./router";

import $td from "../lib/td";

const app = createApp(App);

app.config.globalProperties.$td = $td;

// 添加全局异常处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error Handler:', err, vm, info);

  // 在这里你可以对异常进行处理，比如记录日志或者显示一个错误提示
};

app.use(router);
app.use($td);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.mount("#app");
