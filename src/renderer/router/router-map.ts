import { RouteRecordRaw } from "vue-router";

// 定义路由规则
const routeMap: Array<RouteRecordRaw> = [
  {
    path: "/login",
    name: "login",
    component: () => import("@views/login/index.vue"),
  },
  {
    path: "/primary",
    name: "primary",
    component: () => import("@views/primary/index.vue"),
    children: [
      {
        path: "/primary/account",
        name: "account",
        component: () => import("@views/primary/account/index.vue"),
      },
      {
        path: "/primary/shops",
        name: "shops",
        component: () => import("@views/primary/shops/index.vue"),
      }, {
        path: "/primary/monitoring",
        name: "monitoring",
        component: () => import("@views/primary/monitoring/index.vue"),
      }, {
        path: "/primary/statistics",
        name: "statistics",
        component: () => import("@views/primary/statistics/index.vue"),
      },

    ],
  },
];

export default routeMap;
