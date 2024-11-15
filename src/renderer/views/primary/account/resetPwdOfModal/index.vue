<template>
  <div>
    <a-modal v-model:open="flag" title="重置密码" @ok="handleOk">
      <a-form :model="requestParam">


        <a-form-item label="密&emsp;&emsp;码">
          <a-input v-model:value="requestParam.password" />
        </a-form-item>

        <a-form-item label="确认密码">
          <a-input v-model:value="requestParam.confirmPassword" />
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

let requestParam: any = ref({
  username: "",
  password: "",
  status: "true",
  id: null,
  confirmPassword: "",
});

let requestParamStart: any = {
  username: "",
  password: "",
  status: "true",
  id: null,
  confirmPassword: "",
};

const open = (param: any) => {
  flag.value = true;
  if (param.id) {
    requestParam.value = JSON.parse(JSON.stringify(param));
    return;
  }
  requestParam.value = JSON.parse(JSON.stringify(requestParamStart));
};

const handleOk = () => {


  if (requestParam.value.password !== requestParam.value.confirmPassword) {
    $td.message.error("两次密码不一致");
    return;
  }

  $td.openLoading();
  $td.request
    .request({
      url: "/admin/sysUser/resetPwd",
      method: "post",
      data: requestParam.value,
    })
    .then((res: any) => {
      if (res.data) {
        flag.value = false;
        $td.message.success("操作成功");
        emit("submit");
        requestParam.value = JSON.parse(JSON.stringify(requestParamStart));
        return;
      }
      $td.message.error("操作失败");
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
