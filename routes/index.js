const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

/* GET home page. */
router.get("/", function (req, res, next) {
  directoryPath = path.join(__dirname, "../storage");
  const fileNames = fs.readdirSync("./storage");
  let fileData;
  try {
    fileData = fileNames.map((fileName) => {
      const filePath = path.join(directoryPath, fileName);
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const fileSizeInKilobytes = fileSizeInBytes / 1024; // バイトからキロバイトに変換

      return {
        fileName: fileName,
        fileSize: fileSizeInKilobytes.toFixed(2) + " KB", // ファイルサイズを小数点以下2桁までの文字列に変換してKB単位で表示
      };
    });
  } catch (error) {
    console.error("Error reading directory:", error);
  }

  res.render("index", { files: fileData });
});

module.exports = router;
