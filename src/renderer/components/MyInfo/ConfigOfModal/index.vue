<template>
	<div>
		<a-modal v-model:open="flag" title="系统配置" @ok="handleOk">
			<a-form :model="requestParam">

				<a-form-item label="是否显示运行时浏览器">
					<a-switch v-model:checked="requestParam.isShowBrowser" checked-children="显示" un-checked-children="隐藏" />
				</a-form-item>

				<a-form-item label="爬取线程数">
					<a-input v-model:value="requestParam.maxOpenBrowserNumber" type="number" :min="1" />
				</a-form-item>

				<a-form-item label="默认浏览器路径">
					<a-input v-model:value="requestParam.defaultChromePath" />
				</a-form-item>
			</a-form>

			<template #footer>
				<a-button key="back" @click="flag = false">
					取消
				</a-button>
				<a-button key="submit" type="primary" @click="handleOk">
					确定
				</a-button>
			</template>
		</a-modal>
	</div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import $td from "../../../../lib/td";

const flag = ref<boolean>(false);

let emit = defineEmits(["submit"]);

let requestParam = ref({
	isShowBrowser: false,
	maxOpenBrowserNumber: 15,
	defaultChromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
});

let requestParamStart: any = ref({
	isShowBrowser: false,
	maxOpenBrowserNumber: 15,
	defaultChromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
});

let getElectronApi = () => {
	return (window as any).primaryWindowAPI;
};

const open = () => {
	flag.value = true;
	getElectronApi().getConfig();
};

const handleOk = () => {

	if (requestParam.value.maxOpenBrowserNumber < 1) {
		$td.message.error("爬取线程数不能小于1");
		return;
	}

	//requestParam.value.defaultChromePath 包含" 时
	if (requestParam.value.defaultChromePath.includes('"')) {
		//将"替换成空
		requestParam.value.defaultChromePath = requestParam.value.defaultChromePath.replaceAll(/\"/g, "");
	}

	if (requestParam.value.maxOpenBrowserNumber > 20) {
		//提示线程数过大可能导致系统卡顿 是否继续
		$td.Modal.confirm({
			title: "提示",
			content: `线程数过大可能导致系统卡顿，是否继续？`,
			okText: "继续",
			cancelText: "取消",
			onOk: () => {
				getElectronApi().setConfig(JSON.stringify(requestParam.value));
				flag.value = false;
			}
		});
		return
	}

	getElectronApi().setConfig(JSON.stringify(requestParam.value));
	flag.value = false;

};

getElectronApi().onGetConfig((config: any) => {
	requestParam.value = JSON.parse(config);
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
</style>
