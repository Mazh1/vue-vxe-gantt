<template>
  <div>
    <vxe-tabs @tab-click="loadData">
      <vxe-tab-pane title="人员维度" name="name">
        <vxe-gantt class="mygantt-scrollbar" v-bind="ganttOptionsName">
          <template #seq_temp="{ row }">
            {{ row.seq }}
          </template>
          <template #name_temp="{ row }">
            <span v-if="row.isMark === 1" style="color:#dd1311">*</span>
            {{ row.name }}
          </template>
        </vxe-gantt>
      </vxe-tab-pane>
      <vxe-tab-pane title="项目维度" name="project">
        <vxe-gantt class="mygantt-scrollbar" v-bind="ganttOptionsProject">
          <template #seq_temp="{ row }">
            {{ row.seq }}
          </template>
          <template #name_temp="{ row }">
            <span v-if="row.isMark === 1" style="color:#dd1311">*</span>
            {{ row.title }}
          </template>
        </vxe-gantt>
      </vxe-tab-pane>
    </vxe-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { serviceApi } from '../utils/service'
const ganttRef = ref()
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
  const ganttOptions = {
    border: true,
    size: 'small',
    autoResize: true,
    height: window.innerHeight - 80,
    rowConfig: {
      isCurrent: true,
      isHover: true
    },
    mergeCells: [],
    cellConfig: {
      height: 35
    },
    taskBarConfig: {
      showProgress: false,
      showContent: true,
      contentMethod({ row }) {
        const dateObj = formatDateRange(row.start, row.end);
        return `${row[taskKey]}` + '【' + `${dateObj.start}` + '~' + `${dateObj.end}` + '】';
      },
      barStyle: {
        round: true,
        bgColor: '#29b6f6',
        lineHeight: '30px',
        completedBgColor: '#65c16f'
      }
    },
    taskViewConfig: {
      tableStyle: {
        width: 320
      },
      showNowLine: true,
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

const tableData = []

// 人员维度
// const ganttDataName = formatData(testData)
// ganttDataName.columns = [
//   { type: 'seq', width: 50, align: 'center', slots: { default: 'seq_temp' } },
//   { field: 'name', title: '姓名', width: 70, align: 'center', slots: { default: 'name_temp' } },
//   { field: 'title', title: '产品/项目', width: 200 }
// ]
const ganttNameColumns = [
  { type: 'seq', width: 50, align: 'center', slots: { default: 'seq_temp' } },
  { field: 'name', title: '姓名', width: 70, align: 'center', slots: { default: 'name_temp' } },
  { field: 'title', title: '产品/项目', width: 200 }
]
const ganttOptionsName = reactive(getGanttOptions(ganttNameColumns, 'title'));

// 项目维度
// const ganttDataNameProject = formatData(swapProperties(tableData, 'name', 'title'))
const ganttProjectColumns = [
  { type: 'seq', width: 50, align: 'center', slots: { default: 'seq_temp' } },
  { field: 'name', title: '产品/项目', width: 200 },
  { field: 'title', title: '姓名', width: 70, align: 'center', slots: { default: 'name_temp' } }
]
const ganttOptionsProject = reactive(getGanttOptions(ganttProjectColumns, 'name'))
/**
 * tab切换事件
 * @param event
 */
const loadData = (event) => {
  if (event.name === 'project') {
    const fd = formatData(swapProperties(tableData, 'name', 'title'))
    Object.assign(ganttOptionsProject, {
      mergeCells: fd.mergeCells,
      data: fd.data
    })
  }
}
/**
 * 初始化数据
 */
const initData = () => {
  const data = {
    startDate: '2025-11-09',
    endDate: '2025-12-31'
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
          isMark: 0
        }
        tableData.push(newItem)
      });
      const fd = formatData(tableData)
      Object.assign(ganttOptionsName, {
        mergeCells: fd.mergeCells,
        data: fd.data
      })
    }
  })
}
initData()
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
</style>
