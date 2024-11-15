<template>
  <div>
    <a-modal v-model:open="flag" title="批量添加店铺" @ok="handleOk" cancel-text="取消" ok-text="保存">
      <a-form :model="requestParam">

        <div class="tips">
          请输入账号，每一行一个账号，账号和密码使用空格分隔。
        </div>
        <a-textarea :rows="10" v-model:value="requestParam.content"></a-textarea>


      </a-form>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { ref, defineProps } from "vue";
import $td from "../../../../../lib/td";

let myInfo = ref<any>(null);
myInfo.value = $td.getInfo();

let props = defineProps<{
  roleList: any[];
}>();

let roleList = ref();

const flag = ref<boolean>(false);

let emit = defineEmits(["submit"]);

let requestParam = ref({
  content: "",
});

let requestParamStart: any = ref({
  content: "",
});
const open = () => {

  flag.value = true;
  requestParam.value = JSON.parse(JSON.stringify(requestParamStart.value));
};

const handleOk = () => {

  //通过\n分隔拿到每一行 再通过空格分隔拿到账号和密码

  let content = requestParam.value.content;

  let arr = content.split("\n");

  let data = arr.map((item: any) => {
    let arr = item.split(" ");
    return {
      username: arr[0],
      password: arr[1],
    };
  });

  $td.openLoading();
  $td.request
    .request({
      url: "/admin/shops/add",
      method: "post",
      data: data
    })
    .then((res: any) => {
      if (res.data) {
        flag.value = false;
        $td.message.success("保存成功");
        emit("submit");
        requestParam.value = JSON.parse(
          JSON.stringify(requestParamStart.value)
        );
        return;
      }
      $td.message.error("保存失败");
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

.tips {
  color: #999;
  font-size: 12px;
}
</style>
