import { run } from "./app/cmd";
import Hello from "./app/cmd/example";
import Seeder from "./db/seeder";

run([Hello, Seeder])
