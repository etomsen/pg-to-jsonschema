import sql from './sql';
import * as _groupBy from 'lodash.groupby';
import * as _transform from 'lodash.transform';
import * as _keyBy from 'lodash.keyby';
import pg from 'pg';
import * as pgPromise from 'pg-promise';
import { IMain, IDatabase } from 'pg-promise';


const cn: string = 'postgres://scoaswzwcohwua:I5YZyVOecjNoHJx-l48p1kvatI@ec2-54-195-240-107.eu-west-1.compute.amazonaws.com:5432/dao1078sdr29iq?&ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory';

interface IExtensions {
    getTables(schema: string): Promise<any>;
    getColumns(schema: string): Promise<any>;
}

const options = {
    pgNative: false,
    extend: obj => {
        obj.getTables = (schema) => {
            return obj.any(sql.getTables, [schema])
        },
        obj.getColumns = (schema) => {
            return obj.any(sql.getColumns, [schema]);
        }
    }
};

const pgp: IMain = pgPromise(options);
const db = <IDatabase<IExtensions>&IExtensions>pgp(cn);

async function getSchema() {
    const result = await Promise.all([
        db.getTables('public'),
        db.getColumns('public')
    ]);
    return {tables: result[0], columns: result[1]};
}

async function main() {
    try {
        const schema = await getSchema();
        console.log(JSON.stringify(schema));
        // const columnGroups = _groupBy(schema.columns.rows, 'table_name');
        // console.log(columnGroups);
        // const tables = _transform(_keyBy(schema.tables.rows, 'table_name'), (result, table, name) => {
        //     result[name] = {...table,
        //         columns: _keyBy(columnGroups[name], 'column_name')
        //     };
        // });
        // const result = {
        //     counts: {
        //         tables: schema.tables.rowCount,
        //         columns: schema.columns.rowCount
        //     },
        //     tables: tables
        // }
        // console.log(result);
    } catch (error) {
        console.error(error);
    }
}

main();