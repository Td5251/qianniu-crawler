<template>
  <div class="box">
    <div class="top">
      <div class="option-select">
        <a-form-item label="状态" class="label">
          <a-select ref="select" v-model:value="requestParam.data.status" style="width: 120px" @change="search()"
            placeholder="请选择" :size="size">
            <a-select-option :value="null">所有</a-select-option>
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="0">已禁用</a-select-option>
          </a-select>
        </a-form-item>
      </div>

      <div class="option-search">
        <div class="option">
          <a-input-search placeholder="请输入关键字搜索" style="width: 200px" @search="search()"
            v-model:value="requestParam.keyword" />
        </div>
      </div>

      <div class="option-action">
        <a-button @click="openAction">添加</a-button>
      </div>
    </div>
    <div class="bottom">
      <div class="content">
        <a-table :columns="columns" :data-source="bodyData.records" :pagination="false">
          <template #headerCell="scope">
            <template v-if="scope.column.key === 'index'">
              <span>
                <smile-outlined />
                序号
              </span>
            </template>
          </template>

          <template #bodyCell="{ column, index, record }">
            <template v-if="column.key === 'index'">
              {{ index + 1 }}
            </template>

            <template v-else-if="column.key === 'status'">
              {{ record.status ? "正常" : "已禁用" }}
            </template>



            <template v-else-if="column.key === 'action'">
              <!-- <a-button type="dashed">查看</a-button> -->
              <a-button type="dashed" @click="disableAction(record)" v-if="record.status">禁用</a-button>
              <a-button type="dashed" @click="disableAction(record)" v-else>解除禁用</a-button>
              <a-button type="dashed" @click="resetPwd(record)">重置密码</a-button>
              <a-button type="dashed" @click="deleteCode(record)">删除</a-button>
            </template>
          </template>
        </a-table>
      </div>
      <div class="pagination">
        <a-pagination v-model:current="bodyData.current" :total="bodyData.total" :pageSize="requestParam.pageSize"
          :showSizeChanger="false" show-less-items @change="change" size="small" />
      </div>
    </div>
  </div>

  <ActionOfModal ref="actionOfModal" @submit="getBodyData()" />
  <ResetPwdOfModal ref="resetPwdOfModal" @submit="getBodyData()" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import $td from "../../../../lib/td";
import ActionOfModal from "./actionOfModal/index.vue";
import ResetPwdOfModal from "./resetPwdOfModal/index.vue";

let size: any = ref("default");

let actionOfModal = ref();
let resetPwdOfModal = ref();

let requestParam: any = ref({
  data: {
    status: null,
  },
  pageNumber: 1,
  pageSize: 10,
  keyword: "",
});

const columns = [
  {
    title: "序号",
    dataIndex: "index",
    key: "index",
    align: "center",
  },
  {
    title: "账号",
    dataIndex: "username",
    key: "username",
    align: "center",
  },

  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    align: "center",
  },

  {
    title: "操作",
    dataIndex: "action",
    key: "action",
    align: "center",
  },
];

const bodyData = ref<any>({
  records: [

  ],
  total: 1,
  size: 10,
  current: 1,
  pages: 1,
});

let getBodyData = () => {
  $td.openLoading();
  $td.request
    .request({
      url: "/admin/sysUser/list",
      method: "post",
      data: requestParam.value,
    })
    .then((res: any) => {
      console.log(res);
      bodyData.value = res.data;
      $td.closeLoading();
    });
};

getBodyData();

const change = (page: number) => {
  requestParam.value.pageNumber = page;
  getBodyData();
};

let openAction = (param: any) => {
  actionOfModal.value.open(param);
};

let deleteCode = (item: any) => {
  //询问是否删除
  $td.Modal.confirm({
    title: "删除",
    content: "是否确认删除",
    onOk: () => {
      console.log(item);

      $td.openLoading();
      $td.request
        .request({
          url: "/admin/sysUser/delete",
          method: "post",
          data: item,
        })
        .then((res: any) => {
          if (res.data) {
            $td.message.success("删除成功");
            getBodyData();
            return;
          }
          $td.message.error("删除失败");
        });
    },
  });
};

let generateQrCode = (code: string) => {
  //获取到当前域名
  let url = window.location.origin;
  return `${url}/${code}`;
};

const search = () => {
  requestParam.value.pageNumber = 1;
  getBodyData();
};

const disableAction = (item: any) => {

  let content = item.status ? "是否确认禁用" : "是否确认解除禁用";

  //询问是否禁用
  $td.Modal.confirm({
    title: "禁用",
    content: content,
    okText: "确认",
    cancelText: "取消",
    onOk: () => {
      item.status = !item.status;

      $td.openLoading();
      $td.request
        .request({
          url: "/admin/sysUser/action",
          method: "post",
          data: item,
        })
        .then((res: any) => {
          if (res.data) {
            $td.message.success("禁用成功");
            getBodyData();
            return;
          }
          $td.message.error("禁用失败");
        });
    },
  });
};

const resetPwd = (item: any) => {
  resetPwdOfModal.value.open(item);
};
</script>

<style scoped>
.box {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 5px;
}

.top {
  width: 100%;
  height: 96px;
  background-color: #fff;
  box-sizing: border-box;
  /* padding: 5px 10px; */
  /* box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1); */
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.bottom {
  width: 100%;
  height: calc(100% - 96px - 10px);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  border-radius: 4px;
}

.content {
  width: 100%;
  height: calc(100% - 20px);
  background-color: white;
  overflow: scroll;
  box-sizing: border-box;
  padding: 0 10px;
}

.pagination {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  box-sizing: border-box;
  padding-bottom: 0px;
}

.center {
  text-align: center !important;
}

.ant-form-item {
  margin-bottom: 10px;
  margin-left: 30px;
}

.ant-form-item {
  margin-bottom: 0;
}

.option-select {
  flex: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.option-search {
  flex: 1;
  display: flex;
  height: 100%;
  align-items: center;
}

.option-action {
  flex: 1;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
