const express = require("express");
const router = express.Router();
const mysql = require("mysql2");


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


/* GET home page. */
router.get("/", function (req, res, next) {
  connection.query('SELECT * FROM users', (err, results) => {
    if(err) {
      next(err);
    }
    res.render("index", {users: results});
  });
});

module.exports = router;
