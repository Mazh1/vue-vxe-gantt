<template>
  <div>
    <div class="date-container">
      <vxe-date-range-picker size="small" style="width: 200px;" v-model="dateObj.dates" @change="selectDate"
        type="date"></vxe-date-range-picker>
    </div>
    <vxe-tabs @tab-click="loadData">
      <vxe-tab-pane title="人员维度" name="name">
        <vxe-gantt class="mygantt-scrollbar" v-bind="ganttOptionsName">
          <template #seq_temp="{ row }">
            {{ row.seq }}
          </template>
          <template #name_temp="{ row }">
            <span v-if="row.personnel_type === '外包'" style="color:#dd1311">*</span>
            {{ row.name || ''}}
          </template>
        </vxe-gantt>
      </vxe-tab-pane>
      <vxe-tab-pane title="项目维度" name="project">
        <vxe-gantt class="mygantt-scrollbar" v-bind="ganttOptionsProject">
          <template #seq_temp="{ row }">
            {{ row.seq }}
          </template>
          <template #name_temp="{ row }">
            <span v-if="row.personnel_type === '外包'" style="color:#dd1311">*</span>
            {{row.title || ''}}
          </template>
        </vxe-gantt>
      </vxe-tab-pane>
      <vxe-tab-pane title="数据分析" name="analysis">
        <div class="analysis-wrap">
          <div class="analysis-panel">
            <div class="analysis-section">
              <div class="analysis-title">人员负荷分析</div>
              <div class="load-bar-list">
                <div class="load-bar-item" v-for="(item, index) in analysisPersonList" :key="item.name">
                  <span class="load-bar-name"><span v-if="item.isOutsource" class="outsource-mark">*</span>{{ item.name }}</span>
                  <div class="load-bar-wrap">
                    <div
                      class="load-bar-fill"
                      :class="item.barColor"
                      :style="{ width: item.barWidthPercent + '%' }"
                    ></div>
                  </div>
                  <span class="load-bar-percent">{{ item.percentText }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="analysis-panel analysis-panel-right">
            <div class="analysis-section">
              <div class="analysis-title">项目投入人员情况</div>
              <div class="project-staffing-list">
                <div
                  v-for="group in projectStaffingList"
                  :key="group.priority"
                  class="priority-group"
                >
                  <div class="priority-label" :class="'priority-' + group.priorityKey">
                    {{ group.priorityLabel }}
                  </div>
                  <div class="project-list">
                    <div
                      v-for="proj in group.projects"
                      :key="proj.name"
                      class="project-item"
                    >
                      <span class="project-name">{{ proj.name }}</span>
                      <span class="project-persons">
                        <template v-for="(p, i) in proj.persons">
                          <span v-if="p.personnelType === '外包'" class="outsource-mark">*</span>{{ p.name }}<span v-if="i < proj.persons.length - 1">、</span>
                        </template>
                        （{{ proj.count }}人）
                      </span>
                    </div>
                    <div v-if="group.projects.length === 0" class="project-empty">暂无项目</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </vxe-tab-pane>
    </vxe-tabs>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { serviceApi } from '../utils/service'
let nowTab = 'name'
const dateObj = reactive({})
const analysisPersonList = ref([])
const projectStaffingList = ref([])
/**
 * 获取日期范围内工作日天数（周一至周五）
 */
function getWorkingDaysInRange(startStr, endStr) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day >= 1 && day <= 5) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

/**
 * 某人在范围内投入的总人天（并行多项目时按各任务天数相加，可大于工作日天数）
 */
function countAssignedDaysInRange(tasks, rangeStartStr, rangeEndStr) {
  const rangeStart = new Date(rangeStartStr)
  const rangeEnd = new Date(rangeEndStr)
  let total = 0
  tasks.forEach(task => {
    const taskStart = new Date(task.start)
    const taskEnd = new Date(task.end)
    const from = taskStart > rangeStart ? taskStart : rangeStart
    const to = taskEnd < rangeEnd ? taskEnd : rangeEnd
    if (from <= to) {
      const d = new Date(from)
      let n = 0
      while (d <= to) {
        n++
        d.setDate(d.getDate() + 1)
      }
      total += n
    }
  })
  return total
}

