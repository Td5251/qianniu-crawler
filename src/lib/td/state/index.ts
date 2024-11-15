import $td from "../index";
let info: any = [];

let initInfo = async (param: any) => {
  // info = param;
  sessionStorage.setItem("info", JSON.stringify(param));
};

let getInfo = () => {
  info = JSON.parse(sessionStorage.getItem("info") || "[]");
  return info;
};

export { initInfo, getInfo };
