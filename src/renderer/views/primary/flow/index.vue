<template>
	<div class="box">
		<div class="bottom">

			<div class="shops-list">

				<div style="display: flex;">
					<a-switch v-model:checked="isSelectAll" checked-children="点击取消全选" un-checked-children="点击全选"
						@change="selectAllShops" />
					<a-button size="small" @click="getSelectShopsData">
						获取选中店铺数据
					</a-button>

				</div>
				<a-button size="small" @click="deleteGoods('delist')" style="margin-top: 10px;margin-bottom: 10px;">
					下架选中商品
				</a-button>
				<a-button size="small" @click="deleteGoods('delete')" style="margin-top: 10px;margin-bottom: 10px;margin-left: 10px;">
					删除选中商品
				</a-button>
				<a-tree v-model:expandedKeys="expandedKeys" v-model:selectedKeys="selectedKeys"
					v-model:checkedKeys="checkedKeys" checkable :tree-data="treeData" :field-names="fieldNames">
					<template #title="{ name, key }">
						<span v-if="key === '0-0-1'" style="color: #1890ff">{{ name }}</span>
						<template v-else>{{ name }}</template>
					</template>
				</a-tree>
			</div>

			<div class="content">

				<a-table :columns="columns" :data-source="pageData" :scroll="{ x: 1000, y: 600 }" :pagination="false"
				:row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
				>
					<template #bodyCell="{ column, index, record }">
						<template v-if="column.key === 'operation'">
							
						</template>

						<template v-else-if="column.key === 'status'">
							<a-tag v-if="record.status == 'success'" :bordered="false" color="success">获取成功</a-tag>
							<a-tag color="processing" v-else-if="record.status == 'retrieving'">
								<template #icon>
									<sync-outlined :spin="true" />
								</template>
								获取中
							</a-tag>
							<a-tag v-else-if="record.status == 'not-login'" :bordered="false" color="warning">未登录</a-tag>

							<a-tag v-else-if="record.status == 'error'" :bordered="false" color="error">获取失败</a-tag>

							<a-tag v-else :bordered="false" color="volcano">待获取</a-tag>
						</template>

						<template v-else-if="column.key === 'title'">
							<!-- {{ record.item?.title }} -->
							<a-tooltip>
								<template #title> {{ record.item?.title }} </template>
								{{ record.item?.title.substring(0, 6) }}... 
							</a-tooltip>
						</template>		
						<template v-else-if="column.key === 'crawlerTime'">
							{{ record.crawlerTime ? $td.formatDT(record.crawlerTime) : '/' }}
						</template>


						<template v-else-if="column.key === 'itmUv'">
							{{ record.itmUv?.value }}
						</template>		
						<template v-else-if="column.key === 'payAmt'">
							{{ record.payAmt?.value?.toFixed(2) }}
						</template>
						<template v-else-if="column.key === 'rfdSucGoodsAmt'">
							{{ record.rfdSucGoodsAmt?.value?.toFixed(2) }}
						</template>
						<template v-else-if="column.key === 'payItmCnt'">
							{{ record.payItmCnt?.value }}
						</template>
						<template v-else-if="column.key === 'crtItmQty'">
							{{ record.crtItmQty?.value }}
						</template>	
						<template v-else-if="column.key === 'online'">
							<div v-if="record.item">
								<a-tag color="green" v-if="record.item?.online">当前在线</a-tag>
							<a-tag color="red" v-else>已下架</a-tag>
							</div>

						</template>
						<template v-else-if="column.key === 'pictUrl'">
						<div v-if="record.item">
							<a-image :src="record.item?.pictUrl" style="width: 25px;height: 25px;"
							 fallback="data:image/png;base64,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"
							></a-image>
						</div>
						</template>
					</template>
				</a-table>

				<div class="pagination">
        <a-pagination
          v-model:current="pageParam.page"
          :total="total"
          :pageSize="pageParam.pageSize"
          :showSizeChanger="false"
          show-less-items
          @change="changePage"
        />

				<div>
					已勾选：<span style="font-weight: 900;">{{ state.selectedRowKeys.length }}</span> 个商品

					共：<span style="font-weight: 900;">{{ total }}</span> 个商品
				</div>
      </div>
			</div>
		</div>
	</div>

	<ActionOfModal ref="actionOfModal" @submit="getSelectShopsData" />
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import $td from "../../../../lib/td";
import {
	SyncOutlined,
} from '@ant-design/icons-vue';

