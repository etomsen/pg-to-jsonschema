import sql from './sql';
import * as _groupBy from 'lodash.groupby';
import * as _transform from 'lodash.transform';
import * as _keyBy from 'lodash.keyby';
import pg from 'pg';
import * as outputFile from 'output-file';
import * as minimist from 'minimist';
import * as pgPromise from 'pg-promise';
import { IMain, IDatabase } from 'pg-promise';

type TColumnType = 'integer' | 'time without time zone' | 'timestamp without time zone' | 'character varying' | 'uuid' | 'date' | 'double precision' | 'bigint' | 'bytea';

function createColumnSchema(columnName: string, columnType: TColumnType){
    let result: string = `\t"${columnName}": {\n`;
    switch (columnType) {
        case 'integer':
        case 'bigint':
            result += `\t\t\t"type": "number"\n\t\t}`;
            break;
        case 'character varying': 
            result += `\t\t\t"type": "string"\n\t\t}`;
            break;
        case 'timestamp without time zone':
            result += `\t\t\t"type": "number",\n`;
            result += `\t\t\t"format": "date-time"\n\t\t}`;
            break;
        case 'time without time zone':
            result += `\t\t\t"type": "string",\n`;
            result += `\t\t\t"pattern": "^0?([0-9][0-2]?):([0-5][0-9])$"\n\t\t}`;
            break;
        case 'uuid':
            result += `\t\t\t"type": "string",\n`;
            result += `\t\t\t"pattern": "^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$"\n\t\t}`;
            break;
        case 'date':
            result += `\t\t\t"type": "string",\n`;
            result += `\t\t\t"format": "date-time"\n\t\t}`;
            break;
        case 'double precision':
            result += `\t\t\t"type": "number"\n\t\t}`;
            break;
        case 'bytea':
            result += `\t\t\t"type": "string"\n\t\t}`;
            break;
        default:
            console.error(`Unknown type ${columnType}" for the field ${columnName}`);
            return '';
    }
    return result;
}

function createTableSchema(tableName: string, columns: any[]): string{
    let properties: string = '';
    const required: string[] = [];
    let p: string;
    for (var c in columns) {
        p = `\t${createColumnSchema(c, columns[c].data_type)}`;
        if (p && properties) {
            properties += `,\n`;
        }
        properties += p;
        if (!columns[c].is_nullable) {
            required.push(c);
        }
    }
    return `{\n\t"title": "${tableName}",\n\t"type": "object",\n\t"properties": {\n${properties}\n\t},\n\t"required": ${JSON.stringify(required)},\n\t"additionalProperties": true\n}`;
}

interface IExtensions {
    getTables(schema: string): Promise<any>;
    getColumns(schema: string): Promise<any>;
    getConstraints(schema: string): Promise<any>;
}

const options = {
    pgNative: false,
    extend: obj => {
        obj.getTables = (schema) => (obj.any(sql.getTables, [schema])),
        obj.getColumns = (schema) => (obj.any(sql.getColumns, [schema])),
        obj.getConstraints = (schema) => (obj.any(sql.getConstraints, [schema]))
    }
};

async function getSchema(connectionString: string) {
    const pgp: IMain = pgPromise(options);
    const db = <IDatabase<IExtensions>&IExtensions>pgp(connectionString);
    const result = await Promise.all([
        db.getTables('public'),
        db.getColumns('public'),
        db.getConstraints('public')
    ]);
    return {tables: result[0], columns: result[1], constraints: result[2]};
}

export async function generateSchema(connectionString: string, outDir: string){
    try {
        const schema = await getSchema(connectionString);
        const columnGroups = _groupBy(schema.columns, 'table_name');
        const tables = _transform(_keyBy(schema.tables, 'table_name'), (result, table, name) => {
            result[name] = {...table,
                columns: _keyBy(columnGroups[name], 'column_name')
            };
        });
        const constraints = _transform(_groupBy(schema.constraints, 'table_name'), (result, table, tableName) => {
          result[tableName] = _groupBy(table, 'column_name');
        });
        let fileContent;
        let fileName;
        for (var t in tables) {
            fileContent = createTableSchema(t, tables[t].columns);
            fileName = `${outDir}/${t}.table.json`;
            outputFile(__dirname + fileName, fileContent, function(err, createdDir) {
            if (err) {
                console.error(`Error generating ${__dirname + fileName}`, err);
            } else {
                console.log(`${__dirname + fileName} generated!`);
            }
        });
        }
    } catch (error) {
        console.error(error);
    }
}
// const args = minimist(process.argv.slice(2));
// if (!args.c) {
//     console.log('Connection string is not specified');
//     process.exit();
// }
// if (!args.o) {
//     console.log('Out dir is not specified');
//     process.exit();
// }
// generateSchema(args.c, args.c)
//     .then(() => {
//         console.log('done.');
//         process.exit();
//     })
//     .catch((err) => {
//         console.error(err);
//         process.exit();
//     });