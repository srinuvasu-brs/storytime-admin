import express from "express";
import ejs from "ejs";
import dotenv from "dotenv";
import path from 'node:path';
import { dirname } from 'path';
import connectDB from "./src/config/db.js";
import { errorHandler, notFound } from "./src/middleware/errMiddleware.js";
import session from 'express-session';
import passport from 'passport';
import fetch from 'node-fetch';

// Routes
import languageRoute from "./src/routes/languageRoute.js";
import categoryRoute from "./src/routes/categoryRoute.js";
import userRoute from "./src/routes/userRoute.js";
import adminRoute from "./src/routes/adminRoute.js";
import { generateSpotifyRefreshToken } from "./src/controllers/adminController.js";
dotenv.config();
connectDB();

const PORT = 5000;
const app = express();
app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static(process.cwd() + '/public'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    key: '_st_session',
    secret: '_st_session_secret',
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));
app.use(async function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.session = req.session;
  res.locals.user = req.session?.passport?.user;
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});

app.get("/", (req, res) => {
  res.redirect("/admin");
});

app.use("/api/languages", languageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/users", userRoute);
app.use("/admin", adminRoute);
const getToken = async() => {
  // app.locals.spotifyToken = 'BQCaNQqHbgDBW00BZd-IO_pUAwQMoG73HVMBQokEt86sPUmZLa0_CaqRN4cbl2BG6uj3AUzx8wo8rdKBVYOZYYI0o-KGHBnWUY3OzEVQoxOeztumB_g'
  let tokenData = await fetch("http://localhost:5000/admin/refreshtoken")
  let token = await tokenData.json();
  if (token.success) {
    app.locals.spotifyToken = token.token.access_token
    updateCount();
  } else{
    setTimeout(() => {getToken()}, 5000)
  }
}

const updateCount = async() => {
  let countData = await fetch("http://localhost:5000/admin/count")
  let count = await countData.json();
  if (count.success) {
    console.log(count.data)
  } else {
    setTimeout(() => {updateCount()}, 5000)
  }
}

getToken();

setInterval(() => {
  getToken();
}, 3500000);

setInterval(() => {
  updateCount();
}, 604800000);

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, console.log(`Server started on port ${PORT}`));
