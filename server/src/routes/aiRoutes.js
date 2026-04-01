const express = require('express');
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/analyze', authController.protect, aiController.analyzeResponse);

module.exports = router;
