import {config} from "dotenv";
import app from "./src/app.js";
import { pool, testConnection } from "./src/db/db.js";
config({ path: "./.env" });


testConnection()
.then((conn)=>{
  app.listen(process.env.PORT , ()=>{
    console.log(`app is up and running on port ${process.env.PORT}`);
})
})
.catch((err)=>console.log(err));






