const History = require('../models/historyModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getHistory = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.query;
  let query = workspaceId ? { workspaceId } : { userId: req.user.id, workspaceId: { $exists: false } };

  const history = await History.find(query).sort('-createdAt').limit(100);
  res.status(200).json({ status: 'success', data: { history } });
});

exports.createHistory = catchAsync(async (req, res, next) => {
  const newHistory = await History.create({
    userId: req.user.id,
    workspaceId: req.body.workspaceId,
    method: req.body.method,
    url: req.body.url,
    status: req.body.status,
    timeTaken: req.body.timeTaken,
    headers: req.body.headers || [],
    queryParams: req.body.queryParams || [],
    bodyMode: req.body.bodyMode || 'json',
    bodyContent: req.body.bodyContent || '',
    responseData: req.body.responseData,
    responseHeaders: req.body.responseHeaders,
    isPerformanceRun: req.body.isPerformanceRun || false,
    performanceMetrics: req.body.performanceMetrics || null
  });

  if (req.app.get('io') && newHistory.workspaceId) {
    req.app.get('io').to(newHistory.workspaceId.toString()).emit('history_added', newHistory);
  }

  res.status(201).json({ status: 'success', data: { history: newHistory } });
});

exports.clearHistory = catchAsync(async (req, res, next) => {
  const { workspaceId } = req.query;
  let query = workspaceId ? { workspaceId } : { userId: req.user.id, workspaceId: { $exists: false } };
  
  await History.deleteMany(query);
  
  if (req.app.get('io') && workspaceId) {
    req.app.get('io').to(workspaceId.toString()).emit('history_cleared', workspaceId);
  }

  res.status(204).json({ status: 'success', data: null });
});

exports.deleteHistory = catchAsync(async (req, res, next) => {
  const historyItem = await History.findById(req.params.id);
  if (!historyItem) {
    return next(new AppError('No history item found with that ID', 404));
  }

  // Basic permission check could be added here, assuming any workspace member can delete
  await historyItem.deleteOne();

  if (req.app.get('io') && historyItem.workspaceId) {
    req.app.get('io').to(historyItem.workspaceId.toString()).emit('history_deleted', historyItem._id);
  }

  res.status(204).json({ status: 'success', data: null });
});

exports.updateHistory = catchAsync(async (req, res, next) => {
  const historyItem = await History.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!historyItem) {
    return next(new AppError('No history item found with that ID', 404));
  }

  if (req.app.get('io') && historyItem.workspaceId) {
    req.app.get('io').to(historyItem.workspaceId.toString()).emit('history_updated', historyItem);
  }

  res.status(200).json({ status: 'success', data: { history: historyItem } });
});
