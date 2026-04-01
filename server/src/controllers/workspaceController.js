const Workspace = require('../models/workspaceModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

exports.getAllWorkspaces = catchAsync(async (req, res, next) => {
  const workspaces = await Workspace.find({
    $or: [{ owner: req.user.id }, { 'members.user': req.user.id }]
  }).populate('owner', 'name email').populate('members.user', 'name email');
  res.status(200).json({ status: 'success', data: { workspaces } });
});

exports.createWorkspace = catchAsync(async (req, res, next) => {
  const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  const newWorkspace = await Workspace.create({
    name: req.body.name,
    joinCode,
    owner: req.user.id,
    members: [{ user: req.user.id, role: 'admin' }]
  });
  
  await newWorkspace.populate('owner', 'name email');
  await newWorkspace.populate('members.user', 'name email');
  
  if (req.app.get('io')) {
    req.app.get('io').emit('workspace_created', newWorkspace);
  }

  res.status(201).json({ status: 'success', data: { workspace: newWorkspace } });
});

exports.getWorkspace = catchAsync(async (req, res, next) => {
  const workspace = await Workspace.findOne({
    _id: req.params.id,
    $or: [{ owner: req.user.id }, { 'members.user': req.user.id }]
  }).populate('owner', 'name email').populate('members.user', 'name email');
  
  if (!workspace) return next(new AppError('No workspace found with that ID', 404));
  res.status(200).json({ status: 'success', data: { workspace } });
});

exports.updateWorkspace = catchAsync(async (req, res, next) => {
  const workspace = await Workspace.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true, runValidators: true }
  ).populate('owner', 'name email').populate('members.user', 'name email');
  
  if (!workspace) return next(new AppError('No workspace found or you are not the admin', 404));
  
  if (req.app.get('io')) {
    req.app.get('io').to(req.params.id).emit('workspace_updated', workspace);
  }

  res.status(200).json({ status: 'success', data: { workspace } });
});

exports.deleteWorkspace = catchAsync(async (req, res, next) => {
  const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!workspace) return next(new AppError('No workspace found or you are not the admin', 404));
  
  if (req.app.get('io')) {
    req.app.get('io').to(req.params.id).emit('workspace_deleted', req.params.id);
  }

  res.status(204).json({ status: 'success', data: null });
});

exports.generateCode = catchAsync(async (req, res, next) => {
  const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  const workspace = await Workspace.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { joinCode },
    { new: true }
  ).populate('owner', 'name email').populate('members.user', 'name email');
  
  if (!workspace) return next(new AppError('No workspace found or you are not the admin', 404));

  if (req.app.get('io')) {
    req.app.get('io').to(req.params.id).emit('workspace_updated', workspace);
  }

  res.status(200).json({ status: 'success', data: { workspace } });
});

exports.joinWorkspace = catchAsync(async (req, res, next) => {
  const { joinCode } = req.body;
  
  const workspace = await Workspace.findOne({ joinCode });
  if (!workspace) return next(new AppError('Invalid join code', 404));

  // Check if already a member
  const isMember = workspace.members.some(m => m.user.toString() === req.user.id);
  if (isMember) return next(new AppError('You are already a member of this workspace', 400));

  workspace.members.push({ user: req.user.id, role: 'member' });
  await workspace.save();
  await workspace.populate('owner', 'name email');
  await workspace.populate('members.user', 'name email');

  if (req.app.get('io')) {
    req.app.get('io').to(workspace._id.toString()).emit('workspace_updated', workspace);
  }

  res.status(200).json({ status: 'success', data: { workspace } });
});

exports.leaveWorkspace = catchAsync(async (req, res, next) => {
  const workspace = await Workspace.findOne({ _id: req.params.id, 'members.user': req.user.id });
  if (!workspace) return next(new AppError('Workspace not found or you are not a member', 404));
  if (workspace.owner.toString() === req.user.id) return next(new AppError('Owner cannot leave, delete the workspace instead', 400));

  workspace.members = workspace.members.filter(m => m.user.toString() !== req.user.id);
  await workspace.save();
  await workspace.populate('owner', 'name email');
  await workspace.populate('members.user', 'name email');

  if (req.app.get('io')) {
    req.app.get('io').to(workspace._id.toString()).emit('workspace_updated', workspace);
  }

  res.status(200).json({ status: 'success', data: { workspace } });
});

exports.removeMember = catchAsync(async (req, res, next) => {
  const workspace = await Workspace.findOne({ _id: req.params.id, owner: req.user.id });
  if (!workspace) return next(new AppError('Workspace not found or you are not the admin', 404));

  workspace.members = workspace.members.filter(m => m.user.toString() !== req.params.userId);
  await workspace.save();
  await workspace.populate('owner', 'name email');
  await workspace.populate('members.user', 'name email');

  if (req.app.get('io')) {
    req.app.get('io').to(workspace._id.toString()).emit('workspace_updated', workspace);
    req.app.get('io').to(workspace._id.toString()).emit('member_removed', { workspaceId: workspace._id, userId: req.params.userId });
  }

  res.status(200).json({ status: 'success', data: { workspace } });
});
