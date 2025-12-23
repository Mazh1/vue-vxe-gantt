<template>
  <div>
    <div class="search-container">
      <div class="form-row">
        <div class="lable">人员</div>
        <div>
          <vxe-pulldown v-model="searchNameOptions.showPull" show-popup-shadow>
            <template #default>
              <vxe-input v-model="searchNameOptions.searchName" class="search-item" placeholder="人员名称"
                @focus="focusEvent(searchNameOptions)" @keyup="keyupEvent(searchNameOptions)"></vxe-input>
            </template>
            <template #dropdown v-if="searchNameOptions.list.length > 0">
              <div class="dropdown-select">
                <div class="list-item" v-for="item in searchNameOptions.list" :key="item.id"
                  @click="selectEvent(item, searchNameOptions)">
                  <span>{{ item.name }}</span>
                </div>
              </div>
            </template>
          </vxe-pulldown>
        </div>
      </div>
      <div class="form-row">
        <div class="lable">项目</div>
        <div>
          <vxe-pulldown v-model="searchProjectOptions.showPull" show-popup-shadow>
            <template #default>
              <vxe-input v-model="searchProjectOptions.searchName" class="search-item" placeholder="项目名称"
                @focus="focusEvent(searchProjectOptions)" @keyup="keyupEvent(searchProjectOptions)"></vxe-input>
            </template>
            <template #dropdown v-if="searchProjectOptions.list.length > 0">
              <div class="dropdown-select">
                <div class="list-item" v-for="item in searchProjectOptions.list" :key="item.id"
                  @click="selectEvent(item, searchProjectOptions)">
                  <span>{{ item.name }}</span>
                </div>
              </div>
            </template>
          </vxe-pulldown>
        </div>
      </div>
      <div class="form-row">
        <div class="lable">状态</div>
        <div>
          <vxe-select v-model="searchStatus" class="search-item" placeholder="请选择">
            <vxe-option value="0" label="全部"></vxe-option>
            <vxe-option value="1" label="进行中"></vxe-option>
            <vxe-option value="2" label="已完成"></vxe-option>
          </vxe-select>
        </div>
      </div>
      <div style="display: flex;margin-left: auto">
        <vxe-button mode="text" status="primary" style="margin-right: 5px;" @click="clearSearchData">重置</vxe-button>
        <vxe-button status="primary" style="margin-right: 5px;" @click="searchData">检索</vxe-button>
      </div>
    </div>
    <div class="btn-container">
      <vxe-button mode="text" @click="createEvent" status="primary" icon="vxe-icon-add"
        style="margin-right: 5px;">新建</vxe-button>
    </div>
    <div class="table-container" :style="{ height: tableHeight + 'px' }">
      <vxe-table ref="tableRef" border stripe height="100%" size="small" header-align="center"
        :column-config="{ resizable: true }" :row-config="{ isHover: true }"
        :checkbox-config="{ labelField: 'id', highlight: true, range: true }" :data="tableData">
        <vxe-column type="seq" width="50" align='center'></vxe-column>
        <vxe-column field="name" title="人员" width="140" align='center'></vxe-column>
        <vxe-column field="project" title="产品/项目" align='center'></vxe-column>
        <vxe-column field="startdate" title="开始日期" align='center'></vxe-column>
        <vxe-column field="enddate" title="结束日期" align='center'></vxe-column>
        <vxe-column field="status" title="状态" align='center'></vxe-column>
        <vxe-column title="操作" align='center' width="140">
          <template #default="{ row }">
            <vxe-button mode="text" status="primary" @click="editEvent(row, true)">复制</vxe-button>
            <vxe-button mode="text" status="primary" @click="editEvent(row)">编辑</vxe-button>
            <vxe-button mode="text" status="primary" @click="deleteEvent(row)">删除</vxe-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
    <div class="pagination">
      <vxe-pager :current-page.sync="pageInfo.currentPage" size="small" :page-size.sync="pageInfo.pageSize"
        :total="pageInfo.total"
        :layouts="['Home', 'PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump', 'End', 'Sizes', 'Total']"
        @page-change="pageChange">
      </vxe-pager>
    </div>
    <div>
      <vxe-modal show-footer show-confirm-button show-cancel-button :confirm-closable="false" @confirm="dataEvent"
        v-model="showPopup" :title="dialogTitle" height="440" width="500">
        <div class="form-container">
          <div class="form-row" style="margin-left:28px">
            <div class="lable">人员</div>
            <div>
              <vxe-pulldown v-model="formNameOptions.showPull" show-popup-shadow>
                <template #default>
                  <vxe-input ref="formNameInput" v-model="formNameOptions.searchName" class="form-input"
                    :class="{ 'validate-input': !formNameOptions.isValidate }" placeholder="人员名称"
                    @blur="handleEvent(formNameOptions)" @focus=" focusEvent(formNameOptions)"
                    @keyup="keyupEvent(formNameOptions)"></vxe-input>
                  <div :class="{ 'validate-message': !formNameOptions.isValidate }" v-if="!formNameOptions.isValidate">
                    {{ formNameOptions.error }}</div>
                </template>
                <template #dropdown v-if="formNameOptions.list.length > 0">
                  <div class="dropdown-select">
                    <div class="list-item" v-for="item in formNameOptions.list" :key="item.id"
                      @click="selectEvent(item, formNameOptions)">
                      <span>{{ item.name }}</span>
                    </div>
                  </div>
                </template>
              </vxe-pulldown>
            </div>
          </div>
          <div class="form-row" style="margin-left:28px">
            <div class="lable">项目</div>
            <div>
              <vxe-pulldown v-model="formProjectOptions.showPull" show-popup-shadow>
                <template #default>
                  <vxe-input v-model="formProjectOptions.searchName" class="form-input"
                    :class="{ 'validate-input': !formProjectOptions.isValidate }" placeholder="项目名称"
                    @blur="handleEvent(formProjectOptions)" @focus="focusEvent(formProjectOptions)"
                    @keyup="keyupEvent(formProjectOptions)"></vxe-input>
                  <div :class="{ 'validate-message': !formProjectOptions.isValidate }"
                    v-if="!formProjectOptions.isValidate">
                    {{ formProjectOptions.error }}</div>
                </template>
                <template #dropdown v-if="formProjectOptions.list.length > 0">
                  <div class="dropdown-select">
                    <div class="list-item" v-for="item in formProjectOptions.list" :key="item.id"
                      @click="selectEvent(item, formProjectOptions)">
                      <span>{{ item.name }}</span>
                    </div>
                  </div>
                </template>
              </vxe-pulldown>
            </div>
          </div>
          <div class="form-row">
            <div class="lable">开始日期</div>
            <vxe-date-picker v-model="formData.startDate" :editable="false" placeholder="开始日期"
              class="form-input"></vxe-date-picker>
          </div>
          <div class="form-row">
            <div class="lable">结束日期</div>
            <vxe-date-picker v-model="formData.endDate" :editable="false" placeholder="结束日期"
              class="form-input"></vxe-date-picker>
          </div>
          <div class="form-row" style="margin-left:28px">
            <div class="lable">状态</div>
            <div>
              <vxe-select v-model="formData.status" class="form-input" placeholder="请选择">
                <vxe-option value="1" label="进行中"></vxe-option>
                <vxe-option value="2" label="已完成"></vxe-option>
              </vxe-select>
            </div>
          </div>
        </div>
      </vxe-modal>
      <vxe-modal v-model="showConfirm" type="alert" status="warning" title="提示" width="280" showFooter
        @confirm="confrimEvent">
        <template #default>
          <span>
            <span>是否确认删除该条数据？</span>
          </span>
        </template>
      </vxe-modal>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { VxeUI } from 'vxe-pc-ui';
