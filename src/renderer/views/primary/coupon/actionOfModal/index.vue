<template>
  <div>
    <a-modal v-model:open="flag" title="添加优惠券" @ok="handleOk">
      <a-form :model="requestParam" :rules="rules" ref="requestParamForm">
        <a-form-item label="优惠券名称" name="name">
          <a-input v-model:value="requestParam.name" :rules="rules.name" />
        </a-form-item>

        <a-form-item label="使用时间" name="startTime">
          <a-date-picker v-model:value="startDate" :rules="rules.startTime" :locale="locale"
          @change="selectStartDate"
          />
          -
          <a-time-picker :locale="locale" v-model:value="startTime" disabled />
        </a-form-item>

        <a-form-item label="结束时间" name="endTime">
          <a-date-picker v-model:value="endDate" :rules="rules.endTime" :locale="locale"
          @change="selectEndDate" />
          -
          <a-time-picker :locale="locale" disabled v-model:value="endTime" />
        </a-form-item>

        <a-form-item label="透出时间" name="displayStartTime">
          <a-date-picker v-model:value="displayDate" :rules="rules.displayStartTime"
            :locale="locale"
            @change="selectDisplayDate"
            />
          -
          <a-time-picker :locale="locale" v-model:value="displayTime" :disabled="!requestParam.displayStartTime"
          @change="selectDisplayTime"
          />

        </a-form-item>

        <a-form-item label="面额门槛" name="startFee">
          满￥<a-input v-model:value="requestParam.startFee" style="width: 120px;" type="number"
            :rules="rules.startFee" />

          减￥<a-input v-model:value="requestParam.amount" style="width: 120px;" type="number" :rules="rules.amount" />
        </a-form-item>


        <a-form-item label="发放量" name="totalCount">
          <a-input v-model:value="requestParam.totalCount" placeholder="请输入1000-100000之间的整数" type="number" min="1000"
            max="100000" :rules="rules.totalCount" />
        </a-form-item>

        <a-form-item label="每人限领">
          <a-select v-model:value="requestParam.personLimit">
            <a-select-option :value="-1">不限</a-select-option>
            <a-select-option :value="1">1</a-select-option>
            <a-select-option :value="2">2</a-select-option>
            <a-select-option :value="3">3</a-select-option>
            <a-select-option :value="4">4</a-select-option>
            <a-select-option :value="5">5</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button key="back" @click="flag = false">取消</a-button>
        <a-button key="submit" type="primary" @click="handleOk">确定</a-button>
      </template>
    </a-modal>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import $td from "../../../../../lib/td";
import dayjs from "dayjs";
import 'dayjs/locale/zh-cn';
import locale from 'ant-design-vue/es/date-picker/locale/zh_CN';
import axios from "axios";
dayjs.locale('zh-cn');

const flag = ref<boolean>(false);

let emit = defineEmits(["submit"]);

/**
 {"expireRemind":false,"unConditional":false,"name":"店铺券1223","startFee":999,"amount":10,"totalCount":1000,"startTime":"2024-12-23 00:00:00","endTime":"2024-12-24 23:59:59","displayStartTime":"2024-12-23 00:00:00","personLimit":3,"itemIds":[],"couponType":0,"tagId":"A","ignoreRisk":true}
 */

//透出日期
let displayDate = ref<any>(null);
//透出时间
let displayTime = ref<any>("");

displayTime.value = dayjs('00:00:00', 'HH:mm:ss')

//使用日期
let startDate = ref<any>(null);
//使用时间
let startTime = ref<any>(null);

startTime.value = dayjs('00:00:00', 'HH:mm:ss')

//结束日期
let endDate = ref<any>(null);
//结束时间
let endTime = ref<any>(null);

endTime.value = dayjs('23:59:59', 'HH:mm:ss')

let requestParamForm = ref<any>(null);

let selectShops = ref<any>([]);

let requestParam: any = ref({
  name: "",
  //使用时间
  startTime: "",
  //结束时间
  endTime: "",
  //透出时间
  displayStartTime: "",
  //优惠券类型
  tagId: "A",
  //满减金额
  startFee: 0,
  //减免金额
  amount: 0,
  //发放量
  totalCount: null,
  //每人限领
  personLimit: -1,
  unConditional:false,
  expireRemind:false,
  ignoreRisk:true,
  itemIds:[],
  couponType:0,
});

