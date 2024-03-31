const express = require('express');
const multer = require('multer');
const router = express.Router();

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
});

module.exports = router;