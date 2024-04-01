const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const router = express.Router();

/**
 * MySQLにアクセス
 */

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'senntou00117',
  database: 'looseleaf'
});

connection.connect((err) => {
  if (err) {
		throw new Error(err.stack);
  }
  console.log('MySQL connection succeed');
});

function deleteNoneexistFileData(files){

    existFiles = new Array();

    for( const file of files ){
        filePath = path.join(__dirname, '..' , 'storage' , file.id );
        if( !(fs.existsSync(filePath) ) ){
            const sql = 'DELETE FROM notes WHERE id = ?';
            connection.query(sql, file.id, (error, results) => {
                if(error) throw error;
            });
        } else {
            existFiles.push(file);
        }
    }

    return existFiles;
}

router.get('/', function(req, res, next) {

	connection.query(
		'SELECT * FROM notes',
		(error, results) => {
			// res.json({files: fileData});
            const files = deleteNoneexistFileData(results);
			res.render('upload',{files: files});
		}
	);
});

/**
 * multerの設定
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './storage');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e8);
        cb(null,uniqueSuffix + '.pdf');
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are accepted!!'))
    }
};

const upload = multer({ 
    storage: storage,
    limits: {fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter,
});

router.post('/', upload.single('file'), (req, res) => {
		console.log(req.file.filename + '-' + req.body.title);
		res.status(200).send({ message: 'File uploaded successfully.' });

		const query = 'INSERT INTO notes( ?? , ?? ) VALUES( ? , ? )';
		const data = [ 'id' , 'comment', req.file.filename, req.body.title ];

		connection.query(
			query,
			data,
			(error, results) => {
				if(error) throw error;
			}
		);
});

module.exports = router;
