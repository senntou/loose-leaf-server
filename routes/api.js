const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
const router = express.Router();

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
  console.log("MySQL connection succeed");
});
function deleteNoneexistFileData(files) {
  existFiles = new Array();

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
router.get("/", (req, res, next) => {

  if(req.query.fileName === undefined && req.query.fileId === undefined){ 
    connection.query("SELECT * FROM notes", (error, results) => {
      const files = deleteNoneexistFileData(results);
      res.json({files: files});
    });
  } 
  else if(req.query.fileName !== undefined){
    const fileName = '%' + req.query.fileName + '%'; 
    const sql = "SELECT * FROM ?? WHERE ?? LIKE ?";
    const data = ['notes', 'title', fileName];
    connection.query(sql, data, (error, results) => {
      const files = deleteNoneexistFileData(results);
      res.json({files: files});
    });
  }
  else if(req.query.fileId !== undefined){
    const fileId = req.query.fileId; 
    const sql = "SELECT * FROM ?? WHERE ?? LIKE ?";
    const data = ['notes', 'id', fileId];
    connection.query(sql, data, (error, results) => {
      const files = deleteNoneexistFileData(results);
      res.json({files: files});
    });
  }
});
router.post("/",
  (req,res,next)=>{
    if(req.user === undefined){
      res.status(400).send({error:"You must login to post file."});
      return ;
    }
    next();
  } ,
  upload.single("file"),
  (req, res, next) => {
    if(!req.body.title || req.body.title === ""){
      res.status(400).send({error:'"Title" must not be empty.'});
      return ;
    }
    res.status(200).send({ message: "File uploaded successfully." });

    console.log(req.user);
    const query = "INSERT INTO notes( ?? , ?? , ?? , ??) VALUES( ? , ? , ? , ?)";
    const data = ["id","title", "comment", "author", req.file.filename, req.body.title, req.body.comment, req.user.id];

    connection.query(query, data, (error, results) => {
      if (error) throw error;
    });
  }
);

module.exports = router;
