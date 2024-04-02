const express = require("express");
const mysql = require("mysql2");
const router = express.Router();
const path = require("path");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var crypto = require("crypto");

/**
 * MySQLにアクセス
 */
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.SQLPass,
  database: "looseleaf",
});
connection.connect((err) => {
  if (err) {
    throw new Error(err.stack);
  }
  console.log("MySQL connection(auth) succeed ");
});

/**
 * passportによるログイン判定
 */
passport.use(
  new LocalStrategy(function verify(username, password, cb) {


    sql = "SELECT * FROM users WHERE name = ?";
    connection.query(sql, [username], (error, results) => {
      if (error) {
        console.log("error : passport.use()");
        throw error;
      }

      if (results.length === 0) {
				console.log("no result");
        return cb(null, false, { message: "Incorrect username or password." });
      }

			const user = results[0];
			
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        (err, hashedPassword) => {
          if (err) {
            return cb(err);
          }
          if (!crypto.timingSafeEqual(user.hashedPassword, hashedPassword)) {
            return cb(null, false, {
              message: "Incorrect username or password.",
            });
          }
          return cb(null, user);
        },
      );
    });
  }),
);

/**
 * シリアライズ（クッキーにどの情報を残すか）
 * serialize: 認証成功時、クッキーに情報を残す
 * deserialize: リクエスト時、ミドルウェアとしてreq.userに情報を追加する
 */
passport.serializeUser(function (user, cb) {
  process.nextTick(() => {
    cb(null, {
      name: user.name,
      // introduction: user.introduction,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(() => {
    return cb(null, user);
  });
});

/**
 * ルーティング
 */
router.get("/", (res, req) => {
  req.render("login");
});
router.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
);

module.exports = {
	router: router,
	usersConnection: connection
};

