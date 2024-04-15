const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport = require("passport");
const session = require("express-session");
const cors = require('cors');
const MySQLStore = require("express-mysql-session")(session);

const indexRouter = require("./routes/index");
const uploadRouter = require("./routes/upload");
const pdfRouter = require("./routes/pdf");
const authRouter = require("./routes/auth").router;
const apiRouter = require("./routes/api");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
  credentials:true,
  origin:["http://localhost:4000", "http://localhost:3000"]
}));

/**
 * session
 */
const mysqlOptions = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: process.env.SQLPass,
  database: "looseleaf",
};
app.use(
  session({
    secret: "TODO setting secret",
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(mysqlOptions),
  }),
);
app.use(passport.session());

app.use("/", indexRouter);
app.use("/upload", uploadRouter);
app.use("/pdf", pdfRouter);
app.use("/auth", authRouter);
app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
