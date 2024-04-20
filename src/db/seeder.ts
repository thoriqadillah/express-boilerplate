import { Commander } from "@/app/cmd"
import { Command } from "commander"
import dotenv from "dotenv"

export interface Seeder {
    up(): void
    down(): void
}

export default function seed(cmd: Command): Command {
    const seeders: Seeder[] = [

    ]

    return cmd.command('seed')
        .description('Run database seeder')
        .option('--env <path>', 'env path', './.env')
        .option('--refresh', 'refresh the seeder')
        .action((option) => {
            dotenv.config({ path: option.env })

            for (const seeder of seeders) {
                if (option.refresh) seeder.down()
                seeder.up()
            }
        })

}