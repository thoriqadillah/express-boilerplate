import { Commander } from "@/app/cmd"
import { Command } from "commander"
import dotenv from "dotenv"

export interface Seeder {
    up(): void
    down(): void
}

export class DatabaseSeeder implements Commander {

    private seeders: Seeder[] = [

    ]

    run(cmd: Command): Command {
        return cmd.command('seed')
            .description('Run database seeder')
            .option('--env <path>', 'env path', './.env')
            .option('--refresh', 'refresh the seeder')
            .action((option) => {
                dotenv.config({ path: option.env })

                for (const seeder of this.seeders) {
                    if (option.refresh) seeder.down()
                    seeder.up()
                }
            })
    }
}