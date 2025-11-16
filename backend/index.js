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
const orderRouter = require('./routes/orderRoutes.js');
const http = require("http");
const { Server } = require('socket.io');
const { socketHandler } = require('./socket.js');


// app config
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["POST", "GET"]
    }
})

app.set("io", io)

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
app.use("/api/order", orderRouter);

socketHandler(io)

// -------------- SERVE FRONTEND IN PRODUCTION -----------

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(port, () => {
    console.log(`server started at port ${port}!!`);
});