import ActionOfModal from "./actionOfModal/index.vue";

import type { TreeProps } from 'ant-design-vue';
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const checkedKeys = ref<string[]>([]);

let actionOfModal = ref<any>(null);

let getElectronApi = () => {
	return (window as any).primaryWindowAPI;
};

let loading = ref(false);


let requestParam = ref({

});

let pageParam = ref({
	page: 1,
	pageSize: 20,
});

let total = ref(0);

let isSelectAll = ref(false);

const selectAllShops = () => {
	checkedKeys.value = []
	if (isSelectAll.value) {
		for(let it of bodyData.value){
			let typeItem = treeData.value.find((item: any) => item.name == it.type);
			
			let child =  typeItem.child.find((item: any) => item.key == it.id);

			if(!child.disabled){
				checkedKeys.value.push(child.key)
			}
		}

	}
}

let pageData = ref<any>([])

const fieldNames: TreeProps['fieldNames'] = {
	children: 'child',
	title: 'name',
};

const treeData: any = ref([

]);
watch(expandedKeys, () => {
	console.log('expandedKeys', expandedKeys);
});
watch(selectedKeys, () => {
	console.log('selectedKeys', selectedKeys);
});
watch(checkedKeys, () => {
	console.log('checkedKeys', checkedKeys);
});



const getSelectShopsData = () => {
	// let selectShops = bodyData.value.filter((item: any) => {
	// 	return selectedKeys.value.includes(item.id);
	// });

	console.log(checkedKeys.value);

	let selectShops = bodyData.value.filter((item: any) => {
		return checkedKeys.value.includes(item.id);
	});


	if (selectShops.length == 0) {
		$td.message.error("请选择店铺");
		return;
	}
	pageParam.value.page = 1;
	total.value = 0;

	console.log(selectShops);
	pageData.value = [];


	for (let i = 0; i < selectShops.length; i++) {
		let item = selectShops[i];
		console.log(item);

		getCurrentData(selectShops[i]);
	}
};

const changePage = (page: number) => {
	pageParam.value.page = page;
	
	let selectShops = bodyData.value.filter((item: any) => {
		return checkedKeys.value.includes(item.id);
	});


	if (selectShops.length == 0) {
		$td.message.error("请选择店铺");
		return;
	}
	console.log(selectShops);
	pageData.value = [];


	for (let i = 0; i < selectShops.length; i++) {
		let item = selectShops[i];
		console.log(item);

		getCurrentData(selectShops[i]);
	}
};

/**
 	{
				"mainProductId": {
					"value": "855309350968"
				},
				"seGuideUv": {
					"value": 0
				},
				"crtAmt": {
					"value": 0
				},
				"crtItmQty": {
					"cycleCrc": 0,
					"syncCrc": 0.1136363636,
					"value": 49
				},
				"hasAction": false,
				"rfdSucGoodsAmt": {
					"value": 0
				},
				"itemCltByrCnt": {
					"value": 0
				},
				"sellerId": {
					"value": "RAzN8HWKnfWSibZwF3LMiqgK77cNnFMxSGxwiyYGnK8WBUtNbnq"
				},
				"payItmCnt": {
					"cycleCrc": 0,
					"value": 42
				},
				"uvAvgValue": {
					"value": 0
				},
				"itemStatus": "已下架",
				"isMonitored": false,
				"itmUv": {
					"value": 0
				},
				"seGuidePayByrCnt": {
					"value": 0
				},
				"statDate": {
					"value": 1734969600000
				},
				"item": {
					"itemId": "855309350968",
					"mainProductId": "855309350968",
					"online": false,
					"pictUrl": "//img.alicdn.com/bao/uploaded/i3/2218777071964/O1CN01HoJzRp1QNYsvOldAh_!!2218777071964.jpg",
					"mallItem": false,
					"detailUrl": "//item.taobao.com/item.htm?id=855309350968",
					"title": "1",
					"userId": "RAzN8HWKnfWSibZwF3LMiqgK77cNnFMxSGxwiyYGnK8WBUtNbnq",
					"categoryId": 50160001,
					"mainSubItemType": "notChannel"
				},
				"payByrCnt": {
					"cycleCrc": 0,
					"value": 42
				},
				"isSubItem": {
					"value": "0"
				},
				"payRate": {
					"value": 0
				},
				"hasSku": true,
				"seGuidePayRate": {
					"value": 0
				},
				"itmStayTime": {
					"value": 0
				},
				"stayTimeAvg": {
					"value": 0
				},
				"isTmallNewItem": false,
				"payAmt": {
					"cycleCrc": 0,
					"value": 0.42000000000000004
				},
				"itemCartCnt": {
					"value": 0
				},
				"itemId": {
					"value": "855309350968"
				},
				"payPct": {
					"cycleCrc": 0,
					"value": 0.01
				},
				"sucRefundAmt": {
					"value": 0
				},
				"cateLevel2Id": {
					"value": 50160001
				},
				"subPayOrdAmt": {
					"cycleCrc": 0,
					"value": 0.4200000000000002
				},
				"itmPv": {
					"value": 0
				},
				"cateId": {
					"value": 50160001
				},
				"brandId": {
					"value": 0
				},
				"cateLevel1Id": {
					"value": 50158001
				},
				"visitCltRate": {},
				"crtByrCnt": {
					"cycleCrc": 0,
					"syncCrc": 0.1162790698,
					"value": 48
				},
				"itmBounceRate": {
					"value": 0
				},
				"crtRate": {
					"value": 0
				},
				"subPayOrdItmQty": {
					"cycleCrc": 0,
					"value": 42
				}
			},
 */

