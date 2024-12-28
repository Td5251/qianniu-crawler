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
				<a-button size="small" @click="addCoupon" style="margin-top: 10px;margin-bottom: 10px;">
					添加优惠券
				</a-button>
				<div>
					<a-button size="small" @click="deleteCoupon('pause')" style="margin-top: 10px;margin-bottom: 10px;">
					暂停选中优惠券
				</a-button>
				<a-button size="small" @click="deleteCoupon('delete')" style="margin-left: 10px;">
					删除选中优惠券
				</a-button>
				</div>
				<a-tree v-model:expandedKeys="expandedKeys" v-model:selectedKeys="selectedKeys"
					v-model:checkedKeys="checkedKeys" checkable :tree-data="treeData" :field-names="fieldNames">
					<template #title="{ name, key }">
						<span v-if="key === '0-0-1'" style="color: #1890ff">{{ name }}</span>
						<template v-else>{{ name }}</template>
					</template>
				</a-tree>
			</div>

			<div class="content">

				<a-table :columns="columns" :data-source="pageData" :scroll="{ x: 1000, y: 630 }" :pagination="false"
				:row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }"
				>
					<template #bodyCell="{ column, index, record }">
						<template v-if="column.key === 'operation'">
							<!-- <a-button v-if="record.status == 'success' && record.statusDesc?.label == '领取中'" size="small" type="default" @click="deleteCoupon([record],'pause')"
							>
								暂停
							</a-button>

							<a-button size="small" type="default" @click="deleteCoupon([record],'delete')">
								删除
							</a-button> -->
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
							<a-tag v-else :bordered="false" color="volcano">待获取</a-tag>
						</template>

						<template v-else-if="column.key === 'couponStatus'">
							{{ record.statusDesc?.label }}
						</template>
						<template v-else-if="column.key === 'personLimit'">
							{{ record.personLimit == -1 ? '不限' : record.personLimit }}
						</template>

						<template v-else-if="column.key === 'spreadStartTime'">
							{{ record.spreadStartTime ? $td.formatDT(record.spreadStartTime) : '/' }}
						</template>

						<template v-else-if="column.key === 'startTime'">
							{{ record.startTime ? $td.formatDT(record.startTime) : '/' }}
						</template>

						<template v-else-if="column.key === 'endTime'">
							{{ record.endTime ? $td.formatDT(record.endTime) : '/' }}
						</template>


					</template>
				</a-table>
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
				"mainAccountId": null,
				"operatorId": null,
				"activityId": null,
				"detailId": null,
				"itemId": null,
				"skuId": null,
				"id": null,
				"draftId": null,
				"useDraft": false,
				"templateId": null,
				"writeType": 0,
				"bizCode": null,
				"name": "店铺券1223",
				"description": null,
				"startTime": 1734883200000,
				"endTime": 1735055999000,
				"warmupStartTime": null,
				"status": 0,
				"rawStatus": null,
				"toolCode": null,
				"promotionName": null,
				"type": null,
				"actChannel": null,
				"channel": null,
				"actFlag": null,
				"wirelessActInfo": null,
				"createTime": 1734953745000,
				"modifyTime": null,
				"promotionLevel": null,
				"detailUpdateType": null,
				"crowdId": null,
				"crowdType": null,
				"details": null,
				"processFailDetails": null,
				"activityLimitConfigList": null,
				"itemIds": null,
				"activityType": null,
				"preCheck": null,
				"mktJob": null,
				"mktJobConfigDTO": null,
				"operationType": null,
				"options": null,
				"promotionType": null,
				"participateRange": null,
				"mktChannel": null,
				"mktJobInstanceVO": null,
				"fromHSF": false,
				"feature": {
					"activityId": "100046232520",
					"amount": "1000",
					"appName": "mkt-shell",
					"applyPlace": "1,2,3",
					"bizSource": "",
					"buyerDriveFlag": "true",
					"calculateLevel": "2",
					"couponV2": "1",
					"detailId": "1897839387420",
					"disEndTime": "20241224235959",
					"disStartTime": "20241223000000",
					"discountFeeMode": "0",
					"draftId": "818314098",
					"goBuyerGeneralLimit": "true",
					"mkt_source_biz": "$|$|$|$",
					"opeId": "2218777071964",
					"options": "19",
					"participateId": "2218777071964",
					"participateRange": "0",
					"participateType": "3",
					"perLimit": "3",
					"perLimitType": "0",
					"rbac": "true",
					"regionId": "",
					"siteId": "",
					"spreadEndTime": "20241224235959",
					"spreadId": "12501747017",
					"spreadStartTime": "20241223000000",
					"spreadType": "1",
					"startFee": "99900",
					"t_appName": "mkt-shell",
					"timeMode": "0",
					"toolCode": "shopbonus",
					"toolId": "108405001",
					"ump_op": "decreaseMoney\u00031000\u00030\u0002amountAt\u000399900\u00030\u0002deviceInfo\u0003all\u00030\u0002areas\u0003all\u00030\u0002siteId\u00031\u00030\u0002regionId\u0003all\u00030\u0002source\u00030\u00030\u0002terminal\u00030\u00030\u0002feature\u0003resourceType\\\u00030\\\u0002resourceValue\\\u00037110621005\\\u0002discountFeeMode\\\u00030\u00030\u0002",
					"useAt": "0",
					"uuid": "ebeec70c8b4f44bbb8eedf2b5b8c00c5"
				},
				"operationParam": {},
				"extra": {},
				"errorType": null,
				"errorMsg": null,
				"outerReq": false,
				"needFillDetail": true,
				"detailSkipActCheck": false,
				"onlyProcessAllDetails": false,
				"skipTagFill": false,
				"templateFileMark": null,
				"wireless": false,
				"recordFlag": 0,
				"allowParticipateRepeat": null,
				"requestFrom": null,
				"referParam": null,
				"skipOperationLog": null,
				"money": null,
				"count": null,
				"actNotSupportModify": null,
				"forceDelete": null,
				"preCheckNotInterdict": null,
				"uuid": "ebeec70c8b4f44bbb8eedf2b5b8c00c5",
				"templateCode": 7110621005,
				"couponType": 0,
				"subType": 0,
				"personLimit": 3,
				"totalCount": 1000,
				"applyCount": 0,
				"businessUnit": 0,
				"spreadStartTime": 1734883200000,
				"spreadEndTime": 1735055999000,
				"displayStartTime": 1734883200000,
				"displayEndTime": 1735055999000,
				"couponTag": null,
				"amountYuan": "10",
				"startFeeYuan": "999",
				"bizSource": null,
				"timeMode": "0",
				"effectiveTimeMode": "FIXED_START_END_TIME",
				"effectiveInterval": null,
				"effectiveMin": null,
				"effectiveHour": null,
				"effectiveDay": null,
				"lowestDiscount": null,
				"statusDesc": {
					"value": "FINISH",
					"label": "已结束"
				},
				"tagId": "A",
				"tagName": "全网自动推广",
				"tagColor": "#24AA00",
				"threshold": "满999减10",
				"optionList": [
					{
						"text": "查看活动",
						"url": null,
						"enable": true,
						"order": null,
						"type": "view",
						"action": null,
						"supportStatus": [
							"NOT_START",
							"APPLING",
							"APPLY_FINISH",
							"FINISH"
						]
					},
					{
						"text": "查看数据",
						"url": null,
						"enable": true,
						"order": null,
						"type": "data",
						"action": null,
						"supportStatus": [
							"APPLING",
							"APPLY_FINISH",
							"FINISH"
						]
					},
					{
						"text": "复制活动",
						"url": null,
						"enable": true,
						"order": null,
						"type": "copy",
						"action": null,
						"supportStatus": [
							"NOT_START",
							"APPLING",
							"APPLY_FINISH",
							"FINISH"
						]
					},
					{
						"text": "删除活动",
						"url": null,
						"enable": true,
						"order": null,
						"type": "delete",
						"action": null,
						"supportStatus": [
							"FINISH"
						]
					}
				],
				"activityUrl": null,
				"itemSize": null,
				"unConditional": false,
				"expireRemind": null,
				"relActivity": null,
				"itemInfoList": null,
				"bizTagId": null,
				"fissionActivityId": null,
				"token": null,
				"couponShareLink": null,
				"couponEncrypted": null,
				"fissionShape": null
			}
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
	{
		title: "客服",
		dataIndex: "service",
		key: "service",
		align: "center",
		width: 120
	},
	//备注
	{
		title: "备注",
		dataIndex: "remark",
		key: "remark",
		align: "center",
		width: 120,
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

	//活动信息
	{
		title: "活动信息",
		dataIndex: "name",
		key: "name",
		align: "center",
		width: 120,
	},

	//	推广方式
	{
		title: "推广方式",
		dataIndex: "tagName",
		key: "tagName",
		align: "center",
		width: 120,
	},

	//状态
	{
		title: "优惠券状态",
		dataIndex: "couponStatus",
		key: "couponStatus",
		align: "center",
		width: 120,
	},

	//优惠方式
	{
		title: "优惠方式",
		dataIndex: "threshold",
		key: "threshold",
		align: "center",
		width: 120,
	},

	//领取量
	{
		title: "领取量",
		dataIndex: "applyCount",
		key: "applyCount",
		align: "center",
		width: 120,
	},

	{
		title: "每人限领",
		dataIndex: "personLimit",
		key: "personLimit",
		align: "center",
		width: 120,
	},


	//发放量
	{
		title: "发放量",
		dataIndex: "totalCount",
		key: "totalCount",
		align: "center",
		width: 120,
	},

	//透出时间
	{
		title: "透出时间",
		dataIndex: "spreadStartTime",
		key: "spreadStartTime",
		align: "center",
		width: 150,
	},

	//开始时间
	{
		title: "开始时间",
		dataIndex: "startTime",
		key: "startTime",
		align: "center",
		width: 150,
	},
	//结束时间
	{
		title: "结束时间",
		dataIndex: "endTime",
		key: "endTime",
		align: "center",
		width: 150,
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
	shopLevel: "/",
	aggregateBalance: "/",
	payAmount: '/',
	refund: '/',
	netAmount: '/',
	promotionCost: '/',
	keywordCost: '/',
	accurateAudienceCost: '/',
	smartSceneCost: '/',
	taobaoCommission: '/',
	shopCustomerNumber: '/',
	paySubOrderNumber: '/',
	payNumber: '/',
	visitorNumber: '/',
	statisticsPageViews: '/',
	statisticsAddToCartNumber: '/',
	addToCartPeopleNumber: '/',
	collectionPeopleNumber: '/',
	consultationRate: '/',
	refundRate: '/',
	statisticsConversionRate: '/',
	statisticsUnitPrice: '/',
	oldCustomerRepurchaseRate: '/',
	oldCustomerRepurchaseAmount: '/',


});

