<template>
	<div class="box">
		<div class="top">
			<div class="info-item" v-for="item in topColumns">
				<div class="info-title">
					{{ item.title }}
				</div>
				<div class="info-content">
					{{ statistics[item.dataIndex]?.toFixed(2) }}
				</div>
			</div>
		</div>

		<div class="bottom">

			<div class="shops-list">

				<div style="display: flex;">
					<a-switch v-model:checked="isSelectAll" checked-children="点击取消全选" un-checked-children="点击全选"
						@change="selectAllShops" />
					<a-button size="small" @click="getSelectShopsData">
						获取选中店铺数据
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

				<a-table :columns="columns" :data-source="pageData" :scroll="{ x: 1000, y: 520 }" :pagination="false">
					<template #bodyCell="{ column, index, record }">
						<template v-if="column.key === 'operation'">
							<a-button @click="getCurrentData(record)" size="small"
								:disabled="record.status == 'not-login' || record.status == 'retrieving'">获取最新数据</a-button>
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

						<template v-else-if="column.key === 'crawlerTime'">
							{{ record.crawlerTime ? $td.formatDT(record.crawlerTime) : '/' }}
						</template>


					</template>
				</a-table>
			</div>

		</div>
	</div>

</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import $td from "../../../../lib/td";
import {
	SyncOutlined,
} from '@ant-design/icons-vue';

import type { TreeProps } from 'ant-design-vue';
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);
const checkedKeys = ref<string[]>([]);

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


	for (let i = 0; i < selectShops.length; i++) {
		let item = selectShops[i];
		console.log(item);

		getCurrentData(selectShops[i]);
	}
};



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


	//支付金额
	{
		title: "支付金额",
		dataIndex: "payAmount",
		key: "payAmount",
		align: "center",
		width: 120
	},

	//成功退款
	{
		title: "成功退款金额",
		dataIndex: "refund",
		key: "refund",
		align: "center",
		width: 120
	},

	//净支付金额
	{
		title: "净支付金额",
		dataIndex: "netAmount",
		key: "netAmount",
		align: "center",
		width: 120
	},
	//全站推广花费
	{
		title: "全站推广花费",
		dataIndex: "promotionCost",
		key: "promotionCost",
		align: "center",
		width: 120
	},
	//关键词推广花费
	{
		title: "关键词推广花费",
		dataIndex: "keywordCost",
		key: "keywordCost",
		align: "center",
		width: 120
	},
	//精准人群推广花费
	{
		title: "精准人群推广花费",
		dataIndex: "accurateAudienceCost",
		key: "accurateAudienceCost",
		align: "center",
		width: 120
	},
	//智能场景花费
	{
		title: "智能场景花费",
		dataIndex: "smartSceneCost",
		key: "smartSceneCost",
		align: "center",
		width: 120
	},
	//淘宝客佣金
	{
		title: "淘宝客佣金",
		dataIndex: "taobaoCommission",
		key: "taobaoCommission",
		align: "center",
		width: 120
	},
	//店铺客户数
	{
		title: "店铺客户数",
		dataIndex: "shopCustomerNumber",
		key: "shopCustomerNumber",
		align: "center",
		width: 120
	},
	//支付转化率
	{
		title: "支付转化率",
		dataIndex: "statisticsConversionRate",
		key: "statisticsConversionRate",
		align: "center",
		width: 120
	},
	//客单价
	{
		title: "客单价",
		dataIndex: "statisticsUnitPrice",
		key: "statisticsUnitPrice",
		align: "center",
		width: 120
	},
	//老客复购率
	{
		title: "老客复购率",
		dataIndex: "oldCustomerRepurchaseRate",
		key: "oldCustomerRepurchaseRate",
		align: "center",
		width: 120
	},
	//老客复购金额
	{
		title: "老客复购金额",
		dataIndex: "oldCustomerRepurchaseAmount",
		key: "oldCustomerRepurchaseAmount",
		align: "center",
		width: 120
	},
	//支付子订单数
	{
		title: "支付子订单数",
		dataIndex: "paySubOrderNumber",
		key: "paySubOrderNumber",
		align: "center",
		width: 120
	},
	//支付件数
	{
		title: "支付件数",
		dataIndex: "payNumber",
		key: "payNumber",
		align: "center",
		width: 120
	},
	//访客数
	{
		title: "访客数",
		dataIndex: "visitorNumber",
		key: "visitorNumber",
		align: "center",
		width: 120
	},
	//浏览量
	{
		title: "浏览量",
		dataIndex: "statisticsPageViews",
		key: "statisticsPageViews",
		align: "center",
		width: 120
	},
	//加购件数
	{
		title: "加购件数",
		dataIndex: "statisticsAddToCartNumber",
		key: "statisticsAddToCartNumber",
		align: "center",
		width: 120
	},
	//加购人数
	{
		title: "加购人数",
		dataIndex: "addToCartPeopleNumber",
		key: "addToCartPeopleNumber",
		align: "center",
		width: 120
	},
	//收藏人数
	{
		title: "收藏人数",
		dataIndex: "collectionPeopleNumber",
		key: "collectionPeopleNumber",
		align: "center",
		width: 120
	},
	//咨询率
	{
		title: "咨询率",
		dataIndex: "consultationRate",
		key: "consultationRate",
		align: "center",
		width: 120
	},
	//成功退款率
	{
		title: "成功退款率",
		dataIndex: "refundRate",
		key: "refundRate",
		align: "center",
		width: 120
	},

	//操作
	{
		title: "操作",
		dataIndex: "operation",
		key: "operation",
		align: "center",
		width: 120,
		fixed: 'right',
	},
];

