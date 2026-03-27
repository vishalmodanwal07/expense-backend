import {config} from "dotenv";
import app from "./src/app.js";
import dbConnect from "./src/db/db.js";

config({ path: "./.env" });

dbConnect();

app.listen(process.env.PORT , ()=>{
    console.log(`app is up and running on port ${process.env.PORT}`);
})




