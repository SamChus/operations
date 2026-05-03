import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";


const app = express()

app.use(cors())
app.use(express.static(__dirname))


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../app/index.html")); 
})


