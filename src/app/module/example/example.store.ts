import { Example, ExampleModel } from "./schemas/example.schema";

export interface Store {
    foo(): Promise<Example>
}

export class ExampleStore implements Store {

    // WARNING: this is only example (not tested)
    async foo(): Promise<Example> {
        const foo = await ExampleModel.aggregate([
            ...ExampleModel.template()
        ])

        return foo[0]
    }
}