const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");

const { MONGO_USER, MONGO_PASSWORD, MONGO_IP, MONGO_PORT, REDIS_URL, REDIS_PORT, SESSION_SECRET } = require("./config/config");

const RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient({
    socket: {
        port: REDIS_PORT,
        host: REDIS_URL
    },
    legacyMode: true,
});

redisClient.connect().catch((err) => console.log(`WHY is it happened: ${err}`));

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const { enable } = require("express/lib/application");

const app = express();

const mongoUrl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

const connectWithRetry = () => {
    mongoose.connect(mongoUrl, { 
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("successfully connected to DB"))
    .catch((e) => {
        console.log(e);
        setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

app.enable("trust proxy");
app.use(cors({}));
app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: SESSION_SECRET,
    cookie: {
        secure: false,
        httpOnly: true,
        resave: false,
        saveUninitialized: false,
        maxAge: 60000
    }
}))

app.use(express.json());

app.get("/api/v1", (req, res) => {
    console.log("Yeah it ran");
    res.send("<h2>Hi there!!!</h2>");
})

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})