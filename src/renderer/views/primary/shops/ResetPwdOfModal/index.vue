<template>
  <div>
    <a-modal v-model:open="flag" title="编辑" @ok="handleOk">
      <a-form :model="requestParam">
        <a-form-item label="账号">
          <a-input v-model:value="requestParam.username" />
        </a-form-item>

        <a-form-item label="密码">
          <a-input v-model:value="requestParam.password" />
        </a-form-item>

        <a-form-item label="备注">
          <a-input v-model:value="requestParam.remark" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import $td from "../../../../../lib/td";

const flag = ref<boolean>(false);

let emit = defineEmits(["submit"]);

let requestParam = ref({
  id: null,
  username: "",
  password: "",
  remark: "",
});

let requestParamStart: any = ref({
  id: null,
  username: "",
  password: "",
  remark: "",
});
const open = (param: any) => {
  flag.value = true;
  requestParam.value = JSON.parse(JSON.stringify(requestParamStart.value));
  if (param) {
    requestParam.value = JSON.parse(JSON.stringify(param));
  }
};

const handleOk = () => {
  if (!requestParam.value.password) {
    $td.message.error("请输入密码");
    return;
  }

  if (!requestParam.value.username) {
    $td.message.error("请输入账号");
    return;
  }

  $td.openLoading();
  $td.request
    .request({
      url: "/admin/shops/action",
      method: "post",
      data: requestParam.value,
    })
    .then((res: any) => {
      if (res.data) {
        flag.value = false;
        $td.message.success("操作成");
        emit("submit");
        requestParam.value = JSON.parse(
          JSON.stringify(requestParamStart.value)
        );
        return;
      }
      $td.message.error("操作失败失败");
    });
};

defineExpose({
  open,
});
</script>

<style scoped>
.ico {
  width: 120px;
  position: relative;
}

.ico img {
  width: 100%;
  height: 100%;
}

.ico .mask {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  opacity: 0;
}

.ico:hover .mask {
  opacity: 1;
}

.mask img {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>
