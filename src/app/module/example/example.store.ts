import { Example } from "./schemas/example.schema";

export interface Store {
    foo(): Promise<any>
}

export class ExampleStore implements Store {

    // WARNING: this is only example (not tested)
    async foo(): Promise<any> {
        const foo = await Example.aggregate([
            ...Example.template()
        ])

        return foo[0]
    }
}