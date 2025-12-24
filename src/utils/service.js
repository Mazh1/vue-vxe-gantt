export const serviceApi = {
  // 插入单条数据
  async insertProject(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke("database:insertProject", data);
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 更新项目数据
  async updateProject(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke("database:updateProject", data);
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 更新项目数据
  async deleteProject(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke("database:deleteProject", data);
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 查询数据
  async selectProjects(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke(
          "database:selectProjects",
          data
        );
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 插入人员名称
  async insertPersonnel(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke(
          "database:insertPersonnel",
          data
        );
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 插入项目名称
  async insertProjectName(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke(
          "database:insertProjectName",
          data
        );
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 查询全部人员名称
  async selectPersonnel() {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke("database:selectPersonnel");
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 查询全部项目名称
  async selectProjectNames() {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke("database:selectProjectNames");
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // 查询全部项目名称
  async selectHomeData(data) {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke(
          "database:selectHomeData",
          data
        );
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, // 查询全部项目名称
  async clearCache() {
    try {
      if (window.ipcRenderer) {
        const result = await ipcRenderer.invoke("database:clearCache");
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
