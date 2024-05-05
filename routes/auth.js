const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();
const path = require("path");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var crypto = require("crypto");

/**
 * MySQLにアクセス
 */
const db_options = {
  host: "localhost",
  user: "root",
  password: process.env.SQLPass,
  database: "looseleaf",
}
const pool = mysql.createPool(db_options);

/**
 * passportによるログイン判定
 */
passport.use(
  new LocalStrategy(async function verify(id, password, cb) {

    sql = "SELECT * FROM users WHERE id = ?";

    try{
      const [results, fields] = await pool.query(sql, [id]);
      if (results.length === 0) {
        // console.log("no result");
        return cb(null, false, { message: "Incorrect userID or password." });
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
              message: "Incorrect userID or password.",
            });
          }
          return cb(null, user);
        },
      );
    } catch (err){
      console.log("error : passport.use()");
      throw err;
    }
  }),
);

/**
 * シリアライズ（クッキーにどの情報を残すか）
 * serialize: 認証成功時、クッキーに情報を残す
 * deserialize: リクエスト時、ミドルウェアとして（？）req.userに情報を追加する
 */
passport.serializeUser(function (user, cb) {
  process.nextTick(() => {
    cb(null, {
      id: user.id,
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
router.get("/login", (req,res) => {
  res.render("login");
});
router.get("/session", (req,res) => {
  if(req.user !== undefined){
    res.json({id: req.user.id});
  }
  else {
    res.json({});
  }
});
router.post("/login", (req, res, next) => {
    // console.log("req.body is below");
    // console.log(req);
		req.body.username = req.body.id;
		next();
	},
  passport.authenticate("local"),
  (req,res) => {
    res.redirect("/");
  }
);
router.post("/logout", (req,res,next) => {
  req.logout( (err) => {
    if(err) return next(err);
    res.redirect("/");
  });
});
router.post("/signup",
  async (req,res,next) => {
    // IDの衝突が発生するか確認
    try{
      const [results, fields] = await pool.query("SELECT * FROM users WHERE id LIKE ?", req.body.id);
      if(results.length >= 1){
        res.status(400).send({error:'This id is already used by another user'});
        return ;
      } 
      else {
        next();
      }
    } catch(err) {
      return next(err);
    }
  }, 
  (req, res, next) => {
    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async (err, hashedPassword) => {
        if (err) {
          return next(err);
        }
        const sql = "INSERT INTO users (id, hashedPassword, salt) VALUES (?, ?, ?)";
        const data = [req.body.id, hashedPassword, salt];

        try{
          await pool.query(sql,data);
        } catch(err){
          return next(err);
        }
        var user = {
          id: req.body.id,
        };
        req.login(user, (err) => {
          if (err) {
            return next(err);
          }
          res.status(200).send("Sign up sucsessed");
        });
      },
    );
  }
);

module.exports = router;

