import { Example } from "./schemas/example.schema";
import { Template } from "./schemas/template.schema";

export interface Store {
    foo(): Promise<Example>
}

export class ExampleStore implements Store {

    // WARNING: this is only example (not tested)
    async foo(): Promise<Example> {
        const foo = await Example.aggregate([
            ...Example.template()
        ])

        return foo[0]
    }
}