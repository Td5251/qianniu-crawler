//index.js  创建自定义方法
/**
 * @description 创建或者关闭全屏加载状态效果 依赖ant-design-vue
 * @param {Boolean} visible true 打开全屏加载状态，false 关闭全屏加载状态
 */

function loading(visible: boolean) {
  let load = document.getElementById("td-spin") || null;
  if (!load) {
    load = document.createElement("div");
    load.setAttribute("id", "td-spin");

    load.innerHTML = `
    <div  class="ant-spin ant-spin-spinning" aria-live="polite" aria-busy="true">
      <img src="loading.gif" class="td-loading" />
    </div>
                  `;

    document.body.appendChild(load);
  }

  if (visible) {
    load.style.display = "flex";
    //锁住滚动条
    document.body.style.overflow = "hidden";
    return;
  }
  load.style.display = "none";
  //释放滚动条
  document.body.style.overflow = "auto";
  // 隐藏横向滚动条
  document.body.style.overflowX = "hidden";
}

export function openLoading() {
  loading(true);
}

export function closeLoading() {
  loading(false);
}

export function updateLoadding(loading: any) {
  loading.value = !loading.value;
}
