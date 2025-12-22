<template>
  <div>
    <ToolBar />
  </div>
  <div class="container">
    <router-view :key="componentKey" />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { eventBus } from './utils/eventBus';
import ToolBar from './components/ToolBar.vue'
let timeoutId = null;
const delay = 100; // 防抖刷新时间间隔
const componentKey = ref(0)
const handleResize = () => {
  // 清除之前的定时器
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  // 设置新的定时器
  timeoutId = setTimeout(() => {
    componentKey.value++
  }, delay)
}
onMounted(() => {
  if (window.ipcRenderer) {
    //监听窗口尺寸变化
    window.ipcRenderer.on('window-resized', (event, size) => {
      handleResize(size)
      //通过eventBus发送主进程窗口大小变化事件
      eventBus.emit(eventBus.events.WIN_RESIZE, size)
    })
  }
})

</script>
<style>
body {
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.container {
  padding: 5px;
}

/* 去掉分页器相关按钮阴影 */
.vxe-pager .vxe-pager--end-btn:not(.is--disabled):focus,
.vxe-pager .vxe-pager--home-btn:not(.is--disabled):focus,
.vxe-pager .vxe-pager--jump-next:not(.is--disabled):focus,
.vxe-pager .vxe-pager--jump-prev:not(.is--disabled):focus,
.vxe-pager .vxe-pager--next-btn:not(.is--disabled):focus,
.vxe-pager .vxe-pager--num-btn:not(.is--disabled):focus,
.vxe-pager .vxe-pager--prev-btn:not(.is--disabled):focus {
  box-shadow: 0 0 0 0 !important;
}
</style>
