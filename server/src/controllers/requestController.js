const Request = require('../models/requestModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createRequest = catchAsync(async (req, res, next) => {
  req.body.updatedBy = req.user.id;
  const newRequest = await Request.create(req.body);
  await newRequest.populate('updatedBy', 'name email');
  
  if (req.app.get('io') && newRequest.workspaceId) {
    req.app.get('io').to(newRequest.workspaceId.toString()).emit('request_updated', newRequest);
  }

  res.status(201).json({ status: 'success', data: { request: newRequest } });
});

exports.getRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findById(req.params.id).populate('updatedBy', 'name email');
  if (!request) return next(new AppError('No request found with that ID', 404));
  res.status(200).json({ status: 'success', data: { request } });
});

exports.updateRequest = catchAsync(async (req, res, next) => {
  req.body.updatedBy = req.user.id;
  const request = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('updatedBy', 'name email');
  if (!request) return next(new AppError('No request found with that ID', 404));

  if (req.app.get('io') && request.workspaceId) {
    req.app.get('io').to(request.workspaceId.toString()).emit('request_updated', request);
  }

  res.status(200).json({ status: 'success', data: { request } });
});

exports.deleteRequest = catchAsync(async (req, res, next) => {
  const request = await Request.findByIdAndDelete(req.params.id);
  if (!request) return next(new AppError('No request found with that ID', 404));

  if (req.app.get('io') && request.workspaceId) {
    req.app.get('io').to(request.workspaceId.toString()).emit('request_deleted', request._id);
  }

  res.status(200).json({ status: 'success', data: null });
});
