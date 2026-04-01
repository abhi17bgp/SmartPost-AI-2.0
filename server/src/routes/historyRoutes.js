const express = require('express');
const historyController = require('../controllers/historyController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/')
  .get(historyController.getHistory)
  .post(historyController.createHistory)
  .delete(historyController.clearHistory);

router.route('/:id')
  .patch(historyController.updateHistory)
  .delete(historyController.deleteHistory);

module.exports = router;
