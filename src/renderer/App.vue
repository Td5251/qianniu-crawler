<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" />
    <!-- <a-spin :spinning="false" /> -->
  </router-view>
</template>

<script setup lang="ts"></script>

<style>
/* ::-webkit-scrollbar {
  width: 6px !important;
}

::-webkit-scrollbar-track {
  border-radius: 10px !important;
}

::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background-color: rgba(144, 147, 153, 0.3);
  -webkit-transition: 0.3s background-color;
  transition: 0.3s background-color;
} */


/* 设置滚动条的整体宽度和高度 */
::-webkit-scrollbar {
  width: 12px;
  /* 垂直滚动条宽度 */
  height: 12px;
  /* 水平滚动条高度 */
}

/* 设置滚动条的轨道样式（背景） */
::-webkit-scrollbar-track {
  background-color: #FAFAFA;
  /* 轨道背景色 */
  border-radius: 10px;
  /* 轨道的圆角 */
}

/* 设置滚动条的滑块样式 */
::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  /* 滑块颜色 */
  border-radius: 10px;
  /* 滑块的圆角 */
  border: 3px solid #f1f1f1;
  /* 滑块周围的边框 */
}

/* 设置滑块在 hover 时的样式 */
::-webkit-scrollbar-thumb:hover {
  background-color: #555;
  /* 鼠标悬停时滑块的颜色 */
}

* {
  overflow-x: hidden;
  font-family: HKGroteskPro, serif;
}

#td-spin {
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 99999999 !important;
}

#td-spin div {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.ant-empty-image {
  overflow: hidden;
}

.ant-table-placeholder {
  height: 60vh;
}

.td-loading {
  width: 45px;
  height: 45px;
}

:where(.css-dev-only-do-not-override-16pw25h).ant-table-wrapper .ant-table-thead>tr>th,
:where(.css-dev-only-do-not-override-16pw25h).ant-table-wrapper .ant-table-tbody>tr>td,
:where(.css-dev-only-do-not-override-16pw25h).ant-table-wrapper tfoot>tr>th,
:where(.css-dev-only-do-not-override-16pw25h).ant-table-wrapper tfoot>tr>td {
  padding: 4px !important;
}

.ant-table-cell-row-hover {
  /* background-color: #ababab !important; */
}

.select-row {
  background-color: #4096ff !important;
}

.title .ant-table-cell {
  cursor: pointer;
}

.ant-checkbox+span {
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.bottom div {
  /* font-size: 10px !important; */
}

.bottom span {
  /* font-size: 10px !important; */
}

.ant-btn-sm {
  padding: 0 4px;
}

.title .ant-table-row {
  display: none;
}

.ant-table-header th {
  cursor: pointer;
}

.ant-select-selection-search {
  overflow: hidden;
}
</style>
