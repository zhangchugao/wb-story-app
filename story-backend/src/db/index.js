'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

// 建库（不带 database 连接）
async function ensureDatabase() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
}

// 初始化连接池 + 建表（异步，server 启动前 await）
async function init() {
  fs.mkdirSync(config.audio.dir, { recursive: true });
  await ensureDatabase();

  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit,
    charset: 'utf8mb4',
    multipleStatements: true,
    namedPlaceholders: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  return pool;
}

function getPool() {
  if (!pool) throw new Error('数据库未初始化，请先 await db.init()');
  return pool;
}

// 薄封装：返回所有行
async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params || []);
  return rows;
}

// 返回单行（无结果返回 undefined）
async function get(sql, params) {
  const [rows] = await getPool().execute(sql, params || []);
  return rows[0];
}

// 执行写入，返回 { insertId, affectedRows }
async function run(sql, params) {
  const [result] = await getPool().execute(sql, params || []);
  return { insertId: result.insertId, affectedRows: result.affectedRows, changes: result.affectedRows };
}

// 事务：fn 接收一个 tx 对象（query/get/run），全部走同一连接
async function transaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const tx = {
      query: async (sql, params) => (await conn.execute(sql, params || []))[0],
      get: async (sql, params) => (await conn.execute(sql, params || []))[0][0],
      run: async (sql, params) => {
        const [r] = await conn.execute(sql, params || []);
        return { insertId: r.insertId, affectedRows: r.affectedRows, changes: r.affectedRows };
      },
    };
    const result = await fn(tx);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function close() {
  if (pool) await pool.end();
}

module.exports = { init, getPool, query, get, run, transaction, close };
