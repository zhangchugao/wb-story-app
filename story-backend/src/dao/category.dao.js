'use strict';

const db = require('../db');

async function all() {
  return db.query('SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order ASC, id ASC');
}

module.exports = { all };
