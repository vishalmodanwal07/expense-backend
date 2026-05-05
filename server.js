import {config} from "dotenv";
import app from "./src/app.js";
import { pool, testConnection } from "./src/db/db.js";
config({ path: "./.env" });


import http from "http";
import { Server } from "socket.io";

console.log("Starting server..." , process.env.DB_HOST);

const server = http.createServer(app);

const io = new Server(server ,  {
  cors: {
    origin: '*' ,
    methods: ["GET", "POST" , "UPDATE" , "DELETE"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (user_id) => {
    socket.join(`userId:${user_id}`);
   console.log(`✅ User joined room: userId:${user_id}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


testConnection()
.then((conn)=>{
  server.listen(process.env.PORT , ()=>{
    console.log(`app is up and running on port ${process.env.PORT}`);
})
})
.catch((err)=>console.log(err));


export {io};



