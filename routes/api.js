const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const router = express.Router();

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
 * file実体が存在しないDBの要素を削除する
 */
async function deleteNoneexistFileData(files) {


  existFiles = new Array();

  try{
    const connection = await pool.getConnection();


    for (const file of files) {
      filePath = path.join(__dirname, "..", "storage", file.id);
      if (!fs.existsSync(filePath)) {
        const sql = "DELETE FROM notes WHERE id = ?";
        connection.query(sql, file.id);
      } else {
        existFiles.push(file);
      }
    }

    pool.releaseConnection(connection);
  }
  catch(err){
    console.log("error: getting connection error");
    throw err;
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
router.get("/", async (req, res, next) => {
  /**
   * ファイルネーム部分一致検索
   */
  if(req.query.fileName !== undefined){
    const fileName = '%' + req.query.fileName + '%'; 
    const sql = "SELECT * FROM ?? WHERE ?? LIKE ?";
    const data = ['notes', 'title', fileName];
    try{
      const [results, fields] = await pool.query(sql, data);
      const files = await deleteNoneexistFileData(results);
      res.json({files: files});
    }
    catch(err){
      throw err;
    }
  }
  /**
   * ファイルID完全一致検索
   */
  else if(req.query.fileId !== undefined){
    const fileId = req.query.fileId; 
    const sql = "SELECT * FROM ?? WHERE ?? = ?";
    const data = ['notes', 'id', fileId];
    try{
      const [results, fields] = await pool.query(sql, data);
      const files = await deleteNoneexistFileData(results);
      res.json({files: files});
    }
    catch(err){
      throw err;
    }
  }
  /**
   * author完全一致検索
   */
  else if(req.query.author !== undefined){
    const author = req.query.author; 
    const sql = "SELECT * FROM ?? WHERE ?? = ?";
    const data = ['notes', 'author', author];
    try{
      const [results, fields] = await pool.query(sql, data);
      const files = await deleteNoneexistFileData(results);
      res.json({files: files});
    }
    catch(err){
      throw err;
    }
  }
  /**
   * デフォルト （すべて表示）
   */
  else { 
    const sql = "SELECT * FROM notes";
    try{
      const [results, fields] = await pool.query(sql);
      const files = await deleteNoneexistFileData(results);
      res.json({files: files});
    }
    catch(err){
      throw err;
    }
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

  async (req, res, next) => {
    if(!req.body.title || req.body.title === ""){
      res.status(400).send({error:'"Title" must not be empty.'});
      return ;
    }
    res.status(200).send({ message: "File uploaded successfully." });

    console.log(req.user);
    const query = "INSERT INTO notes( ?? , ?? , ?? , ??) VALUES( ? , ? , ? , ?)";
    const data = ["id","title", "comment", "author", req.file.filename, req.body.title, req.body.comment, req.user.id];

    try{
      await pool.query(query, data);
    }
    catch(err){
      throw err;
    }
  }
);
router.post("/edit", async (req,res,next) => {
  if(req.user === undefined){
    res.status(400).send({error:"You must login to post file."});
    return ;
  }
  if(!req.body.fileId || !req.body.title){
    res.status(400).send({error:"fileId or title is empty"});
    return ;
  }

  const fileId = req.body.fileId;
  const title = req.body.title;
  const comment = req.body.comment;
  const query = "UPDATE notes SET title = ? , comment = ? where id = ? AND author = ?";
  const data = [title, comment, fileId, req.user.id];

  try{
    await pool.query(query,data);
    res.status(200).send({ message: "File updated successfully." });
  }
  catch(err){
    res.status(400).send({error: "ファイル編集に失敗"});
    return ;
  }
});
router.delete("/", async (req,res,next) => {
  if(req.user === undefined){
    res.status(400).send({error:"You must login to post file."});
    return ;
  }
  if(req.query.fileId === undefined){
    res.status(400).send({error:"fileId is empty"});
    return ;
  }

  const query = "DELETE FROM notes WHERE id = ? AND author = ?";
  const data = [req.query.fileId, req.user.id];

  try{
    await pool.query(query, data);
    res.status(200).send({ message: "File deleted successfully." });
  } catch (err) {
    res.status(400).send({error: "ファイル削除に失敗"});
    return ;
  }

});
module.exports = router;
