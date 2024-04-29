const express = require('express');
const mongoose = require('mongoose');
const authroutes = require("./routes/authroutes");
const cors = require("cors");
const bodyParser = require('body-parser');

const app = express();
require('dotenv').config();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(bodyParser.json());
mongoose.set('strictQuery', false);
mongoose.connect(process.env.dburl)
    .then(result => {
        console.log("connected");
    }).catch(err => {
        console.log(err);
    });

// In-memory session store
const sessions = {};

// Middleware to track user activity
const trackActivity = (req, res, next) => {
    const sessionId = req.headers.authorization;
    if (sessions[sessionId]) {
        sessions[sessionId].lastActive = Date.now();
    }
    next();
};

// Middleware to check session expiry
const checkSessionExpiry = (req, res, next) => {
    const sessionId = req.headers.authorization;
    if (sessions[sessionId] && Date.now() - sessions[sessionId].lastActive > 120000) {
        delete sessions[sessionId];
        return res.status(401).json({ message: "Session expired due to inactivity" });
    }
    next();
};

app.use(trackActivity);
app.use(checkSessionExpiry);

app.use(authroutes);

app.use('/', (req, res) => {
    res.json({ msg: "success" });
});

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

app.listen(3000, () => {
    console.log("server is running on port 3000");
});