const topColumns: any = [



	//支付金额
	{
		title: "总支付金额",
		dataIndex: "payAmount",
		key: "payAmount",
		align: "center",
		width: 120
	},

	//成功退款
	{
		title: "退款成功金额",
		dataIndex: "refund",
		key: "refund",
		align: "center",
		width: 120
	},

	//净支付金额
	{
		title: "净支付金额",
		dataIndex: "netAmount",
		key: "netAmount",
		align: "center",
		width: 120
	},
	//全站推广花费
	{
		title: "全站推广花费",
		dataIndex: "promotionCost",
		key: "promotionCost",
		align: "center",
		width: 120
	},
	//关键词推广花费
	{
		title: "关键词推广花费",
		dataIndex: "keywordCost",
		key: "keywordCost",
		align: "center",
		width: 120
	},
	//精准人群推广花费
	{
		title: "精准人群推广花费",
		dataIndex: "accurateAudienceCost",
		key: "accurateAudienceCost",
		align: "center",
		width: 120
	},
	//智能场景花费
	// {
	// 	title: "智能场景花费",
	// 	dataIndex: "smartSceneCost",
	// 	key: "smartSceneCost",
	// 	align: "center",
	// 	width: 120
	// },
	//淘宝客佣金
	// {
	// 	title: "淘宝客佣金",
	// 	dataIndex: "taobaoCommission",
	// 	key: "taobaoCommission",
	// 	align: "center",
	// 	width: 120
	// },
	//店铺客户数
	{
		title: "店铺客户数",
		dataIndex: "shopCustomerNumber",
		key: "shopCustomerNumber",
		align: "center",
		width: 120
	},
	//支付子订单数
	{
		title: "支付子订单数",
		dataIndex: "paySubOrderNumber",
		key: "paySubOrderNumber",
		align: "center",
		width: 120
	},
	//支付件数
	{
		title: "支付件数",
		dataIndex: "payNumber",
		key: "payNumber",
		align: "center",
		width: 120
	},
	//访客数
	{
		title: "访客数",
		dataIndex: "visitorNumber",
		key: "visitorNumber",
		align: "center",
		width: 120
	},
	//浏览量
	{
		title: "浏览量",
		dataIndex: "statisticsPageViews",
		key: "statisticsPageViews",
		align: "center",
		width: 120
	},
	//加购件数
	{
		title: "加购件数",
		dataIndex: "statisticsAddToCartNumber",
		key: "statisticsAddToCartNumber",
		align: "center",
		width: 120
	},
	//加购人数
	{
		title: "加购人数",
		dataIndex: "addToCartPeopleNumber",
		key: "addToCartPeopleNumber",
		align: "center",
		width: 120
	},
	//收藏人数
	{
		title: "收藏人数",
		dataIndex: "collectionPeopleNumber",
		key: "collectionPeopleNumber",
		align: "center",
		width: 120
	},

];

let paramStart = ref({
	id: "",
	username: "",
	shopName: "/",
	remark: "",
	status: "retrieving",
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

	getElectronApi().getStatisticsData(JSON.stringify(record), true);
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


const login = (record: any) => {
	console.log(record);

	getElectronApi().showLoginPage(JSON.stringify(record));
};


let statistics: any = ref({

	payAmount: 0,
	refund: 0,
	netAmount: 0,
	promotionCost: 0,
	keywordCost: 0,
	accurateAudienceCost: 0,
	shopCustomerNumber: 0,
	paySubOrderNumber: 0,
	payNumber: 0,
	visitorNumber: 0,
	statisticsPageViews: 0,
	statisticsAddToCartNumber: 0,
	addToCartPeopleNumber: 0,
	collectionPeopleNumber: 0,

});

let statisticsStart =
	ref({
		payAmount: 0,
		refund: 0,
		netAmount: 0,
		promotionCost: 0,
		keywordCost: 0,
		accurateAudienceCost: 0,
		shopCustomerNumber: 0,
		paySubOrderNumber: 0,
		payNumber: 0,
		visitorNumber: 0,
		statisticsPageViews: 0,
		statisticsAddToCartNumber: 0,
		addToCartPeopleNumber: 0,
		collectionPeopleNumber: 0,

	});


//监听主进程响应内容
getElectronApi().onGetShopsInfo((param: any) => {
	console.log("响应的信息", param);
	let requestParam = JSON.parse(param);
	//在bodData中找到对应的数据并更新
	let item = bodyData.value.find((item: any) => item.id == requestParam.id);
	item = Object.assign(item, requestParam);


	for (let i = 0; i < bodyData.value.length; i++) {
		let item = bodyData.value[i];
		if (item.status == "success") {
			//如果pageData中没有这个key
			let pageItem = pageData.value.find((it: any) => it.id == item.id);
			if (!pageItem) {
				pageData.value.push(item);
			} else {
				//更新pageData
				//将item中的数据更新到pageData中
				pageItem = Object.assign(pageItem, item);
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

	getElectronApi().getStatisticsData(param, false);
};

//深度监听bodyData
watch(bodyData, (newVal, oldVal) => {
	let tempStatistics = JSON.parse(JSON.stringify(statisticsStart.value));

	for (let i = 0; i < newVal.length; i++) {
		let item = newVal[i];
		if (item.status == "success") {
			for (let key in item) {
				//如果topColumns中有这个key
				if (key in tempStatistics) {
					let value = item[key];

					console.log("value", value);


					//如果包含/则是今日/昨日 拿到今日的值
					// if (value.includes("/")) {
					// 	value = value.split("/")[0];
					// }

					//如果是数字
					if (!isNaN(value)) {
						tempStatistics[key] += parseFloat(value);
					}
				}

			}
		}
	}

	statistics.value = tempStatistics;

}, { deep: true });


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