const columns: any = [
	{
		title: "用户名",
		dataIndex: "username",
		key: "username",
		align: "center",
		width: 150,
		fixed: 'left',
	},
	{
		title: "店铺名称",
		dataIndex: "shopName",
		key: "shopName",
		align: "center",
		fixed: 'left',
		width: 120
	},

	//状态
	{
		title: "状态",
		dataIndex: "status",
		key: "status",
		align: "center",
		width: 120,
	},
	{
		title: "爬取时间",
		dataIndex: "crawlerTime",
		key: "crawlerTime",
		align: "center",
		width: 150,
	},

	//商品名称
	{
		title: "商品名称",
		dataIndex: "title",
		key: "title",
		align: "center",
		width: 120,
	},
	//商品图片
	{
		title: "商品图片",
		dataIndex: "pictUrl",
		key: "pictUrl",
		align: "center",
		width: 120,
	},
	//商品状态
	{
		title: "商品状态",
		dataIndex: "online",
		key: "online",
		align: "center",
		width: 120,
	},
	{
		title: "商品访问数",
		dataIndex: "itmUv",
		key: "itmUv",
		align: "center",
		width: 120,
	},
	//支付金额
	{
		title: "支付金额",
		dataIndex: "payAmt",
		key: "payAmt",
		align: "center",
		width: 120,
	},
	//成功退款金额
	{
		title: "成功退款金额",
		dataIndex: "rfdSucGoodsAmt",
		key: "rfdSucGoodsAmt",
		align: "center",
		width: 120,
	},
	//支付件数
	{
		title: "支付件数",
		dataIndex: "payItmCnt",
		key: "payItmCnt",
		align: "center",
		width: 120,
	},
	//商品加购数量
	{
		title: "商品加购数量",
		dataIndex: "crtItmQty",
		key: "crtItmQty",
		align: "center",
		width: 120,
	},


	//操作
	// {
	// 	title: "操作",
	// 	dataIndex: "operation",
	// 	key: "operation",
	// 	align: "center",
	// 	width: 120,
	// 	fixed: 'right',
	// },
];


let paramStart = ref({
	id: "",
	username: "",
	shopName: "/",
	remark: "",
	status: "volcano",
	crawlerTime: "",
	title: "/",
	pictUrl: "/",
	payAmt: 0,
	rfdSucGoodsAmt: 0,
	payItmCnt: 0,
	crtItmQty: 0,
	itmUv: 0,
	service: "/",
});

const bodyData = ref<any>([
]);


const getShopsInfo = (record: any) => {
	console.log("原始信息");

	console.log(record);

	getElectronApi().getGoodsFlow(JSON.stringify(record), true,JSON.stringify(pageParam.value));
};