import { eventBus } from '../utils/eventBus'
import { serviceApi } from '../utils/service'
let tableHeight = ref(4320) //表格初始高度
let showPopup = ref(false) //是否显示dialog
let showConfirm = ref(false)
let dialogTitle = ref('') //dialog标题
let tableData = ref([]) //表格数据
const tableRef = ref() //表格对象
const formNameInput = ref()
const searchStatus = ref('0') //检索状态

const formData = reactive({
  id: 0,
  name: '',
  projectName: '',
  startDate: new Date().toLocaleDateString('zh-CN').replace(/\//g, '-'),
  endDate: new Date().toLocaleDateString('zh-CN').replace(/\//g, '-'),
  status: ''
});
const searchNameOptions = reactive({
  showPull: false,
  searchName: '',
  list: [],
  baseData: []
})
const searchProjectOptions = reactive({
  showPull: false,
  searchName: '',
  list: [],
  baseData: []
})

const formNameOptions = reactive({
  showPull: false,
  searchName: '',
  isValidate: true,
  error: '人员名称不能为空',
  list: [],
  baseData: []
})
const formProjectOptions = reactive({
  showPull: false,
  searchName: '',
  isValidate: true,
  error: '项目名称不能为空',
  list: [],
  baseData: []
})

const pageInfo = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 20
})

/**
 * alert信息
 * @param info
 */
const alertInfoFn = (info) => {
  VxeUI.modal.message({
    width: 200,
    top: 30,
    duration: 2000,
    content: info.message,
    status: info.alertStatus
  });
}

/**
 * 检索输入框获取焦点
 * @param options
 */
const focusEvent = (options) => {
  options.showPull = true;
  options.list = options.baseData;
}

