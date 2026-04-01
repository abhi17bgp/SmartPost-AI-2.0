const express = require('express');
const collectionController = require('../controllers/collectionController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/')
  .get(collectionController.getAllCollections)
  .post(collectionController.createCollection);

router.route('/:id')
  .patch(collectionController.updateCollection)
  .delete(collectionController.deleteCollection);

module.exports = router;
