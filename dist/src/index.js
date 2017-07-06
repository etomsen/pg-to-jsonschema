"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sql_1 = require("./sql");
const _groupBy = require("lodash.groupby");
const _transform = require("lodash.transform");
const _keyBy = require("lodash.keyby");
const outputFile = require("output-file");
const pgPromise = require("pg-promise");
function createColumnSchema(columnName, columnType, maxLength, description) {
    if (description) {
        description = description.replace(/\n|\r/g, ' ');
        description = description.replace(/\n|\r/g, ' ');
        description = description.replace(/\n|\r/g, ' ');
        description = description.replace(/\n|\r/g, ' ');
        description = description.replace(/\n|\r/g, ' ');
    }
    let result = `\t"${columnName}": {\n`;
    switch (columnType) {
        case 'integer':
        case 'bigint':
            result += `\t\t\t"type": "number"`;
            break;
        case 'character varying':
            result += `\t\t\t"type": "string"`;
            break;
        case 'timestamp without time zone':
            result += `\t\t\t"type": "number",\n`;
            result += `\t\t\t"format": "date-time"`;
            break;
        case 'time without time zone':
            result += `\t\t\t"type": "string",\n`;
            result += `\t\t\t"pattern": "^0?([0-9][0-2]?):([0-5][0-9])$"`;
            break;
        case 'uuid':
            result += `\t\t\t"type": "string",\n`;
            result += `\t\t\t"pattern": "^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$"`;
            break;
        case 'date':
            result += `\t\t\t"type": "string",\n`;
            result += `\t\t\t"format": "date-time"`;
            break;
        case 'double precision':
            result += `\t\t\t"type": "number"`;
            break;
        case 'bytea':
            result += `\t\t\t"type": "string"`;
            break;
        default:
            console.error(`Unknown type ${columnType}" for the field ${columnName}`);
            return '';
    }
    if (maxLength) {
        result += `,\n\t\t\t"maxLength": ${+maxLength}`;
    }
    if (description) {
        result += `,\n\t\t\t"description": "${description}"`;
    }
    result += `\n\t\t}`;
    return result;
}
function createTableSchema(tableName, columns) {
    let properties = '';
    const required = [];
    let p;
    for (var c in columns) {
        p = `\t${createColumnSchema(c, columns[c].data_type, columns[c].character_maximum_length, columns[c].col_description)}`;
        if (p && properties) {
            properties += `,\n`;
        }
        properties += p;
        if (!columns[c].is_nullable) {
            required.push(c);
        }
    }
    return `{\n\t"title": "${tableName}.table",\n\t"type": "object",\n\t"properties": {\n${properties}\n\t},\n\t"required": ${JSON.stringify(required)},\n\t"additionalProperties": true\n}`;
}
const options = {
    pgNative: false,
    extend: obj => {
        obj.getTables = (schema) => (obj.any(sql_1.default.getTables, [schema])),
            obj.getColumns = (schema) => (obj.any(sql_1.default.getColumns, [schema])),
            obj.getConstraints = (schema) => (obj.any(sql_1.default.getConstraints, [schema]));
    }
};
function getSchema(connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        const pgp = pgPromise(options);
        const db = pgp(connectionString);
        const result = yield Promise.all([
            db.getTables('public'),
            db.getColumns('public'),
            db.getConstraints('public')
        ]);
        return { tables: result[0], columns: result[1], constraints: result[2] };
    });
}
function generateSchema(connectionString, outDir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const schema = yield getSchema(connectionString);
            const columnGroups = _groupBy(schema.columns, 'table_name');
            const tables = _transform(_keyBy(schema.tables, 'table_name'), (result, table, name) => {
                result[name] = Object.assign({}, table, { columns: _keyBy(columnGroups[name], 'column_name') });
            });
            const constraints = _transform(_groupBy(schema.constraints, 'table_name'), (result, table, tableName) => {
                result[tableName] = _groupBy(table, 'column_name');
            });
            let fileContent;
            let fileName;
            for (var t in tables) {
                fileContent = createTableSchema(t, tables[t].columns);
                fileName = `${outDir}/${t}.table.json`;
                outputFile(fileName, fileContent, function (err, createdDir) {
                    if (err) {
                        console.error(`Error generating ${fileName}`, err);
                    }
                    else {
                        console.log(`${fileName} generated!`);
                    }
                });
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.generateSchema = generateSchema;