const bodyData = ref<any>([
]);


const getShopsInfo = (record: any) => {
	console.log("原始信息");

	console.log(record);

	getElectronApi().getCouponData(JSON.stringify(record), true);
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


	for (let i = 0; i < bodyData.value.length; i++) {
		let item = bodyData.value[i];
		if (item.status == "success") {

			//如果选中的id中有这个id并且状态是success并且pageData中没有这个id
			if (checkedKeys.value.includes(item.id)) {
				//过滤掉pageData中的这个id
				pageData.value = pageData.value.filter((it: any) => it.id != item.id);

				//组装数据
				let couponData = item.couponData;
				for (let i = 0; i < couponData.length; i++) {
					let couponItem = couponData[i];
					couponItem.username = item.username;
					couponItem.shopName = item.shopName;
					couponItem.remark = item.remark;
					couponItem.id = item.id;
					couponItem.status = item.status;
					couponItem.crawlerTime = item.crawlerTime;
					couponItem.key = couponItem.templateCode;
					pageData.value.push(couponItem);
				}

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

	getElectronApi().getCouponData(param, false);
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

const deleteCoupon = (type:any) => {
	//拿到recordList中所有的templateCode和username
	let msg = `是否确认 ${type == 'delete' ? '删除' : '暂停'} 选中的优惠券`;

	$td.Modal.confirm({
		title: "提示",
		content: msg,
		okText: "确认",
		cancelText: "取消",
		onOk: () => {

			if(state.selectedRowKeys.length == 0){
				$td.message.error("请选择优惠券");
				return;
			}

			//根据selectedRowKeys找到对应的record
			let recordList = pageData.value.filter((item: any) => {
				return state.selectedRowKeys.includes(item.templateCode);
			});

			let templateCodeList = recordList.map((item: any) => {
				return {
					templateCode: item.templateCode,
					username: item.username
				}
			});

			// let templateCodeList = recordList.map((item: any) => {
			// 						return {
			// 							templateCode: item.templateCode,
			// 							username: item.username
			// 						}
			// });
	
			getElectronApi().deleteCoupon(JSON.stringify(templateCodeList),type);
		}
	});


}
let flag = ref(true);
//监听删除优惠券
getElectronApi().onDeleteCouponSuccess((param: any) => {

	console.log("删除优惠券成功", param);
	
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
