import { Command } from "commander";

// docs: https://www.npmjs.com/package/commander
export default function run(cmd: Command): Command {
    return cmd.command('hello')
        .description('A command just to say hello')
        .argument('[message]', 'message to display', 'World')
        .action((message) => {
            console.log(`Hello ${message}`);
        })
}