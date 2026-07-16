require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

// Models
const User = require("./models/userModel.js");

// Routes
const authRouter = require("./routes/authRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const shopRouter = require("./routes/shopRoutes.js");
const itemRouter = require("./routes/itemRoutes.js");
const orderRouter = require("./routes/orderRoutes.js");

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 4000;
const MONGO_URL = process.env.MONGO_URL;

/*
|--------------------------------------------------------------------------
| Allowed frontend URLs
|--------------------------------------------------------------------------
|
| FRONTEND_URL=http://localhost:5173
| FRONTEND_URLS=https://your-frontend.onrender.com
|
| FRONTEND_URLS can also contain multiple comma-separated URLs.
|
*/

const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || "")
    .split(",")
    .map((url) => url.trim()),
].filter(Boolean);

console.log("Allowed frontend origins:", allowedOrigins);

/*
|--------------------------------------------------------------------------
| Express middleware
|--------------------------------------------------------------------------
*/

// Required on Render and other reverse-proxy hosting services
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from Postman, mobile apps and server-to-server calls
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked by CORS:", origin);

      return callback(
        new Error(`Origin ${origin} is not allowed by CORS`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Socket.IO
|--------------------------------------------------------------------------
*/

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,

    methods: [
      "GET",
      "POST",
    ],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  /*
  --------------------------------------------------------------------------
  Save socket ID for the logged-in user
  --------------------------------------------------------------------------
  */

  socket.on("identity", async (data = {}) => {
    try {
      const { userId } = data;

      if (!userId) {
        return;
      }

      socket.data.userId = String(userId);

      await User.findByIdAndUpdate(
        userId,
        {
          socketId: socket.id,
        },
        {
          new: true,
        }
      );

      console.log(
        `Socket ${socket.id} connected to user ${userId}`
      );
    } catch (error) {
      console.error("Socket identity error:", error);
    }
  });

  /*
  --------------------------------------------------------------------------
  Update delivery-boy location
  --------------------------------------------------------------------------
  */

  socket.on("updateLocation", async (data = {}) => {
    try {
      const {
        userId,
        latitude,
        longitude,
      } = data;

      if (
        !userId ||
        latitude === undefined ||
        longitude === undefined
      ) {
        return;
      }

      const numericLatitude = Number(latitude);
      const numericLongitude = Number(longitude);

      if (
        Number.isNaN(numericLatitude) ||
        Number.isNaN(numericLongitude)
      ) {
        console.error(
          "Invalid delivery-boy coordinates:",
          data
        );

        return;
      }

      await User.findByIdAndUpdate(
        userId,
        {
          location: {
            type: "Point",

            // GeoJSON order must be longitude, latitude
            coordinates: [
              numericLongitude,
              numericLatitude,
            ],
          },

          socketId: socket.id,
        },
        {
          new: true,
        }
      );
    } catch (error) {
      console.error(
        "Socket location update error:",
        error
      );
    }
  });

  /*
  --------------------------------------------------------------------------
  Disconnect
  --------------------------------------------------------------------------
  */

  socket.on("disconnect", async (reason) => {
    console.log(
      `Socket disconnected: ${socket.id}. Reason: ${reason}`
    );

    try {
      const userId = socket.data.userId;

      if (!userId) {
        return;
      }

      /*
       Only clear the socket ID when the stored ID belongs to this
       disconnected socket. This prevents clearing a newer connection.
      */
      await User.findOneAndUpdate(
        {
          _id: userId,
          socketId: socket.id,
        },
        {
          $unset: {
            socketId: 1,
          },
        }
      );
    } catch (error) {
      console.error(
        "Socket disconnect cleanup error:",
        error
      );
    }
  });
});

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

/*
|--------------------------------------------------------------------------
| Health-check routes
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "BiteNow backend is running",
  });
});

app.get("/api/health", (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  return res.status(
    databaseConnected ? 200 : 503
  ).json({
    success: databaseConnected,
    server: "running",
    database: databaseConnected
      ? "connected"
      : "disconnected",
  });
});

/*
|--------------------------------------------------------------------------
| Unknown API routes
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Global error handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("Unhandled Express error:", error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.message?.includes("not allowed by CORS")) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(
    error.status || error.statusCode || 500
  ).json({
    success: false,
    message:
      error.message || "Internal server error",
  });
});

/*
|--------------------------------------------------------------------------
| Connect MongoDB before starting the server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    if (!MONGO_URL) {
      throw new Error(
        "MONGO_URL is missing from the backend .env file"
      );
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("MongoDB connected successfully");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Server started successfully at port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Backend startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

/*
|--------------------------------------------------------------------------
| Process error handling
|--------------------------------------------------------------------------
*/

process.on("unhandledRejection", (error) => {
  console.error(
    "Unhandled promise rejection:",
    error
  );
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

const shutdownServer = async (signal) => {
  console.log(`${signal} received. Closing server...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();

      console.log("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      console.error(
        "Shutdown error:",
        error
      );

      process.exit(1);
    }
  });
};

process.on("SIGINT", () => {
  shutdownServer("SIGINT");
});

process.on("SIGTERM", () => {
  shutdownServer("SIGTERM");
});