/**
 * 按日期范围内负荷情况分析：人员维度（血条展示）
 * 超过工作日=红，等于=黄，小于=绿；血条固定长度，右侧显示百分比，超出显示 >100%
 */
function computeAnalysis(tableData, rangeStartStr, rangeEndStr) {
  const workingDays = getWorkingDaysInRange(rangeStartStr, rangeEndStr)
  if (workingDays <= 0) return []

  const personMap = new Map()
  tableData.forEach(item => {
    if (!personMap.has(item.name)) personMap.set(item.name, [])
    personMap.get(item.name).push(item)
  })

  const personList = []
  personMap.forEach((tasks, name) => {
    const assignedDays = countAssignedDaysInRange(tasks, rangeStartStr, rangeEndStr)
    const ratio = assignedDays / workingDays
    let barColor = 'green'
    if (ratio > 1) barColor = 'red'
    else if (ratio >= 0.999) barColor = 'yellow'

    const barWidthPercent = Math.min(100, Math.round(ratio * 100))
    const percentText = Math.round(ratio * 100) + '%'
    const isOutsource = tasks.some(t => t.personnel_type === '外包')

    personList.push({
      name,
      isOutsource,
      assignedDays,
      workingDays,
      ratio,
      barColor,
      barWidthPercent,
      percentText
    })
  })
  personList.sort((a, b) => b.ratio - a.ratio)
  return personList
}

const PRIORITY_ORDER = ['高', '中', '低']
const PRIORITY_LABELS = { 高: '高优先级', 中: '中优先级', 低: '低优先级' }

/**
 * 判断任务是否与日期范围有交集
 */
function taskOverlapsRange(task, rangeStartStr, rangeEndStr) {
  const start = new Date(task.start)
  const end = new Date(task.end)
  const rangeStart = new Date(rangeStartStr)
  const rangeEnd = new Date(rangeEndStr)
  return start <= rangeEnd && end >= rangeStart
}

/**
 * 按优先级分类统计项目投入人员（在日期范围内有任务的项目）
 */
function computeProjectStaffing(tableData, rangeStartStr, rangeEndStr) {
  const inRange = tableData.filter(item => taskOverlapsRange(item, rangeStartStr, rangeEndStr))
  const byPriority = new Map()
  PRIORITY_ORDER.forEach(p => {
    byPriority.set(p, new Map())
  })
  inRange.forEach(item => {
    const priority = (item.priority && PRIORITY_ORDER.includes(item.priority)) ? item.priority : '中'
    const projectName = item.title || item.project || ''
    if (!projectName) return
    if (!byPriority.get(priority).has(projectName)) {
      byPriority.get(priority).set(projectName, new Map())
    }
    byPriority.get(priority).get(projectName).set(item.name, item.personnel_type || '正式')
  })
  return PRIORITY_ORDER.map(p => {
    const projectMap = byPriority.get(p)
    const projects = []
    projectMap.forEach((personTypeMap, name) => {
      const persons = Array.from(personTypeMap.entries()).map(([personName, personnelType]) => ({
        name: personName,
        personnelType
      }))
      projects.push({
        name,
        persons,
        count: persons.length
      })
    })
    projects.sort((a, b) => a.name.localeCompare(b.name))
    return {
      priority: p,
      priorityKey: p === '高' ? 'high' : p === '中' ? 'mid' : 'low',
      priorityLabel: PRIORITY_LABELS[p],
      projects
    }
  })
}

/**
 * 如果本地未持久化日期范围，设置默认当前月
 */
