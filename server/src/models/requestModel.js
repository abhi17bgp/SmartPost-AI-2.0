const mongoose = require('mongoose');

const headerSchema = new mongoose.Schema({
  key: String,
  value: String,
  isActive: { type: Boolean, default: true }
}, { _id: false });

const paramSchema = new mongoose.Schema({
  key: String,
  value: String,
  isActive: { type: Boolean, default: true }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Request must have a name']
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    default: 'GET'
  },
  url: {
    type: String,
    default: ''
  },
  headers: [headerSchema],
  queryParams: [paramSchema],
  body: {
    type: { type: String, enum: ['none', 'json', 'text', 'form-data', 'urlencoded'], default: 'none' },
    content: mongoose.Schema.Types.Mixed
  },
  auth: {
    type: { type: String, enum: ['none', 'bearer', 'basic'], default: 'none' },
    token: String,
    username: String,
    password: String
  },
  collectionId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Collection',
    required: [true, 'Request must belong to a collection']
  },
  workspaceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: false
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  lastResponse: {
    status: Number,
    timeTaken: Number,
    data: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed
  },
  aiAnalysis: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
