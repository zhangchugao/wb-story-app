'use strict';

const db = require('../db');

function all() {
  return db.prepare('SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order ASC, id ASC').all();
}

module.exports = { all };
