import express from "express"
import cors from "cors"
import connectDb from "./db/connect.js"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"

 dotenv.config()


const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)

app.listen(process.env.PORT, () => {
    connectDb()
    console.log("server is running on http://localhost:" + process.env.PORT);
})