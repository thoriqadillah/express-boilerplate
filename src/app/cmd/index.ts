import { Command } from "commander";

export interface Commander {
    run(cmd: Command): Command
}

export function run(commands: Commander[]) {
    const program = new Command()

    for (const command of commands) {
        const cmd = command.run(new Command())
        program.addCommand(cmd)
    }

    program.parse(process.argv)
}