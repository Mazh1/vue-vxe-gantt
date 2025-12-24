<template>
  <div class="toolbar">
    <div class="toolbar-item" v-for="(item, index) in toolbarItems" :key="index"
      @mouseenter="false ? openDropdown(index) : null" @mouseleave="item.hasDropdown ? scheduleClose(index) : null">
      <button class="toolbar-button" :class="{ active: item.isActive }" @click="handleToolbarClick(item, index)">
        {{ item.title }}
        <span v-if="item.hasDropdown && !item.isActive" style="margin-left: 5px;margin-top:4px; font-size: 12px;">
          <svg t="1762939302715" class="icon" viewBox="0 0 1820 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="7219" width="10" height="12">
            <path
              d="M102.4 79.644444c45.511111-45.511111 102.4-45.511111 147.911111 0l728.177778 728.177778c45.511111 45.511111 45.511111 113.777778 0 147.911111-45.511111 45.511111-102.4 45.511111-147.911111 0L102.4 227.555556C68.266667 193.422222 68.266667 125.155556 102.4 79.644444z"
              fill="#515151" p-id="7220"></path>
            <path
              d="M1718.044444 79.644444c45.511111 45.511111 45.511111 102.4 0 147.911112L989.866667 955.733333c-45.511111 45.511111-102.4 45.511111-147.911111 0-45.511111-34.133333-45.511111-102.4 0-147.911111L1570.133333 79.644444c34.133333-34.133333 102.4-34.133333 147.911111 0z"
              fill="#515151" p-id="7221"></path>
          </svg>
        </span>
        <span v-if="item.hasDropdown && item.isActive" style="margin-left: 5px;margin-top:4px; font-size: 12px;">
          <svg t="1762941511087" class="icon" viewBox="0 0 1820 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="7477" width="10" height="12">
            <path
              d="M102.4 79.644444c45.511111-45.511111 102.4-45.511111 147.911111 0l728.177778 728.177778c45.511111 45.511111 45.511111 113.777778 0 147.911111-45.511111 45.511111-102.4 45.511111-147.911111 0L102.4 227.555556C68.266667 193.422222 68.266667 125.155556 102.4 79.644444z"
              fill="#3863fc" p-id="7478"></path>
            <path
              d="M1718.044444 79.644444c45.511111 45.511111 45.511111 102.4 0 147.911112L989.866667 955.733333c-45.511111 45.511111-102.4 45.511111-147.911111 0-45.511111-34.133333-45.511111-102.4 0-147.911111L1570.133333 79.644444c34.133333-34.133333 102.4-34.133333 147.911111 0z"
              fill="#3863fc" p-id="7479"></path>
          </svg>
        </span>
      </button>
      <div class="dropdown-content" :class="{ show: item.isOpen }" v-if="item.hasDropdown">
        <div v-for="(menuItem, menuIndex) in item.menu" :key="menuIndex" class="dropdown-item"
          @click="handleMenuClick(item, menuItem)">
          <img class="item-svg" :src="menuItem.icon">
          {{ menuItem.text }}
          <span class="shortcut" v-if="menuItem.shortcut">{{ menuItem.shortcut }}</span>
        </div>
      </div>
    </div>
    <div>
      <vxe-modal v-model="showConfirm" type="alert" status="warning" title="提示" width="340" showFooter
        @confirm="confrimEvent">
        <template #default>
          <span>
            <span>是否确认删除人员、项目名称等缓存数据？</span>
          </span>
        </template>
      </vxe-modal>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { serviceApi } from '../utils/service'
import quitSvg from '../assets/quit.svg'
import reloadSvg from '../assets/reload.svg'
import debugSvg from '../assets/debug.svg'
import clearSvg from '../assets/clear.svg'
// import setSvg from '../assets/set.svg'
const router = useRouter()
let showConfirm = ref(false)
const toolbarItems = ref([
  {
    key: 'home',
    title: '首页',
    isActive: true,
    hasDropdown: false
  },
  {
    key: 'data',
    title: '数据',
    isActive: false,
    isOpen: false,
    hasDropdown: false
  },
  {
    key: 'system',
    title: '系统',
    isActive: false,
    isOpen: false,
    hasDropdown: true,
    menu: [
      // { key: 'setsystem', text: '系统设置', icon: setSvg },
      { key: 'reload', text: '系统刷新', icon: reloadSvg },
      { key: 'debug', text: '调试工具', icon: debugSvg },
      { key: 'clearcache', text: '清理缓存', icon: clearSvg },
      { key: 'quit', text: '退出系统', icon: quitSvg }
    ]
  }
]);
if (sessionStorage.getItem('currentTitle') === null) {
  sessionStorage.setItem('currentTitle', '首页');
}
toolbarItems.value.forEach((item) => {
  if (item.title === sessionStorage.getItem('currentTitle')) {
    item.isActive = true;
  } else {
    item.isActive = false;
  }
})
const currentSelection = ref('');
const actionLog = ref([]);
let closeTimeout = null;
const closeApp = () => {
  if (window.ipcRenderer) {
    window.ipcRenderer.send('close-app')
  }
}
const reloadApp = () => {
  if (window.ipcRenderer) {
    window.ipcRenderer.send('reload-app')
  }
}
const openDevTools = () => {
  if (window.ipcRenderer) {
    window.ipcRenderer.send('open-devtools')
  }
}
const openDropdown = (index) => {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }

  toolbarItems.value.forEach((item, i) => {
    if (i !== index && item.hasDropdown) {
      item.isOpen = false;
    }
  });

  toolbarItems.value[index].isOpen = true;
};

