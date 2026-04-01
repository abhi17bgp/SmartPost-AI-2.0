const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Collection must have a name'],
    trim: true
  },
  workspaceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Workspace',
    required: [true, 'Collection must belong to a workspace']
  },
  parentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Collection', // For nested folders/collections
    default: null
  }
}, {
  timestamps: true
});

// Cascading Delete: When a collection is destroyed, destroy all its requests to prevent orphans
collectionSchema.pre('findOneAndDelete', async function(next) {
  const collectionId = this.getQuery()['_id'];
  if (collectionId) {
    await mongoose.model('Request').deleteMany({ collectionId });
  }
  next();
});

const Collection = mongoose.model('Collection', collectionSchema);
module.exports = Collection;
