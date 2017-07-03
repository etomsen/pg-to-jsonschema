import * as fs from 'fs'

export default {
    getTables: fs.readFileSync(__dirname + '/sql/tables.sql').toString(),
    getColumns: fs.readFileSync(__dirname + '/sql/columns.sql').toString()
}