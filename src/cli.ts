import { run } from "./app/cmd";
import { HelloWorld } from "./app/cmd/example";
import { DatabaseSeeder } from "./db/seeder";

run([
    new HelloWorld(),
    new DatabaseSeeder()
])
