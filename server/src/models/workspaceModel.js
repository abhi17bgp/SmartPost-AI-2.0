const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace must have a name'],
    trim: true,
    default: 'My Workspace'
  },
  joinCode: {
    type: String,
    unique: true,
    sparse: true // Allow nulls for older workspaces that might not have a code initially
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Workspace must belong to a user']
  },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      }
    }
  ]
}, {
  timestamps: true
});

const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;
