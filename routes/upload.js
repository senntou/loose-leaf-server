const express = require("express");
const multer = require("multer");
const router = express.Router();

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

router.post("/", upload.single("file"), (req, res) => {
  console.log(req.file.filename + "-" + req.body.title);
  res.status(200).send({ message: "File uploaded successfully." });
});

module.exports = router;