const getBodyData = () => {
	// $td.openLoading();
	$td.updateLoadding(loading);
	$td.request
		.request({
			url: "/admin/shops/list",
			method: "POST",
			data: requestParam.value,
		})
		.then((res: any) => {
			$td.updateLoadding(loading);

			bodyData.value = res.data || []

			treeData.value = []

			let typeMap: any = {}


			for (let i = 0; i < bodyData.value.length; i++) {
				let item = bodyData.value[i];

				if (!item.type) {
					item.type = "未分组"
				}

				if (!typeMap[item.type]) {
					typeMap[item.type] = []
				}
			}


			//拿到所有的key
			let keys = Object.keys(typeMap);

			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				let item = {
					name: key,
					key: key,
					child: []
				}
				treeData.value.push(item);
			}

			console.log(bodyData.value);
			
			for (let i = 0; i < bodyData.value.length; i++) {
				let item = bodyData.value[i];
				//组装treeData
				//按照type分组
				let type = item.type;

				//找到对应的type
				let typeItem = treeData.value.find((item: any) => item.name == type);

				if (typeItem) {
					typeItem.child.push({
						name: item.username,
						key: item.id,
						disabled: item.disabled || false
					});
				}


				let temp = ref(JSON.parse(JSON.stringify(paramStart.value)));

				temp.value.id = item.id;
				temp.value.username = item.username;
				temp.value.remark = item.remark;

				item = Object.assign(item, temp.value);


				setTimeout(() => {
					getShopsInfo(item);
				}, i * 200);
			}
		});
};

getBodyData();



//监听主进程响应内容
getElectronApi().onGetShopsInfo((param: any) => {
	let requestParam = JSON.parse(param);
	//在bodData中找到对应的数据并更新
	let item = bodyData.value.find((item: any) => item.id == requestParam.id);
	item = Object.assign(item, requestParam);

	console.log("获取到的数据", param);
	state.selectedRowKeys = []
	

	for (let i = 0; i < bodyData.value.length; i++) {
		let item = bodyData.value[i];
		if (item.status == "success") {
			

			//如果选中的id中有这个id并且状态是success并且pageData中没有这个id
			if (checkedKeys.value.includes(item.id)) {
				//过滤掉pageData中的这个id
				pageData.value = pageData.value.filter((it: any) => it.id != item.id);

				if(item.total > total.value){
					total.value = item.total;
				}

				//组装数据
				// console.log(item);
				
				let goodsFlowData = item.goodsFlow			
				for (let i = 0; i < goodsFlowData.length; i++) {
					let goodsFlowItem = goodsFlowData[i];
					goodsFlowItem.username = item.username;
					goodsFlowItem.shopName = item.shopName;
					goodsFlowItem.remark = item.remark;
					goodsFlowItem.id = item.id;
					goodsFlowItem.status = item.status;
					goodsFlowItem.crawlerTime = item.crawlerTime;
					goodsFlowItem.key = goodsFlowItem.mainProductId?.value;
					pageData.value.push(goodsFlowItem);

					

					//如果商品流量为0自动勾选
					if(goodsFlowItem.itmUv?.value == 0){
						state.selectedRowKeys.push(goodsFlowItem.mainProductId?.value);
					}
				}

				//根据商品流量排序 升序
				pageData.value.sort((a: any, b: any) => {
					return a.itmUv?.value - b.itmUv?.value;
				});



			}
		}
		else if (item.status == 'not-login') {
			//根据item.type找到在treeData中的位置
			let typeItem = treeData.value.find((it: any) => it.name == item.type);

			if (typeItem) {
				let child = typeItem.child.find((it: any) => it.key == item.id);
				if (child) {
					child.disabled = true;
				}
			}

			//从pageData中删除
			let index = pageData.value.findIndex((it: any) => it.id == item.id);
			if (index != -1) {
				pageData.value.splice(index, 1);
			}

		} else if (item.status == "retrieving") {
			//如果pageData中没有这个key
			let pageItem = pageData.value.find((it: any) => it.id == item.id);
			if (!pageItem) {
				pageData.value.push(item);
			}
		}
	}

});

const getCurrentData = (item: any) => {

	let temp = ref(JSON.parse(JSON.stringify(paramStart.value)));

	temp.value.id = item.id;
	temp.value.username = item.username;
	temp.value.remark = item.remark;

	item = Object.assign(item, temp.value);

	let param = JSON.stringify(item);

	getElectronApi().getGoodsFlow(param, false,JSON.stringify(pageParam.value));
};

const addCoupon = () => {
	console.log(checkedKeys.value);

	let selectShops = bodyData.value.filter((item: any) => {
		return checkedKeys.value.includes(item.id);
	});


	if (selectShops.length == 0) {
		$td.message.error("请选择需要添加优惠券的店铺");
		return;
	}

	let msg = ``

	console.log(selectShops);
	

	for(let i = 0; i < selectShops.length; i++){
		msg += `${selectShops[i].username}  `;
	}

	$td.Modal.confirm({
		title: "提示",
		content: `是否确认为 ${msg} 添加优惠券`,
		okText: "确认",
		cancelText: "取消",
		onOk: () => {
			actionOfModal.value.open(JSON.parse(JSON.stringify(selectShops)));
		}
	});

	
}

