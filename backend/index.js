const express = require('express');
const { connectdb } = require('./config/mongodb.js')
const dotenv = require('dotenv');
dotenv.config()
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/authRoutes.js');
const cors = require('cors');
const userRouter = require('./routes/userRoutes.js');
const shopRouter = require('./routes/shopRoutes.js');
const itemRouter = require('./routes/itemRoutes.js');



// app config
const app = express()
const port = process.env.PORT;
connectdb();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

// API end points
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);




app.listen(port, () => {
    console.log(`server started at port ${port}!!`);
});