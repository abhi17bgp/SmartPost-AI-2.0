const Collection = require('../models/collectionModel');
const Request = require('../models/requestModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllCollections = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.query;
  if (!workspaceId) {
    return next(new AppError('Please provide a workspaceId', 400));
  }
  
  const collections = await Collection.find({ workspaceId });
  // Also fetch nested requests for these collections
  const requests = await Request.find({ collectionId: { $in: collections.map(c => c._id) } }).populate('updatedBy', 'name email');

  res.status(200).json({ status: 'success', data: { collections, requests } });
});

exports.createCollection = catchAsync(async (req, res, next) => {
  const newCollection = await Collection.create(req.body);
  
  if (req.app.get('io') && newCollection.workspaceId) {
    req.app.get('io').to(newCollection.workspaceId.toString()).emit('collection_updated', newCollection);
  }

  res.status(201).json({ status: 'success', data: { collection: newCollection } });
});

exports.updateCollection = catchAsync(async (req, res, next) => {
  const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!collection) return next(new AppError('No collection found with that ID', 404));

  if (req.app.get('io') && collection.workspaceId) {
    req.app.get('io').to(collection.workspaceId.toString()).emit('collection_updated', collection);
  }

  res.status(200).json({ status: 'success', data: { collection } });
});

exports.deleteCollection = catchAsync(async (req, res, next) => {
  const collection = await Collection.findByIdAndDelete(req.params.id);
  if (!collection) return next(new AppError('No collection found with that ID', 404));

  // Also delete associated requests
  await Request.deleteMany({ collectionId: collection._id });

  if (req.app.get('io') && collection.workspaceId) {
    req.app.get('io').to(collection.workspaceId.toString()).emit('collection_deleted', collection._id);
  }

  res.status(200).json({ status: 'success', data: null });
});