let requestParamStart: any = {
  id: 0,
  name: "",
  //使用时间
  startTime: null,
  //结束时间
  endTime: null,
  //透出时间
  displayStartTime: "",
  //优惠券类型
  tagId: "A",
  //满减金额
  startFee: 0,
  //减免金额
  amount: 0,
  //发放量
  totalCount: null,
  //每人限领
  personLimit: -1,
  unConditional:false,
  expireRemind:false,
  ignoreRisk:true,
  itemIds:[],
  couponType:0,
};

let rules: any = ref({
  name: [{ required: true, message: "请填写优惠券名称", trigger: "blur" }],
  startTime: [{ required: true, message: "请填写使用时间", trigger: "blur" }],
  endTime: [{ required: true, message: "请填写结束时间", trigger: "blur" }],
  displayStartTime: [{ required: true, message: "请填写透出时间", trigger: "blur" },

  ],

  startFee: [{ required: true, message: "请填写面额门槛", trigger: "blur" },
  {
    pattern: /^[0-9]+$/,
    message: '只能输入整数',
  },
  ],
  amount: [{ required: true, message: "请填写面额门槛", trigger: "blur" },
  {
    pattern: /^[0-9]+$/,
    message: '只能输入整数',
  },
  ],
  totalCount: [
    { required: true, message: "请输入1000-100000之间的整数", trigger: "blur" },
    {
      validator: (rule: any, value: any) => {
        if (value < 1000 || value > 100000) {
          return Promise.reject("请输入1000-100000之间的整数");
        }
        return Promise.resolve();
      },
      trigger: "blur",
    },
  ],
})

let getElectronApi = () => {
	return (window as any).primaryWindowAPI;
};


const open = (param: any) => {
  flag.value = true;
  
  selectShops.value = param;

  requestParam.value = JSON.parse(JSON.stringify(requestParamStart));
  startDate.value = null;
  startTime.value = null;
  endDate.value = null;
  endTime.value = null;
  displayDate.value = null;
  displayTime.value = dayjs('00:00:00', 'HH:mm:ss');
};

const handleOk = () => {
  console.log(requestParam.value);

  requestParamForm.value.validate().then(() => {
    $td.openLoading();
    let selectShopsNameList = selectShops.value.map((item: any) => {
      return item.username;
    });
     getElectronApi().addCoupon(JSON.stringify(requestParam.value),JSON.stringify(selectShopsNameList));

  }).catch(() => {
    $td.message.error('请将信息填写完毕');
  }); 
    
};


const selectStartDate = (date: any) => {
  //requestParam.value.startTime为date的凌晨00:00:00
  startDate.value = date;

  let sd = dayjs(date).startOf('day');
  requestParam.value.startTime = sd.valueOf();
};

const selectEndDate = (date: any) => {
  endDate.value = date;
  
  let ed = dayjs(date).endOf('day');
  requestParam.value.endTime = ed.valueOf();
};


const selectDisplayDate = (date: any) => {
  displayDate.value = date;

  let dd = dayjs(date).startOf('day');
  requestParam.value.displayStartTime = dd.valueOf();
  console.log(requestParam.value.displayStartTime);
  
  console.log(displayTime.value.valueOf());
  
};

const selectDisplayTime = (time: any) => {
  displayTime.value = time;

  //使用displayDate.value和time.value拼接成一个时间戳
  let startDate = dayjs(displayDate.value).startOf('day');
  let startTime = dayjs(time).format('HH:mm:ss');
  let displayStartTime = startDate.format('YYYY-MM-DD') + ' ' + startTime;
  console.log(displayStartTime);
  console.log(dayjs(displayStartTime).valueOf());
};

let loginInfoMap = ref<any>();

getElectronApi().onAddCouponSuccess((param: any) => {
 
  $td.closeLoading();
  emit("submit");
  flag.value = false;

  $td.message.success(`操作成功`);
});

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
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  align-items: center;
}
</style>