const scheduleClose = (index) => {
  closeTimeout = setTimeout(() => {
    toolbarItems.value[index].isOpen = false;
  }, 0);
};

const handleToolbarClick = (item, index) => {
  if (closeTimeout) {
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }

  if (item.hasDropdown) {
    // 对于下拉菜单项，切换下拉状态
    toolbarItems.value.forEach((toolbarItem, i) => {
      if (i !== index && toolbarItem.hasDropdown) {
        toolbarItem.isOpen = false;
      }
    });
    item.isOpen = !item.isOpen;
  } else {
    // 对于一级导航项，设置选中状态
    toolbarItems.value.forEach(toolbarItem => {
      toolbarItem.isActive = false;
    });
    item.isActive = true;
    currentSelection.value = item.title;
    sessionStorage.setItem('currentTitle', currentSelection.value)
    // 记录操作
    const action = `${new Date().toLocaleTimeString()} - 点击了: ${item.title}`;
    actionLog.value.unshift(action);

    if (actionLog.value.length > 5) {
      actionLog.value.pop();
    }

    // 关闭所有下拉菜单
    toolbarItems.value.forEach(toolbarItem => {
      if (toolbarItem.hasDropdown) {
        toolbarItem.isOpen = false;
      }
    });
  }
  //点击展开二级菜单
  openDropdown(index)
  if (item.key === 'home') {
    router.push('/')
  }
  if (item.key === 'data') {
    router.push('/data')
  }
};

const handleMenuClick = (item, menuItem) => {
  if (item.title !== '系统') {
    item.isActive = true;
    currentSelection.value = `${item.title} -> ${menuItem.text}`;
  }
  //记录操作
  const action = `${new Date().toLocaleTimeString()} - ${item.title} -> ${menuItem.text}`;
  actionLog.value.unshift(action);

  if (actionLog.value.length > 5) {
    actionLog.value.pop();
  }

  // 关闭所有下拉菜单
  toolbarItems.value.forEach(toolbarItem => {
    if (toolbarItem.hasDropdown) {
      toolbarItem.isOpen = false;
    }
  });
  if (menuItem.key === 'clearcache') {
    showConfirm = true
  }
  if (menuItem.key === 'reload') {
    reloadApp();
  }
  if (menuItem.key === 'debug') {
    openDevTools()
  }
  if (menuItem.key === 'quit') {
    closeApp()
  }

};
const clearCache = () => {
  serviceApi.clearCache().then((re) => {
    if (re.success) {
      window.localStorage.removeItem('DATE_RANGE')
      window.localStorage.removeItem('PAGE_SIZE')
      showConfirm = false
      reloadApp();
    }
  })
}
const confrimEvent = () => {
  clearCache()
}

</script>
<style scoped>
.toolbar {
  /* height: 25px; */
  display: flex;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  border: 1px solid #e2e6ea;
  /* padding: 2px; */
  /* border-radius: 8px;
  padding: 4px;
  margin-bottom: 30px; */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.toolbar-item {
  position: relative;
  margin-right: 1px;
}

.toolbar-button {
  height: 25px;
  line-height: 25px;
  background: none;
  border: none;
  padding: 10px 10px;
  cursor: pointer;
  font-size: 12px;
  color: #495057;
  /* border-radius: 6px 6px 0 0; */
  transition: all 0.3s ease;
  /* font-weight: 500; */
  display: flex;
  align-items: center;
  position: relative;
}

.toolbar-button:hover {
  background-color: #e2e6ea;
  color: #212529;
}

.toolbar-button.active {
  color: #409eff;
}

/* .toolbar-button.active::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #4facfe;
} */

.dropdown-content {
  position: absolute;
  /* margin-top: 2px; */
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 120px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  /* border-radius: 0 0 8px 8px; */
  z-index: 100;
  padding: 8px 0;
  display: none;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-content.show {
  display: block;
}

.dropdown-item {
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  color: #495057;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  margin-right: 10px;
  width: 18px;
  text-align: center;
  font-size: 16px;
}

.divider {
  height: 1px;
  background-color: #e9ecef;
  margin: 6px 0;
}

.item-svg {
  margin-top: 2px;
  width: 14px;
  height: 14px;
}
</style>