/**
 * 表单校验
 * @param options
 */
const handleEvent = (options) => {
  window.setTimeout(() => {
    if (options.searchName === '') {
      options.isValidate = false
    } else {
      options.isValidate = true
    }
  }, 200)
}
/**
 *
 * @param options 输入触发检索
 */
const keyupEvent = (options) => {
  if (options.searchName === '') {
    options.isValidate = false
  } else {
    options.isValidate = true
  }
  options.list = options.searchName ? options.baseData.filter((item) => item.name.indexOf(options.searchName) > -1) : options.baseData;
}
/**
 * 搜索输入框下拉选择事件
 * @param item
 * @param options
 */
const selectEvent = (item, options) => {
  options.searchName = item.name;
  options.isValidate = true;
  options.showPull = false;
  options.list = options.baseData;
}
/**
 * 记录创建数据的人员名，用于下拉选择
 * @param name
 */
const insertPersonnel = (name) => {
  const data = {
    name: name
  }
  serviceApi.insertPersonnel(data).then((re) => { })
}
/**
 * 记录创建数据的项目名，用于下拉选择
 * @param name
 */
const insertProjectName = (name) => {
  const data = {
    name: name
  }
  serviceApi.insertProjectName(data).then((re) => { })
}
/**
 * 查询全部人员
 */
const selectPersonnel = () => {
  serviceApi.selectPersonnel().then((re) => {
    searchNameOptions.list = re.data
    searchNameOptions.baseData = re.data
    formNameOptions.list = re.data
    formNameOptions.baseData = re.data
  })
}
/**
 * 查询全部项目名称
 */
const selectProjectNames = () => {
  serviceApi.selectProjectNames().then((re) => {
    searchProjectOptions.list = re.data
    searchProjectOptions.baseData = re.data
    formProjectOptions.list = re.data
    formProjectOptions.baseData = re.data
  })
}
/**
 * 加载表格数据
 */
const handlePageData = () => {
  let status = ''
  if (searchStatus.value !== '0') {
    status = searchStatus.value
  }
  //如果持久化存储有每页条数，则优先使用
  const pageSize = Number(window.localStorage.getItem('PAGE_SIZE'))
  if (pageSize) {
    pageInfo.pageSize = pageSize
  }
  const searchData = { name: searchNameOptions.searchName, project: searchProjectOptions.searchName, status: status, page: pageInfo.currentPage, pageSize: pageInfo.pageSize }
  serviceApi.selectProjects(searchData).then((re) => {
    if (re.success) {
      pageInfo.total = re.pagination.total
      tableData.value = re.data
    } else {
      alertInfoFn({ isShow: true, message: '查询失败', alertStatus: 'error' })
    }
    // showPopup.value = false;
  })
  //重置表格滚动条
  tableRef.value.scrollTo(0, 0)
}

/**
 * 检索数据
 */
const searchData = () => {
  pageInfo.currentPage = 1
  handlePageData()
}
/**
 * 清除检索条件
 */
const clearSearchData = () => {
  pageInfo.currentPage = 1
  searchNameOptions.searchName = ''
  searchProjectOptions.searchName = ''
  searchStatus.value = '0'
  handlePageData()
}
/**
 * 表格页数变化触发
 * @param param0
 */
const pageChange = ({ pageSize, currentPage }) => {
  pageInfo.currentPage = currentPage;
  pageInfo.pageSize = pageSize;
  //持久化用户分页条数
  window.localStorage.setItem('PAGE_SIZE', pageInfo.pageSize)
  handlePageData();
}
/**
 * 新建事件
 */
const createEvent = () => {
  //重置校验
  formNameOptions.isValidate = true;
  formProjectOptions.isValidate = true;
  formNameOptions.searchName = '';
  formProjectOptions.searchName = '';
  dialogTitle.value = '新建'
  showPopup.value = true
  formData.status = '1';
}
/**
 * 编辑事件
 * @param row
 */
const editEvent = (row, isCopy) => {
  //重置校验
  formNameOptions.isValidate = true;
  formProjectOptions.isValidate = true;
  formNameOptions.searchName = row.name;
  formProjectOptions.searchName = row.project;
  dialogTitle.value = '编辑'
  if (isCopy) dialogTitle.value = '新建'
  showPopup.value = true
  formData.id = row.id;
  formData.startDate = row.startdate;
  formData.endDate = row.enddate;
  formData.status = row.status;
}
/**
 * 删除事件
 * @param row
 */
const deleteEvent = (row) => {
  showConfirm.value = true
  formData.id = row.id
}
/**
 * 新建数据
 */
