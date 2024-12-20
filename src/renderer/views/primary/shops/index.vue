<template>
	<div class="box">
		<div class="top">
			<a-button @click="loginActiveAccount">登录选中账号</a-button>
			<a-button @click="openAction(null)">批量添加店铺</a-button>
			<a-button @click="batchLoginLogoutAccount">批量登录掉线账号</a-button>
		</div>

		<div class="bottom">
			<div class="content">
				<a-table :columns="columns" :data-source="bodyData" :pagination="false"
					:row-class-name="(index: any) => (index % 2 === 0 ? 'table-striped' : '')" :loading="loading"
					:row-selection="{ selectedRowKeys: state.selectedRowKeys, onChange: onSelectChange }">
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
							<div v-if="loginInfoMap?.get(record.username)">
								<a-tag :bordered="false" color="success"
									v-if="loginInfoMap?.get(record.username).status == 'success'">已登录</a-tag>
								<a-tag color="warning" v-else-if="loginInfoMap?.get(record.username).status == 'waitInit'">
									<template #icon>
										<sync-outlined :spin="true" />
									</template>
									等待登录中
								</a-tag>
								<a-tag color="purple" v-else-if="loginInfoMap?.get(record.username).status == 'initing'">
									<template #icon>
										<sync-outlined :spin="true" />
									</template>
									自动登录中
								</a-tag>
							</div>
							<a-tag :bordered="false" color="warning" v-else>未登录</a-tag>
						</template>

						<template v-else-if="column.key === 'createTime'">
							{{ record.createTime?.replace("T", " ") }}
						</template>
						<template v-else-if="column.key === 'type'">
							<div v-if="record.type">
								{{ record.type }}
							</div>
							<div v-else>
								未分组
							</div>
						</template>

						<template v-else-if="column.key === 'loginTime'">
							<div v-if="loginInfoMap?.get(record.username)?.loginTime">
								{{ loginInfoMap?.get(record.username) ? $td.formatDT(loginInfoMap.get(record.username).loginTime) : ""
								}}
							</div>

						</template>

						<template v-else-if="column.key === 'action'">
							<a-button type="dashed" @click="login([record])">登录</a-button>
							<a-button type="dashed" @click="resetPwdOfModal.open(record)">编辑</a-button>

							<a-button type="dashed" @click="deleteItem(record)">删除</a-button>
						</template>
					</template>
				</a-table>
			</div>
			<!-- <div class="pagination">
				<a-pagination v-model:current="bodyData.current" :total="bodyData.total" :pageSize="requestParam.pageSize"
					:showSizeChanger="false" show-less-items @change="change" />
			</div> -->
		</div>
	</div>

	<ActionOfModal ref="actionOfModal" :roleList="roleList" @submit="getBodyData" />
	<ResetPwdOfModal ref="resetPwdOfModal" @submit="getBodyData" />
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import $td from "../../../../lib/td";
import ActionOfModal from "./ActionOfModal/index.vue";
import ResetPwdOfModal from "./ResetPwdOfModal/index.vue";
import {
	SyncOutlined,
} from '@ant-design/icons-vue';

let getElectronApi = () => {
	return (window as any).primaryWindowAPI;
};

onMounted(() => {
	//手动获取最新的登录状态
	getElectronApi().getLoginInfo();
});


let loading = ref(false);

let actionOfModal: any = ref(null);
let resetPwdOfModal: any = ref(null);

let roleList = ref([]);

let requestParam = ref({
	data: {
		status: "",
	},
	pageNumber: 1,
	pageSize: 10,
	searchParam: "",
});

let getRoleList = () => {
	$td.request
		.request({
			url: "/admin/role/all",
			method: "GET",
		})
		.then((res: any) => {
			console.log(res.data);

			roleList.value = res.data;
		});
};

// getRoleList();
const columns: any = [
	{
		title: "序号",
		dataIndex: "index",
		key: "index",
		align: "center",
	},

	{
		title: "用户名",
		dataIndex: "username",
		key: "username",
		align: "center",
	},
	// {
	// 	title: "密码",
	// 	dataIndex: "password",
	// 	key: "password",
	// 	align: "center",
	// },
	{
		title: "登录状态",
		dataIndex: "status",
		key: "status",
		align: "center",
	},
	{
		title: "登录时间",
		dataIndex: "loginTime",
		key: "loginTime",
		align: "center",
	},
	{
		title: "分组",
		dataIndex: "type",
		key: "type",
		align: "center",
	},
	{
		title: "客服",
		dataIndex: "service",
		key: "service",
		align: "center",
	},
	{
		title: "备注",
		dataIndex: "remark",
		key: "remark",
		align: "center",
	},
	{
		title: "创建时间",
		dataIndex: "createTime",
		key: "createTime",
		align: "center",
	},

	{
		title: "操作",
		dataIndex: "action",
		key: "action",
		align: "center",
	},
];

const bodyData = ref<any>([]);

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
			console.log(res.data);

			bodyData.value = res.data || []

			if (res.data && res.data.length > 0) {
				bodyData.value.forEach((item: any, index: number) => {
					item["key"] = item.id
				});
			}


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

let deleteItem = (item: any) => {
	$td.Modal.confirm({
		title: "删除",
		content: "确定删除该店铺账号吗？",
		onOk: () => {
			$td.openLoading();
			$td.request
				.request({
					url: "/admin/shops/delete",
					method: "POST",
					data: item,
				})
				.then((res: any) => {
					if (res.data) {
						$td.message.success("删除成功");
						getBodyData();
					} else {
						$td.message.error("删除失败");
					}
				});
		},
	});
};



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


const login = (param: Array<any>) => {
	// getElectronApi().showLoginPage(JSON.stringify(record));
	getElectronApi().shopsLogin(JSON.stringify(param));
};

const loginInfoMap = ref()

//监听get-login-info 事件
getElectronApi().onGetLoginInfo((param: any) => {
	console.log("信息");
	console.log(param);
	loginInfoMap.value = param
	console.log(loginInfoMap.value);
});

const loginActiveAccount = () => {
	if (state.selectedRowKeys.length == 0) {
		$td.message.error("请选择账号");
		return;
	}

	let activeList = bodyData.value.filter((item: any) => {
		return state.selectedRowKeys.includes(item.id) && !loginInfoMap.value?.get(item.username);
	});

	if (activeList.length == 0) {
		$td.message.error("当前选中账号都已登录");
		return;
	}

	login(activeList);

	// for (let i = 0; i < activeList.length; i++) {
	// 	getElectronApi().shopsLogin(JSON.stringify(activeList[i]));
	// }

};

const batchLoginLogoutAccount = () => {
	//拿到所有未登录的账号
	let activeList = bodyData.value.filter((item: any) => {
		return !loginInfoMap.value?.get(item.username);
	});

	if (activeList.length == 0) {
		$td.message.error("当前没有未登录的账号");
		return;
	}

	login(activeList);
	// for (let i = 0; i < activeList.length; i++) {
	// 	setTimeout(() => {
	// 		getElectronApi().shopsLogin(JSON.stringify(activeList[i]));
	// 	}, i * 200);
	// }

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
	height: 52px;
	background-color: #fafafa;
	/* background-color: #6b6d71; */
	box-sizing: border-box;
	padding: 5px 10px;
	border-radius: 4px;
	margin-bottom: 10px;
	display: flex;
	justify-content: center;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
