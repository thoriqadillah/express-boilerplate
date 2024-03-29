import { execFile } from 'child_process';
import path from 'path';
import { Pool } from 'pg'
import { env } from '@/lib/env';
import { promises as fs } from 'fs'
import SQLite from 'better-sqlite3'
import { 
    Kysely, 
    Dialect, 
    Migrator as KyselyMigrator, 
    SqliteDialect,
    PostgresDialect, 
    FileMigrationProvider,
    MigrationResultSet,
    ParseJSONResultsPlugin, 
} from 'kysely'
import { DB } from 'kysely-codegen'
import { Log } from '@/lib/logger';

export interface Connection {
    open(): void
    close(): void
}

export interface Migrator {
    migrate(): void
    rollback(): void
}

export class Database implements Connection, Migrator {

    private static db: Kysely<DB>
    private config = {
        database: env.get('DB_NAME').toString('postgres'),
        host: env.get('DB_HOST').toString('localhost'),
        user: env.get('DB_USERNAME').toString('postgres'),
        password: env.get('DB_PASSWORD').toString(''),
        port: env.get('DB_PORT').toNumber(5432),
        migrationFolder: path.join(__dirname, 'migrations')
    }

    private dialects: Record<string, () => Dialect> = {
        'pgsql': () => new PostgresDialect({
            pool: new Pool({ max: 10, ...this.config })
        }),
        'sqlite': () => new SqliteDialect({
            database: new SQLite(path.join(__dirname, 'database.sqlite'))
        }),
    }

    static instance(): Kysely<DB> {
        return Database.db
    }

    private getDialect(driver: string): Dialect {
        const dialect = this.dialects[driver]
        if (!dialect) {
            throw new Error(`database driver ${driver} not found`)
        }

        return dialect()
    }

    open(): void {
        if (Database.db) return

        const driver = env.get('DB_DRIVER').toString('pgsql')

        Database.db = new Kysely<DB>({ 
            dialect: this.getDialect(driver),
            plugins: [new ParseJSONResultsPlugin()]
        })
    }

    async close(): Promise<void> {
        Log.info('Database connection destroyed...')
        if (Database.db) await Database.db.destroy()
    }

    private getMigrator() {
        return new KyselyMigrator({
            db: Database.db,
            provider: new FileMigrationProvider({
                fs,
                path,
                migrationFolder: this.config.migrationFolder
            })
        })
    }
    
    private async executeMigration(message: 'Rollback' | 'Migrate', callback: (migrator: KyselyMigrator) => Promise<MigrationResultSet>) {
        this.open()
        const migrator = this.getMigrator()

        const { error, results } = await callback(migrator)
        results?.forEach((it) => {
            if (it.status === 'Success') Log.info(`${message} "${it.migrationName}" was executed successfully`)
            if (it.status === 'Error') Log.error(`Failed to execute ${message.toLowerCase()} "${it.migrationName}"`)
        })
        
        if (error) {
            Log.error(`Failed to ${message.toLowerCase()}:`, error)
            process.exit(1)
        }

        const environment = env.get('NODE_ENV').toString('dev')
        if (environment !== 'test') {
            process.exit()
        }

        this.close()
    }

    async migrate(): Promise<void> {
        this.executeMigration('Migrate', async migrator => await migrator.migrateToLatest())
    }

    async rollback(): Promise<void> {
        this.executeMigration('Rollback', async migrator => await migrator.migrateDown())
    }
}
