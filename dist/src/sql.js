"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
exports.default = {
    getTables: fs.readFileSync(__dirname + '/../sql/tables.sql').toString(),
    getColumns: fs.readFileSync(__dirname + '/../sql/columns.sql').toString(),
    getConstraints: fs.readFileSync(__dirname + '/../sql/constraints.sql').toString()
};
