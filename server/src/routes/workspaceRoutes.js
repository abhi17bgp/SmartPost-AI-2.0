const express = require('express');
const workspaceController = require('../controllers/workspaceController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/')
  .get(workspaceController.getAllWorkspaces)
  .post(workspaceController.createWorkspace);

router.post('/join', workspaceController.joinWorkspace);

router.route('/:id')
  .get(workspaceController.getWorkspace)
  .patch(workspaceController.updateWorkspace)
  .delete(workspaceController.deleteWorkspace);

router.post('/:id/generate-code', workspaceController.generateCode);
router.post('/:id/leave', workspaceController.leaveWorkspace);
router.delete('/:id/members/:userId', workspaceController.removeMember);

module.exports = router;
