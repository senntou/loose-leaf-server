const express = require("express");
const router = express.Router();
const crypto = require('crypto');

const connection = require("../routes/auth").usersConnection;

router.post("/", function (req, res, next) {
    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      (err, hashedPassword) => {
        if (err) {
          return next(err);
        }
        const sql =
          "INSERT INTO users (id, hashedPassword, salt) VALUES (?, ?, ?)";
        const data = [req.body.id, hashedPassword, salt];
        connection.query(sql, data, (err) => {
          if (err) {
            return next(err);
          }
          var user = {
            id: req.body.userid,
          };
          req.login(user, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect("/");
          });
        });
      },
    );
  });
  module.exports = router;
