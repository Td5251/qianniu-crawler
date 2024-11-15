import { openLoading, closeLoading, updateLoadding } from "./loading";
import { Modal, message, notification } from "ant-design-vue";
import { getToken, removeToken, setToken } from "./auth";
import { formatDT, formatD, formatT } from "./date";
import { initInfo, getInfo } from "./state";
import request from "./request";
import selectFile from "./request";
import upload from "./request";
import getDownloadAddress from "./request";
import getBaseURL from "./request";
import decimal from "./decimal";
export default {
  openLoading,
  closeLoading,
  Modal,
  message,
  notification,
  getToken,
  removeToken,
  setToken,
  formatDT,
  formatD,
  formatT,
  request,
  initInfo,
  getInfo,
  selectFile,
  upload,
  getDownloadAddress,
  decimal,
  updateLoadding,
  getBaseURL,
};
