import {config} from "dotenv";
import app from "./src/app.js";
import { pool } from "./src/db/db.js";
config({ path: "./.env" });



app.listen(process.env.PORT , ()=>{
    console.log(`app is up and running on port ${process.env.PORT}`);
})