const deleteGoods = (type:any) => {
	//拿到recordList中所有的templateCode和username
	let msg = `是否确认 ${type == 'delete' ? '删除' : '下架'} 选中的商品`;


	$td.Modal.confirm({
		title: "提示",
		content: msg,
		okText: "确认",
		cancelText: "取消",
		onOk: () => {
			console.log("删除商品");
			console.log(state.selectedRowKeys);

			if(state.selectedRowKeys.length == 0){
				$td.message.error("请选择商品");
				return;
			}

			// //根据selectedRowKeys找到对应的record
			let recordList = pageData.value.filter((item: any) => {
				return state.selectedRowKeys.includes(item.mainProductId?.value);
			});

			let requestParam = new Map();

			for(let i = 0; i < recordList.length; i++){
				let item = recordList[i];
				
				if("delist" == type && !item.item.online){
					$td.message.error(`商品：${item.item.title} 已下架`);
					return;
				}

				if("delete" == type && item.item.online){
					$td.message.error(`商品：${item.item.title} 未下架 请下架后再删除`);
					return;
				}

				if(!requestParam.has(item.username)){
					requestParam.set(item.username, []);
				}
				requestParam.get(item.username).push(item.mainProductId?.value);
			}


			$td.openLoading();
			getElectronApi().deleteGoods(requestParam,type);
		}
	});


}
let flag = ref(true);
//监听删除优惠券
getElectronApi().onDeleteGoodsSuccess((param: any) => {

	$td.closeLoading();
	getSelectShopsData();
	
	if(flag.value){
		flag.value = false;
		$td.message.success(param);
		getSelectShopsData();
		setTimeout(() => {
			flag.value = true;
		}, 1000);
	}

})



const state = reactive<{
  selectedRowKeys: any[];
  loading: boolean;
}>({
  selectedRowKeys: [], // Check here to configure the default column
  loading: false,
});

const onSelectChange = (selectedRowKeys: any[]) => {
  console.log('selectedRowKeys changed: ', selectedRowKeys);
  state.selectedRowKeys = selectedRowKeys;
};

getElectronApi().onShowSuccessMsgbox((msg: any) => {
	console.log("msg", msg);
	
  $td.closeLoading();
  $td.message.success(msg);
});

getElectronApi().onShowErrorMsgbox((msg: any) => {
	console.log("msg", msg);
	
  $td.closeLoading();
  $td.message.error(msg);
});
</script>

<style scoped>
.box {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.condition {
	height: 46px;
}

.bottom {
	width: 100%;
	/* height: calc(100% - 28px); */
	height: 100%;
	display: flex;
	/* flex-direction: column;
	align-items: flex-end;
	border-radius: 4px; */
}

.shops-list {
	width: 18%;
	height: 100%;
	max-height: 100%;
	overflow-y: auto;
	background-color: white;
	overflow: scroll;
	box-sizing: border-box;
	text-align: center
}

.content {
	width: 82%;
	/* height: calc(100% - 36px); */
	height: 100%;
	max-height: 100%;
	overflow-y: auto;
	background-color: white;
	overflow: scroll;
	box-sizing: border-box;
}

.pagination {
	width: 100%;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: white;
	box-sizing: border-box;
}

.center {
	text-align: center !important;
}

.ant-form-item {
	margin-bottom: 10px;
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
	justify-content: flex-end;
}

.top {
	width: 100%;
	height: 62px;
	background-color: #fafafa;
	/* background-color: #6b6d71; */
	box-sizing: border-box;
	padding: 5px 10px;
	border-radius: 4px;
	margin-bottom: 10px;
	display: flex;
	justify-content: space-between;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	overflow-x: auto;
}

.info-item {
	height: 100%;
	/* width: 140px; */
	min-width: 140px;

	display: flex;
	/* align-items: center; */
	justify-content: space-between;
	flex-direction: column;
}

.info-title {
	min-width: 140px;
	font-size: 14px;
	color: #333;
	margin-right: 10px;
	text-align: center;
}

.info-content {
	min-width: 140px;
	font-size: 14px;
	color: #333;
	text-align: center;
}
</style>
