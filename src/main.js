import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VxeUIBase from 'vxe-pc-ui'
import 'vxe-pc-ui/es/style.css'
import VxeUITable from 'vxe-table'
import 'vxe-table/es/style.css'
import VxeUIGantt from 'vxe-gantt'
import 'vxe-gantt/lib/style.css'

// import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

// 创建应用实例
const app = createApp(App)
// 使用路由
app.use(router)
app.use(VxeUIBase)
app.use(VxeUITable)
app.use(VxeUIGantt)
// 挂载应用
app.mount('#app').$nextTick(() => {
  // 移除加载动画
  postMessage({ payload: 'removeLoading' }, '*')
})
