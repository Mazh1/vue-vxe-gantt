import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";

class DatabaseService {
  constructor() {
    // 数据库文件路径（在用户数据目录中）
    this.dbPath = path.join(app.getPath("userData"), "ganttchat.db");
    this.db = null;
    console.log("DATABASE PATH:", this.dbPath);
  }
  // 初始化数据库
  initialize() {
    try {
      this.db = new Database(this.dbPath);
      this.createTables();
      console.log("CONNECT SUCCESS!");
    } catch (error) {
      console.error("CONNECT ERROR!:", error);
      throw error;
    }
  }

  // 创建表
  createTables() {
    const createProjectTableSQL = `
        CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        project TEXT NOT NULL,
        startdate TEXT NOT NULL,
        enddate TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    const createPersonnelTableSQL = `
        CREATE TABLE IF NOT EXISTS personnel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    const createProjectNameTableSQL = `
        CREATE TABLE IF NOT EXISTS projectnames  (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    this.db.exec(createProjectTableSQL);
    this.db.exec(createPersonnelTableSQL);
    this.db.exec(createProjectNameTableSQL);
  }
  // 插入人员名称
  insertPersonnel(data) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO personnel (name)
      VALUES (?)
    `);

    try {
      const result = stmt.run(data.name);
      return {
        success: true,
        id: result.lastInsertRowid,
        changes: result.changes,
      };
    } catch (error) {
      console.error("INSERT ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  // 插入项目名称
  insertProjectName(data) {
    const stmt = this.db.prepare(`
     INSERT OR IGNORE INTO projectnames (name)
      VALUES (?)
    `);

    try {
      const result = stmt.run(data.name);
      return {
        success: true,
        id: result.lastInsertRowid,
        changes: result.changes,
      };
    } catch (error) {
      console.error("INSERT ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  //查询人员数据列表
  selectPersonnel() {
    const selectSql = `
            SELECT id, name, created_at
            FROM personnel
            ORDER BY created_at DESC
          `;
    const stmt = this.db.prepare(selectSql);
    const data = stmt.all();
    return {
      success: true,
      data,
    };
  }
  //查询项目名称数据列表
  selectProjectNames() {
    const selectSql = `
            SELECT id, name, created_at
            FROM projectnames
            ORDER BY created_at DESC
          `;
    const stmt = this.db.prepare(selectSql);
    const data = stmt.all();
    return {
      success: true,
      data,
    };
  }
  // 插入项目数据
  insertProject(data) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, project, startdate, enddate, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        data.name,
        data.projectName,
        data.startDate,
        data.endDate,
        data.status
      );
      return {
        success: true,
        id: result.lastInsertRowid,
        changes: result.changes,
      };
    } catch (error) {
      console.error("INSERT ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  // 更新项目数据
  updateProject(data) {
    const stmt = this.db.prepare(`
      UPDATE projects
        SET name = @name,
        project = @projectName,
        startdate = @startDate,
        enddate = @endDate,
        status = @status
      WHERE id = @id
    `);

    try {
      const result = stmt.run(data);
      return {
        success: true,
        id: result.lastInsertRowid,
        changes: result.changes,
      };
    } catch (error) {
      console.error("UPDATE ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  // 删除项目数据
  deleteProject(data) {
    const stmt = this.db.prepare(`
      DELETE FROM projects WHERE id = @id
    `);

    try {
      const result = stmt.run(data);
      //删除数据后，重新获取数据页数、总数等信息，避免删除最后一条数据出现查询不到数据的情况
      const dataInfo = this.selectProjects(data);
      return {
        success: true,
        id: result.lastInsertRowid,
        pagination: dataInfo.pagination, //删除后数据页数、总数等信息
        changes: result.changes,
      };
    } catch (error) {
      console.error("DELETE ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  //查询数据
  selectProjects(options = {}) {
    const { name, project, status, page = 1, pageSize = 20 } = options;

    // 构建查询条件和参数
    const conditions = [];
    const params = [];

    if (name) {
      conditions.push("name LIKE ?");
      params.push(`%${name}%`);
    }

    if (project) {
      conditions.push("project LIKE ?");
      params.push(`%${project}%`);
    }

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    // 构建 WHERE 子句
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 计算分页偏移
    const offset = (page - 1) * pageSize;

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
    const countStmt = this.db.prepare(countSql);
    const totalResult = countStmt.get(...params);
    const total = totalResult.total;

    // 查询分页数据
    const dataSql = `
            SELECT id, name, project, startdate, enddate, status, created_at
            FROM projects
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
    const dataStmt = this.db.prepare(dataSql);
    const dataParams = [...params, pageSize, offset];
    const data = dataStmt.all(...dataParams);

    // 计算分页信息
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
  /**
   * 查询首页gantt图原始数据
   * @param {*} data
   * @returns
   */
  selectHomeData(data) {
    const stmt = this.db.prepare(`
      SELECT * FROM projects
      WHERE
          (date(startdate) BETWEEN date(@startDate) AND date(@endDate))
          OR
          (date(enddate) BETWEEN date(@startDate) AND date(@endDate))
      ORDER BY created_at DESC
      LIMIT 200
    `);
    try {
      const result = stmt.all(data);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("SELECT ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  /**
   * 清除人员名称、项目名称缓存数据表
   * @returns
   */
  clearCache() {
    const txn = this.db.transaction(() => {
      const stmt1 = this.db.prepare(`DELETE FROM projectnames`);
      const stmt2 = this.db.prepare(`DELETE FROM personnel`);
      stmt1.run();
      stmt2.run();
    });
    try {
      txn();
      return {
        success: true,
        data: {},
      };
    } catch (error) {
      console.error("CLEAR CACHE ERROR:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default new DatabaseService();
