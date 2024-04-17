import { Pool } from 'pg'
import { env } from '@/lib/env';
import { 
    Kysely, 
    Dialect, 
    PostgresDialect, 
    ParseJSONResultsPlugin, 
} from 'kysely'
import { DB } from 'kysely-codegen'
import { Log } from '@/lib/logger';
import { Connection, ConnectionOption } from '.';

export class KyselyDatabase implements Connection {

    private static db: Record<string, Kysely<DB>> = {}
    private option: ConnectionOption
    private dialects: Record<string, () => Dialect>

    constructor(private key: string = 'default', option?: ConnectionOption) {
        this.option = {
            driver: env.get('DB_DRIVER').toString('pgsql'),
            database: env.get('DB_NAME').toString('postgres'),
            host: env.get('DB_HOST').toString('localhost'),
            user: env.get('DB_USERNAME').toString('postgres'),
            password: env.get('DB_PASSWORD').toString(''),
            port: env.get('DB_PORT').toNumber(5432),
            ...option
        }

        this.dialects = {
            'pgsql': () => new PostgresDialect({
                pool: new Pool({ max: 10, ...this.option })
            }),
        }
    }

    static instance(key: string = 'default'): Kysely<DB> {
        return KyselyDatabase.db[key]
    }

    private getDialect(driver: string): Dialect {
        const dialect = this.dialects[driver]
        if (!dialect) {
            throw new Error(`database driver ${driver} not found`)
        }

        return dialect()
    }

    open(): void {
        if (KyselyDatabase.db[this.key]) return

        KyselyDatabase.db[this.key] = new Kysely<DB>({ 
            dialect: this.getDialect(this.option.driver!),
            plugins: [new ParseJSONResultsPlugin()]
        })

        Log.info(`Kysely database ${this.key} opened...`)
    }

    async close(): Promise<void> {
        Log.info(`Kysely database ${this.key} connection destroyed...`)
        if (KyselyDatabase.db[this.key]) await KyselyDatabase.db[this.key].destroy()
    }
}