const createData = () => {
  formData.name = formNameOptions.searchName
  formData.projectName = formProjectOptions.searchName
  if (formData.name === '') {
    formNameOptions.isValidate = false
  }
  if (formData.projectName === '') {
    formProjectOptions.isValidate = false
  }
  if (formNameOptions.isValidate && formProjectOptions.isValidate)
    serviceApi.insertProject({ ...formData }).then((re) => {
      if (re.success) {
        pageInfo.currentPage = 1 //保存成功初始化页数
        insertPersonnel(formData.name)
        insertProjectName(formData.projectName)
        selectPersonnel()
        selectProjectNames()
        handlePageData()
        alertInfoFn({ isShow: true, message: '创建成功', alertStatus: 'success' })
      } else {
        alertInfoFn({ isShow: true, message: '创建失败', alertStatus: 'error' })
      }
      showPopup.value = false;
    })
}
/**
 * 编辑数据
 */
const editData = () => {
  formData.name = formNameOptions.searchName
  formData.projectName = formProjectOptions.searchName
  if (formData.name === '') {
    formNameOptions.isValidate = false
  }
  if (formData.projectName === '') {
    formProjectOptions.isValidate = false
  }
  if (formNameOptions.isValidate && formProjectOptions.isValidate) {
    serviceApi.updateProject({ ...formData }).then((re) => {
      if (re.success) {
        insertPersonnel(formData.name)
        insertProjectName(formData.projectName)
        selectPersonnel()
        selectProjectNames()
        handlePageData()
        alertInfoFn({ isShow: true, message: '更新成功', alertStatus: 'success' })
      } else {
        alertInfoFn({ isShow: true, message: '更新失败', alertStatus: 'error' })
      }
      showPopup.value = false;
    })
  }
}
/**
 * 删除数据
 * @param id
 */
const confrimEvent = () => {
  let status = ''
  if (searchStatus.value !== '0') {
    status = searchStatus.value
  }
  const deleteInfo = { id: formData.id, name: searchNameOptions.searchName, project: searchProjectOptions.searchName, status: status, page: pageInfo.currentPage, pageSize: pageInfo.pageSize }
  serviceApi.deleteProject(deleteInfo).then((re) => {
    if (re.success) {
      // 如果删除最后一条数据，当前页数小于总页数，重置当前页数
      if (re.pagination.page > re.pagination.totalPages) {
        pageInfo.currentPage = re.pagination.totalPages
      }
      handlePageData()
      alertInfoFn({ isShow: true, message: '删除成功', alertStatus: 'success' })
    } else {
      alertInfoFn({ isShow: true, message: '删除失败', alertStatus: 'error' })
    }
    showConfirm.value = false;
  })
}
/**
 * 对话框确认按钮事件
 */
const dataEvent = () => {
  if (dialogTitle.value === '新建') {
    createData()
  } else {
    editData()
  }

}

onMounted(() => {
  let timeoutId = null;
  const delay = 100; // 防抖刷新时间间隔
  //动态控制表格高度
  const handleResize = (height) => {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    // 设置新的定时器
    timeoutId = setTimeout(() => {
      tableHeight.value = height - 160
    }, delay)
  }
  //获取主进程窗口初始化尺寸
  if (window.ipcRenderer) {
    ipcRenderer.invoke('win-size').then((re) => {
      handleResize(re[1])
    })
  }
  //监听主进程窗口变化
  eventBus.on(eventBus.events.WIN_RESIZE, (size) => {
    handleResize(size.height)
  });
  //加载数据
  selectPersonnel()
  selectProjectNames()
  handlePageData()
})
</script>
<style scoped>
.search-container {
  display: flex;
  padding: 5px;
  gap: 15px;
  font-size: 14px;
  height: 34px;
  width: auto;
  border: 1px solid #dddddd
}

.pagination {
  padding-top: 6px;
  display: flex;
  width: auto;
  justify-content: center;
}

.total {
  font-size: 14px;
  color: #606266;
  margin-left: 10px;
  padding-top: 5px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  /* 表单项之间的间距 */
  margin-bottom: 20px;
}

.table-container {
  margin-top: 0px;
}

.btn-container {
  width: 100%;
  padding: 5px;
  display: flex;
  justify-content: flex-end;
}

.dropdown-select {
  max-height: 200px;
  overflow: auto;
  border-radius: 4px;
  border: 1px solid #eee;
  background-color: #fff;
}

.list-item {
  cursor: pointer;
  padding: 5px;
}

.list-item:hover {
  background-color: #f5f7fa;

}

.lable {
  color: #606266;
  padding: 7px 5px 5px 5px;
}

.search-item {
  width: 250px;
}

.form-input {
  width: 300px;
}

.validate-input {
  border: 1px solid #f64227;
}

.validate-message {
  position: absolute;
  font-size: 12px;
  color: #f64227;
}

.form-container {
  margin-top: 15px;
  margin-left: 50px;
}
</style>
