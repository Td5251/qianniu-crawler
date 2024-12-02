<template>
	<div class="box">
		<div class="top">
			<div class="info-item" v-for="item in topColumns">
				<div class="info-title">
					{{ item.title }}
				</div>
				<div class="info-content">
					{{ showContent(statistics[item.dataIndex]) }}
				</div>
			</div>
		</div>

		<div class="bottom">
			<div class="content">

				<a-table :columns="columns" :data-source="bodyData" :scroll="{ x: 1000, y: 520 }" :pagination="false">
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
							<a-tag color="volcano" v-else-if="record.status == 'wait' || !record.status">
								<template #icon>
									<sync-outlined :spin="true" />
								</template>
								等待中
							</a-tag>
							<a-tag v-else-if="record.status == 'not-login'" :bordered="false" color="warning">未登录</a-tag>
							<a-tag v-else-if="record.status == 'error'" :bordered="false" color="error">网络异常 请点击重试</a-tag>
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


let getElectronApi = () => {
	return (window as any).primaryWindowAPI;
};

let loading = ref(false);


let requestParam = ref({

});



const columns: any = [
	{
		title: "用户名",
		dataIndex: "username",
		key: "username",
		align: "center",
		width: 120,
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
		width: 120,
	},

	//店铺层级
	{
		title: "店铺层级",
		dataIndex: "shopLevel",
		key: "shopLevel",
		align: "center",
		width: 120
	},
	//综合体验分
	{
		title: "综合体验分",
		dataIndex: "shopsScore",
		key: "shopsScore",
		align: "center",
		width: 120
	},
	//宝贝质量
	{
		title: "宝贝质量",
		dataIndex: "babyBuality",
		key: "babyBuality",
		align: "center",
		width: 120
	},
	//物流速度
	{
		title: "物流速度",
		dataIndex: "logisticsSpeed",
		key: "logisticsSpeed",
		align: "center",
		width: 120
	},
	//服务保障
	{
		title: "服务保障",
		dataIndex: "serviceGuarantee",
		key: "serviceGuarantee",
		align: "center",
		width: 120
	},
	//聚合账户余额
	{
		title: "聚合账户余额",
		dataIndex: "aggregateBalance",
		key: "aggregateBalance",
		align: "center",
		width: 120
	},
	//出售中
	{
		title: "出售中",
		dataIndex: "selling",
		key: "selling",
		align: "center",
		width: 120
	},
	//仓库中
	{
		title: "仓库中",
		dataIndex: "warehouse",
		key: "warehouse",
		align: "center",
		width: 120
	},
	//近30天成交
	{
		title: "近30天成交",
		dataIndex: "transaction",
		key: "transaction",
		align: "center",
		width: 120
	},
	//待发货
	{
		title: "待发货",
		dataIndex: "toBeDelivered",
		key: "toBeDelivered",
		align: "center",
		width: 120
	},
	//待付款
	{
		title: "待付款",
		dataIndex: "toBePaid",
		key: "toBePaid",
		align: "center",
		width: 120
	},
	//待处理投诉
	{
		title: "待处理投诉",
		dataIndex: "toBeComplaint",
		key: "toBeComplaint",
		align: "center",
		width: 120
	},
	//待售后
	{
		title: "待售后",
		dataIndex: "toBeAfterSale",
		key: "toBeAfterSale",
		align: "center",
		width: 120
	},
	//待评价
	{
		title: "待评价",
		dataIndex: "toBeEvaluated",
		key: "toBeEvaluated",
		align: "center",
		width: 120
	},
	//访客
	{
		title: "今/昨/周/月访客",
		dataIndex: "visitor",
		key: "visitor",
		align: "center",
		width: 120
	},
	//支付金额
	{
		title: "今/昨/周/月金额",
		dataIndex: "amount",
		key: "amount",
		align: "center",
		width: 350
	},
	//订单
	{
		title: "今/昨/周/月订单",
		dataIndex: "order",
		key: "order",
		align: "center",
		width: 150
	},
	//万相台余额
	{
		title: "万相台余额",
		dataIndex: "wxtBalance",
		key: "wxtBalance",
		align: "center",
		width: 120
	},
	//万相台花费
	{
		title: "万相台花费",
		dataIndex: "wxtCharge",
		key: "wxt-charge",
		align: "center",
		width: 120
	},
	//万相台展现
	{
		title: "万相台展现量",
		dataIndex: "wxtDisplay",
		key: "wxt-display",
		align: "center",
		width: 120
	},
	//万相台点击
	{
		title: "万相台点击量",
		dataIndex: "wxtClick",
		key: "wxt-click",
		align: "center",
		width: 120
	},
	//万相台成交
	{
		title: "万相台成交金额",
		dataIndex: "wxtTransaction",
		key: "wxt-transaction",
		align: "center",
		width: 120
	},
	//万相台盈亏
	{
		title: "万相台投产比",
		dataIndex: "wxtProfit",
		key: "wxt-profit",
		align: "center",
		width: 120
	},

	//加购
	{
		title: "今/昨加购人数",
		dataIndex: "addToCart",
		key: "addToCart",
		align: "center",
		width: 120
	},
	//支付转化率
	{
		title: "今/昨支付转化率",
		dataIndex: "conversionRate",
		key: "conversionRate",
		align: "center",
		width: 120
	},
	//浏览量
	{
		title: "今/昨浏览量",
		dataIndex: "pageViews",
		key: "pageViews",
		align: "center",
		width: 120
	},
	//买家数量
	{
		title: "今/昨买家",
		dataIndex: "buyerNumber",
		key: "buyerNumber",
		align: "center",
		width: 120
	},
	//客单价
	{
		title: "今/昨客单价",
		dataIndex: "unitPrice",
		key: "unitPrice",
		align: "center",
		width: 120
	},
	//加购商品数量
	{
		title: "今/昨加购商品数",
		dataIndex: "addToCartNumber",
		key: "addToCartNumber",
		align: "center",
		width: 120
	},
	//收藏商品数量
	{
		title: "今/昨收藏商品数",
		dataIndex: "collectionNumber",
		key: "collectionNumber",
		align: "center",
		width: 120
	},
	//保证金
	{
		title: "保证金",
		dataIndex: "margin",
		key: "margin",
		align: "center",
		width: 120
	},
	//风险保证金
	{
		title: "风险保证金",
		dataIndex: "riskMargin",
		key: "riskMargin",
		align: "center",
		width: 120
	},
	//需要缴纳的保证金
	{
		title: "需要缴纳的保证金",
		dataIndex: "needToPayMargin",
		key: "needToPayMargin",
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


	//聚合账户余额
	{
		title: "聚合账户余额",
		dataIndex: "aggregateBalance",
		key: "aggregateBalance",
		align: "center",
		width: 120
	},
	//出售中
	{
		title: "出售中",
		dataIndex: "selling",
		key: "selling",
		align: "center",
		width: 120
	},
	//仓库中
	{
		title: "仓库中",
		dataIndex: "warehouse",
		key: "warehouse",
		align: "center",
		width: 120
	},
	//近30天成交
	{
		title: "近30天成交",
		dataIndex: "transaction",
		key: "transaction",
		align: "center",
		width: 120
	},
	//待发货
	{
		title: "待发货",
		dataIndex: "toBeDelivered",
		key: "toBeDelivered",
		align: "center",
		width: 120
	},
	//待付款
	{
		title: "待付款",
		dataIndex: "toBePaid",
		key: "toBePaid",
		align: "center",
		width: 120
	},
	//待处理投诉
	{
		title: "待处理投诉",
		dataIndex: "toBeComplaint",
		key: "toBeComplaint",
		align: "center",
		width: 120
	},
	//待售后
	{
		title: "待售后",
		dataIndex: "toBeAfterSale",
		key: "toBeAfterSale",
		align: "center",
		width: 120
	},
	//待评价
	{
		title: "待评价",
		dataIndex: "toBeEvaluated",
		key: "toBeEvaluated",
		align: "center",
		width: 120
	},
	//访客
	{
		title: "今日访客",
		dataIndex: "visitor",
		key: "visitor",
		align: "center",
		width: 120
	},
	//支付金额
	{
		title: "今日金额",
		dataIndex: "amount",
		key: "amount",
		align: "center",
		width: 120
	},
	//万相台余额
	{
		title: "万相台余额",
		dataIndex: "wxtBalance",
		key: "wxtBalance",
		align: "center",
		width: 120
	},
	//万相台花费
	{
		title: "万相台花费",
		dataIndex: "wxtCharge",
		key: "wxt-charge",
		align: "center",
		width: 120
	},
	//万相台展现
	{
		title: "万相台展现量",
		dataIndex: "wxtDisplay",
		key: "wxt-display",
		align: "center",
		width: 120
	},
	//万相台点击
	{
		title: "万相台点击量",
		dataIndex: "wxtClick",
		key: "wxt-click",
		align: "center",
		width: 120
	},
	//万相台成交
	{
		title: "万相台成交金额",
		dataIndex: "wxtTransaction",
		key: "wxt-transaction",
		align: "center",
		width: 120
	},

	// {
	// 	title: "万相台投产比",
	// 	dataIndex: "wxtProfit",
	// 	key: "wxt-profit",
	// 	align: "center",
	// 	width: 120
	// },

	//加购
	{
		title: "今日加购人数",
		dataIndex: "addToCart",
		key: "addToCart",
		align: "center",
		width: 120
	},
	//订单
	{
		title: "今日订单",
		dataIndex: "order",
		key: "order",
		align: "center",
		width: 120
	},
	//支付转化率
	// {
	// 	title: "今/昨支付转化率",
	// 	dataIndex: "conversionRate",
	// 	key: "conversionRate",
	// 	align: "center",
	// 	width: 120
	// },
	//浏览量
	{
		title: "今日浏览量",
		dataIndex: "pageViews",
		key: "pageViews",
		align: "center",
		width: 120
	},
	//买家数量
	{
		title: "今日买家",
		dataIndex: "buyerNumber",
		key: "buyerNumber",
		align: "center",
		width: 120
	},
	//客单价
	// {
	// 	title: "今/昨客单价",
	// 	dataIndex: "unitPrice",
	// 	key: "unitPrice",
	// 	align: "center",
	// 	width: 120
	// },
	//加购商品数量
	{
		title: "今日加购商品数",
		dataIndex: "addToCartNumber",
		key: "addToCartNumber",
		align: "center",
		width: 120
	},
	//收藏商品数量
	{
		title: "今日收藏商品数",
		dataIndex: "collectionNumber",
		key: "collectionNumber",
		align: "center",
		width: 120
	},
	//保证金
	{
		title: "保证金",
		dataIndex: "margin",
		key: "margin",
		align: "center",
		width: 120
	},
	//风险保证金
	{
		title: "风险保证金",
		dataIndex: "riskMargin",
		key: "riskMargin",
		align: "center",
		width: 120
	},
	//需要缴纳的保证金
	{
		title: "需要缴纳的保证金",
		dataIndex: "needToPayMargin",
		key: "needToPayMargin",
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
	selling: "/",
	warehouse: "/",
	transaction: "/",
	toBeDelivered: "/",
	toBePaid: "/",
	toBeComplaint: "/",
	toBeAfterSale: "/",
	toBeEvaluated: "/",
	visitor: "/",
	amount: "/",
	wxtBalance: "/",
	wxtCharge: "/",
	wxtTransaction: "/",
	wxtProfit: "/",
	wxtDisplay: "/",
	wxtClick: "/",
	addToCart: "/",
	order: "/",
	conversionRate: "/",
	pageViews: "/",
	buyerNumber: "/",
	unitPrice: "/",
	addToCartNumber: "/",
	collectionNumber: "/",
	margin: "/",
	riskMargin: "/",
	needToPayMargin: "/",
});

const bodyData = ref<any>([
]);


const getShopsInfo = (record: any) => {
	console.log("原始信息");

	console.log(record);

	getElectronApi().getShopsInfo(JSON.stringify(record), true);
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

			for (let i = 0; i < bodyData.value.length; i++) {
				let item = bodyData.value[i];
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
getBodyData()


const login = (record: any) => {
	console.log(record);

	getElectronApi().showLoginPage(JSON.stringify(record));
};


let statistics: any = ref({
	aggregateBalance: 0,
	selling: 0,
	warehouse: 0,
	transaction: 0,
	toBeDelivered: 0,
	toBePaid: 0,
	toBeComplaint: 0,
	toBeAfterSale: 0,
	toBeEvaluated: 0,
	visitor: 0,
	amount: 0,
	wxtBalance: 0,
	wxtCharge: 0,
	wxtTransaction: 0,
	wxtProfit: 0,
	wxtDisplay: 0,
	wxtClick: 0,
	addToCart: 0,
	order: 0,
	conversionRate: 0,
	pageViews: 0,
	buyerNumber: 0,
	unitPrice: 0,
	addToCartNumber: 0,
	collectionNumber: 0,
	margin: 0,
	riskMargin: 0,
	needToPayMargin: 0,
});

let statisticsStart =
	ref({
		aggregateBalance: 0,
		selling: 0,
		warehouse: 0,
		transaction: 0,
		toBeDelivered: 0,
		toBePaid: 0,
		toBeComplaint: 0,
		toBeAfterSale: 0,
		toBeEvaluated: 0,
		visitor: 0,
		amount: 0,
		wxtBalance: 0,
		wxtCharge: 0,
		wxtTransaction: 0,
		wxtProfit: 0,
		wxtDisplay: 0,
		wxtClick: 0,
		addToCart: 0,
		order: 0,
		conversionRate: 0,
		pageViews: 0,
		buyerNumber: 0,
		unitPrice: 0,
		addToCartNumber: 0,
		collectionNumber: 0,
		margin: 0,
		riskMargin: 0,
		needToPayMargin: 0,
	});


//监听主进程响应内容
getElectronApi().onGetShopsInfo((param: any) => {
	console.log("响应的信息");
	let requestParam = JSON.parse(param);
	//在bodData中找到对应的数据并更新
	let item = bodyData.value.find((item: any) => item.id == requestParam.id);
	item = Object.assign(item, requestParam);

	let tempStatistics = JSON.parse(JSON.stringify(statisticsStart.value));

	for (let i = 0; i < bodyData.value.length; i++) {
		let item = bodyData.value[i];
		if (item.status == "success") {
			for (let key in item) {
				//如果topColumns中有这个key
				if (key in tempStatistics) {
					let value = item[key] + ""

					if (!value) {
						continue;
					}

					//如果包含/则是今日/昨日 拿到今日的值
					if (value.includes("/")) {
						value = value.split("/")[0];
						value = value.trim();
					}

					//正则匹配是否是数字
					const regex = /^-?\d+(\.\d+)?$/
					if (regex.test(value)) {
						tempStatistics[key] += parseFloat(value);
					}
				}

			}
		}
	}

	statistics.value = tempStatistics;
});

const getCurrentData = (item: any) => {

	let temp = ref(JSON.parse(JSON.stringify(paramStart.value)));

	temp.value.id = item.id;
	temp.value.username = item.username;
	temp.value.remark = item.remark;

	item = Object.assign(item, temp.value);

	let param = JSON.stringify(item);

	getElectronApi().getShopsInfo(param, false);
};

const showContent = (item: any) => {
	// statistics[item.dataIndex]? isNaN(statistics[item.dataIndex]) ? statistics[item.dataIndex] : $td.formatNumber(statistics[item.dataIndex]) : '/' }}

	if (!item) {
		return '0'
	}

	if (isNaN(item)) {
		return item
	}

	return item.toFixed(2)

}
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
	flex-direction: column;
	align-items: flex-end;
	border-radius: 4px;

}

.content {
	width: 100%;
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
