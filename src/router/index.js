import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    // component: () => import('../views/Home.vue')
    component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue')
  },
  {
    path: '/data',
    name: 'Data',
    // component: () => import('../views/Data.vue')
    component: () => import(/* webpackChunkName: "data" */ '../views/Data.vue')
  }
]

const router = createRouter({
  // 使用 hash 模式（Electron 推荐）
  history: createWebHashHistory(),
  routes
})

export default router
