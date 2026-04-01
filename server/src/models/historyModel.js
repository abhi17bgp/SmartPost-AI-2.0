const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  workspaceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: false
  },
  method: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: Number,
  timeTaken: Number,
  headers: { type: Array, default: [] },
  queryParams: { type: Array, default: [] },
  bodyMode: { type: String, default: 'json' },
  bodyContent: { type: String, default: '' },
  responseData: { type: mongoose.Schema.Types.Mixed },
  responseHeaders: { type: mongoose.Schema.Types.Mixed },
  aiAnalysis: { type: String, default: null },
  isPerformanceRun: {
    type: Boolean,
    default: false
  },
  performanceMetrics: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // auto-delete after 30 days
  }
});

const History = mongoose.model('History', historySchema);
module.exports = History;
