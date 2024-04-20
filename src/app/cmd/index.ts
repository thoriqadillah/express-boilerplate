import { Command } from "commander";


export type Commander = (cmd: Command) => Command

export function run(commands: Commander[]) {
    const program = new Command()

    for (const command of commands) {
        const cmd = command(new Command())
        program.addCommand(cmd)
    }

    program.parse(process.argv)
}