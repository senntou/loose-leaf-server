const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

router.get('/:fileName', (req, res) => {
  const fileName = req.params.fileName;

  console.log(fileName);

  const filePath = path.join(__dirname, '../storage', fileName);

  // console.log( path.resolve(filePath));

  if (fs.existsSync( filePath )) {
      // ファイルが存在する場合はストリームで送信
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
  } else {
      res.status(404).send('File not found');
      console.log( path.resolve(filePath) );
  }
});

module.exports = router;
