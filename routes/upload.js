const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
const router = express.Router();

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
  console.log("MySQL connection succeed");
});

function deleteNoneExistFileData(files) {
  existFiles = new Array();

  if(files === null || files === undefined) return existFiles;

  for (const file of files) {
    filePath = path.join(__dirname, "..", "storage", file.id);
    if (!fs.existsSync(filePath)) {
      const sql = "DELETE FROM notes WHERE id = ?";
      connection.query(sql, file.id, (error, results) => {
        if (error) throw error;
      });
    } else {
      existFiles.push(file);
    }
  }

  return existFiles;
}

/**
 * multerの設定
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./storage");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e8);
    cb(null, uniqueSuffix + ".pdf");
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are accepted!!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter,
});

/**
 * ルーティング
 */
router.get("/", function (req, res, next) {
  connection.query("SELECT * FROM notes", (error, results) => {
    const files = deleteNoneExistFileData(results);
    // res.json({files: files});

    const name = (req.user === undefined) ? {id:'ログインしていません'} : req.user;
    res.render("upload", { files: files , user: name});
  });
});
module.exports = router;
