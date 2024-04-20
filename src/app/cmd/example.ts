import { Command } from "commander";
import { Commander } from ".";

export class HelloWorld implements Commander {
    
    // docs: https://www.npmjs.com/package/commander
    run(cmd: Command): Command {
        return cmd.command('hello')
            .description('A command just to say hello')
            .argument('[message]', 'message to display', 'World')
            .action((message) => {
                console.log(`Hello ${message}`);
            })
    }
}