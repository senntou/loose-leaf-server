const express = require("express");
const router = express.Router();

/**
 * for debug 
 */
const connection = require('./auth').usersConnection;

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