function getDefaultDate() {
  const d = new Date();
  const format = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${format(firstDay)},${format(lastDay)}`;
}
/**
 * 数组对象属性互换
 * @param arr
 * @param prop1
 * @param prop2
 */
function swapProperties(arr, prop1, prop2) {
  return arr.map(item => {
    return {
      ...item,
      [prop1]: item[prop2],
      [prop2]: item[prop1]
    };
  });
}

/**
 * 为分组后的数据创建(序号)seq
 */
function addSeqToGroups(data) {
  const seqMap = new Map();
  let seq = 0;
  return data.map(item => ({
    ...item,
    seq: seqMap.has(item.name) ? seqMap.get(item.name) : (seqMap.set(item.name, ++seq), seq)
  }));
}
/**
 * 格式化数据满足gantt
 */
function formatData(data) {
  const nameGroups = data.reduce((groups, item) => {
    if (!groups[item.name]) {
      groups[item.name] = {
        name: item.name,
        earliestStart: item.start,
        items: []
      };
    }

    groups[item.name].items.push(item);

    // 更新最早开始日期
    if (new Date(item.start) < new Date(groups[item.name].earliestStart)) {
      groups[item.name].earliestStart = item.start;
    }

    return groups;
  }, {});

  // 2. 将分组对象转换为数组，并按最早 start 日期排序
  const sortedGroups = Object.values(nameGroups).sort((a, b) =>
    new Date(a.earliestStart) - new Date(b.earliestStart)
  );

  // 3. 将排序后的分组数据展平为最终数组，同时记录分组信息
  let currentIndex = 0;
  const dataArr = [];
  const groupRanges = [];

  sortedGroups.forEach(group => {
    // 对组内项目按 start 日期排序
    const sortedItems = group.items.sort((a, b) => new Date(a.start) - new Date(b.start));

    const groupSize = sortedItems.length;
    const startIndex = currentIndex;
    const endIndex = currentIndex + groupSize - 1;

    // 记录分组范围
    groupRanges.push({
      start: startIndex + 1, // 转换为1-based索引
      end: endIndex + 1     // 转换为1-based索引
    });
    // 添加到结果数组
    dataArr.push(...sortedItems);
    currentIndex += groupSize;
  });
  //为分组后的数据增加序号字段
  const reData = addSeqToGroups(dataArr);
  const mergeCells = []
  groupRanges.forEach(item => {
    let margeCell1 = { row: 1, col: 1, rowspan: 1, colspan: 1 }
    let margeCell2 = { row: 1, col: 1, rowspan: 1, colspan: 1 }
    if (item.end > item.start) {
      margeCell1.row = item.start - 1;
      margeCell1.rowspan = item.end - item.start + 1;
      margeCell1.col = 0;
      mergeCells.push(margeCell1);
      margeCell2.row = item.start - 1;
      margeCell2.rowspan = item.end - item.start + 1;
      mergeCells.push(margeCell2);
    }
  });
  return {
    data: reData,
    mergeCells: mergeCells
  }
}

/**
 * 格式化精简日期
 */
function formatDateRange(start, end) {
  const format = (dateStr) => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  return {
    start: format(start),
    end: format(end)
  };
}

/**
 * 生成gantt配置参数
 */
function getGanttOptions(columns, taskKey) {
  debugger
  const ganttOptions = {
    border: true,
    size: 'small',
    autoResize: true,
    height: window.innerHeight - 80,
    rowConfig: {
      isCurrent: false,
      isHover: true
    },
    mergeCells: [],
    cellConfig: {
      height: 35
    },
    taskSplitConfig: {
      showCollapseTaskButton: false
    },
    taskBarConfig: {
      showProgress: false,
      showContent: true,
      contentMethod({ row }) {
        const dateObj = formatDateRange(row.start, row.end);
        return `${row[taskKey]}` + '【' + `${dateObj.start}` + '~' + `${dateObj.end}` + '】';
      },
      barStyle({ row }) {
        let bgColor = ''
        const yu = row.seq % 2
        if (yu !== 0) {
          bgColor = '#d87ac2'
        } else {
          bgColor = '#e0c331'
        }
        return {
          round: true,
          bgColor: bgColor,
          lineHeight: '30px',
          completedBgColor: bgColor
        }
      }
    },
    taskViewConfig: {
      tableStyle: {
        width: 320
      },
      showNowLine: true,
      viewStyle: {
        rowStyle({ row }) {
          const yu = row.seq % 2
          if (yu !== 0) {
            return {
              // backgroundColor: '#fff8dc'
              // backgroundColor: '#fff0f5'
            };
          } else {
            return {
              // backgroundColor: '#fff8dc'
              // backgroundColor: '#fff0f5'
            };
          }

        }
      },
      scales: [
        {
          type: 'month',
          headerCellStyle() {
            return {
              color: '#dd1311',
              fontSize: '14px'
            };
          }
        },
        {
          type: 'day',
          headerCellStyle({ dateObj }) {
            // 周六周日高亮
            if (dateObj.e === 0 || dateObj.e === 6) {
              return {
                color: '#4cc71e'
              };
            }
            return {};
          }
        },
        {
          type: 'date',
          headerCellStyle({ dateObj }) {
            // 周六周日高亮
            if (dateObj.e === 0 || dateObj.e === 6) {
              return {
                backgroundColor: '#ffffcc'
              };
            }
            return {};
          }
        }
      ]
    },
    columns: columns,
    data: []
  };
  return ganttOptions;
}

let tableData = []

// 人员维度
const ganttNameColumns = [
  { type: 'seq', width: 50, align: 'center', slots: { default: 'seq_temp' } },
  { field: 'name', title: '姓名', width: 70, align: 'center', slots: { default: 'name_temp' } },
  { field: 'title', title: '产品/项目', width: 200 }
]
const ganttOptionsName = reactive(getGanttOptions(ganttNameColumns, 'title'));

// 项目维度
const ganttProjectColumns = [
  { type: 'seq', width: 50, align: 'center', slots: { default: 'seq_temp' } },
  { field: 'name', title: '产品/项目', width: 200 },
  { field: 'title', title: '姓名', width: 70, align: 'center', slots: { default: 'name_temp' } }
]
const ganttOptionsProject = reactive(getGanttOptions(ganttProjectColumns, 'title'))
/**
 * tab切换事件
 * @param event
 */
const loadData = (event) => {
  nowTab = event.name
  if (event.name === 'analysis') {
    let dateArr = []
    if (Array.isArray(dateObj.dates)) {
      dateArr = dateObj.dates
    } else if (typeof dateObj.dates === 'string') {
      dateArr = dateObj.dates.split(',').map(s => s.trim())
    } else if (dateObj.dates && typeof dateObj.dates.value === 'string') {
      dateArr = dateObj.dates.value.split(',').map(s => s.trim())
    }
    if (dateArr.length >= 2 && dateArr[0] && dateArr[1]) {
      analysisPersonList.value = computeAnalysis(tableData, dateArr[0], dateArr[1])
      projectStaffingList.value = computeProjectStaffing(tableData, dateArr[0], dateArr[1])
    } else {
      analysisPersonList.value = []
      projectStaffingList.value = []
    }
    return
  }
  let fd = formatData(tableData)
  let ganttOptions = ganttOptionsName;
  if (event.name === 'project') {
    fd = formatData(swapProperties(tableData, 'name', 'title'))
    ganttOptions = ganttOptionsProject;
  }
  Object.assign(ganttOptions, {
    mergeCells: fd.mergeCells,
    data: fd.data
  })
}

/**
 * 选择日期触发，持久化存储
 * @param dates
 */
const selectDate = (dateObj) => {
  const arr = dateObj.value.split(',')
  if (arr.length > 1 && arr[0] !== '' && arr[1] !== '') {
    window.localStorage.setItem('DATE_RANGE', arr)
    initData({ name: nowTab })
  }
}
/**
 * 初始化数据
 */
const initData = (event) => {
  tableData = []
  let dataArr = window.localStorage.getItem('DATE_RANGE')
  if (!dataArr) {
    dateObj.dates = getDefaultDate()
  } else {
    dateObj.dates = dataArr
  }
  const dateArr = dateObj.dates.split(',')
  const data = {
    startDate: dateArr[0],
    endDate: dateArr[1]
  }
  serviceApi.selectHomeData(data).then((re) => {
    if (re.success) {
      re.data.forEach(item => {
        const newItem = {
          id: item.id,
          name: item.name,
          title: item.project,
          start: item.startdate,
          end: item.enddate,
          isMark: 0,
          priority: item.priority || '中',
          personnel_type: item.personnel_type || '正式'
        }
        tableData.push(newItem)
      });
      loadData(event)
    }
  })
}
initData({ name: 'name' })
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.vxe-gantt-view--chart-content {
  width: 100% !important;
  font-size: 12px !important;
  margin-top: -3px;
}

/* .is--now:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background-color: red !important;
} */

/* .vxe-gantt-view--header-column.is--now {
  color: red !important;
} */

.mygantt-scrollbar {
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    cursor: pointer;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 6px;
  }
}

/** 默认模式 */
[data-vxe-ui-theme="light"] {
  .mygantt-scrollbar {

    ::-webkit-scrollbar-track,
    ::-webkit-scrollbar-corner {
      background-color: #FFFFFF;
    }

    ::-webkit-scrollbar-thumb {
      background-color: #bfbfbf;
    }

    ::-webkit-scrollbar-thumb:hover,
    ::-webkit-scrollbar-thumb:active {
      background-color: #787878;
    }
  }
}

/** 暗黑模式 */
[data-vxe-ui-theme="dark"] {
  .mygantt-scrollbar {

    ::-webkit-scrollbar-track,
    ::-webkit-scrollbar-corner {
      background-color: #151518;
    }

    ::-webkit-scrollbar-thumb {
      background-color: #bfbfbf;
    }

    ::-webkit-scrollbar-thumb:hover,
    ::-webkit-scrollbar-thumb:active {
      background-color: #A3A6AD;
    }
  }
}

.date-container {
  position: absolute;
  top: 34px;
  right: 5px;
  z-index: 999;
}

.analysis-wrap {
  display: flex;
  width: 100%;
  max-width: 100%;
  gap: 16px;
  box-sizing: border-box;
  overflow-x: hidden;
  align-items: flex-start;
}

.analysis-panel {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1 1 0;
  min-width: 0;
  max-width: 50%;
  box-sizing: border-box;
}

.analysis-panel-right {
  flex: 1 1 0;
  min-width: 0;
  max-width: 50%;
}

.analysis-section {
  flex: 0 0 auto;
  min-width: 0;
  width: 100%;
}

.analysis-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 4px;
}

.load-bar-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 28px;
  min-width: 0;
  max-width: 100%;
}

.load-bar-name {
  flex-shrink: 0;
  width: 72px;
  font-size: 13px;
  color: #303133;
}

.outsource-mark {
  color: #dd1311;
}

.load-bar-wrap {
  flex: 1 1 auto;
  min-width: 60px;
  height: 20px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.load-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.2s ease;
}

.load-bar-fill.green {
  background: linear-gradient(90deg, #85ce61, #67c23a);
}

.load-bar-fill.yellow {
  background: linear-gradient(90deg, #ebb563, #e6a23c);
}

.load-bar-fill.red {
  background: linear-gradient(90deg, #f78989, #f56c6c);
}

.load-bar-percent {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  min-width: 44px;
}

.project-staffing-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.priority-group {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.priority-label {
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.priority-label.priority-high {
  background: linear-gradient(90deg, #f78989, #f56c6c);
}

.priority-label.priority-mid {
  background: linear-gradient(90deg, #ebb563, #e6a23c);
}

.priority-label.priority-low {
  background: linear-gradient(90deg, #85ce61, #67c23a);
}

.project-list {
  padding: 8px 10px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-item {
  font-size: 13px;
  color: #303133;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  word-break: break-word;
}

.project-name {
  font-weight: 500;
  flex-shrink: 0;
  max-width: 100%;
}

.project-persons {
  color: #606266;
  min-width: 0;
  word-break: break-word;
}

.project-empty {
  font-size: 12px;
  color: #909399;
  padding: 4px 0;
}
</style>
