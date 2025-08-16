const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'customer-service/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// Create the multer instance
const upload = multer({ storage });

// @route   POST /api/upload
// @desc    Upload a file
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }
    res.json({
        fileName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
    });
});

module.exports = router;
