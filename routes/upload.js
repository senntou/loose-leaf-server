const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const connection = require('./api').notesConnection;

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
router.post("/", upload.single("file"), (req, res) => {
  res.status(200).send({ message: "File uploaded successfully." });

  const query = "INSERT INTO notes( ?? , ?? , ??) VALUES( ? , ? , ?)";
  const data = ["id","title", "comment", req.file.filename, req.body.title, req.body.comment];

  connection.query(query, data, (error, results) => {
    if (error) throw error;
  });
});

module.exports = router;
