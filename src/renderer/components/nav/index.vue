<template>
  <div class="nav-box">
    <div class="left">
      <a-menu v-model:selectedKeys="current" mode="horizontal" :items="itemsTop" @click="openRouter" />
      <a-menu v-model:selectedKeys="current" mode="horizontal" :items="itemsBottom" @click="openRouter" />
    </div>

    <div class="right">
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

    <MyInfo />
  </div>
</template>
<script lang="ts" setup>
import { h, ref } from "vue";
import MyInfo from "../MyInfo/index.vue";
import $td from "../../../lib/td";
import { onMounted } from "vue";
import {
  ForkOutlined,
  UserOutlined,
  CarOutlined,
  MoneyCollectOutlined,
  SolutionOutlined,
  ClusterOutlined,
  CoffeeOutlined,
  RadarChartOutlined,
  BugOutlined,
  NodeCollapseOutlined,
  NodeExpandOutlined,
  RocketOutlined,
  CloseOutlined,
  LineOutlined,
  ExpandOutlined,
  CompressOutlined,
  DownloadOutlined,
  ToTopOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  DotChartOutlined,
  DeploymentUnitOutlined,
} from "@ant-design/icons-vue";
import { MenuProps } from "ant-design-vue";
import { useRouter } from "vue-router";

let router = useRouter();
const current = ref<any>([]);

let info: any = ref();
const itemsTop = ref<any["items"]>([
  {
    key: "/primary/shops",
    icon: () => h(UserOutlined),
    label: "店铺管理",
    title: "店铺管理",
  },
  {
    key: "/primary/monitoring",
    icon: () => h(RocketOutlined),
    label: "监控",
    title: "监控",
  },
  {
    key: "/primary/statistics",
    icon: () => h(ClusterOutlined),
    label: "统计",
    title: "统计",
  },
]);


/**


 */

const itemsBottom = ref<any["items"]>([

]);

let iconMap = new Map();
iconMap.set("UserOutlined", h(UserOutlined));
iconMap.set("CarOutlined", h(CarOutlined));
iconMap.set("MoneyCollectOutlined", h(MoneyCollectOutlined));
iconMap.set("SolutionOutlined", h(SolutionOutlined));
iconMap.set("ClusterOutlined", h(ClusterOutlined));
iconMap.set("CoffeeOutlined", h(CoffeeOutlined));
iconMap.set("RadarChartOutlined", h(RadarChartOutlined));
iconMap.set("BugOutlined", h(BugOutlined));
iconMap.set("NodeCollapseOutlined", h(NodeCollapseOutlined));
iconMap.set("NodeExpandOutlined", h(NodeExpandOutlined));
iconMap.set("RocketOutlined", h(RocketOutlined));
iconMap.set("CloseOutlined", h(CloseOutlined));
iconMap.set("LineOutlined", h(LineOutlined));
iconMap.set("ExpandOutlined", h(ExpandOutlined));
iconMap.set("CompressOutlined", h(CompressOutlined));
iconMap.set("DownloadOutlined", h(DownloadOutlined));
iconMap.set("ToTopOutlined", h(ToTopOutlined));
iconMap.set("ThunderboltOutlined", h(ThunderboltOutlined));
iconMap.set("BarChartOutlined", h(BarChartOutlined));
iconMap.set("DotChartOutlined", h(DotChartOutlined));
iconMap.set("ForkOutlined", h(ForkOutlined));


onMounted(() => {
  let username = localStorage.getItem("username");

  if (username == 'admin') {
    //将账号管理放到导航栏的第1个位置
    itemsTop.value.unshift({
      key: "/primary/account",
      icon: () => h(UserOutlined),
      label: "账号管理",
      title: "账号管理",
    });
  }

  current.value[0] = itemsTop.value[0].key;


  router.push(current.value[0]);

  // if (info.value.id == 1) {
  //   itemsTop.value.push({
  //     key: "/primary/AllocateInventory",
  //     icon: () => h(DeploymentUnitOutlined),
  //     label: "分配库存",
  //     title: "分配库存",
  //   });
  // }
});

let getElectronApi = () => {
  return (window as any).primaryWindowAPI;
};

let openRouter = (key: any) => {
  //如果当前的key与点击的key不一样，才进行跳转
  if (current.value[0] !== key.key) {
    getElectronApi().openRouter(key.key);
    console.log(key.key);
  }
};

let setWin = (type: string) => {
  getElectronApi().setWin(type);
};

</script>

<style scoped>
.nav-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 100%;
  overflow: hidden;
  -webkit-app-region: drag;
}

.left {
  width: calc(100% - 80px);
  display: flex;
  flex-direction: column;
}

.right {
  width: 80px;
  display: flex;
  justify-content: end;
  -webkit-app-region: no-drag;
}

.right div {
  cursor: pointer;
  margin-left: 10px;
  color: #fff;
  -webkit-app-region: no-drag;
}
</style>
