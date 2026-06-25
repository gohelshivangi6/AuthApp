const workspaceService = require("../services/workspaceService");

async function getWorkspaces(req, res, next) {
  try {
    const workspaces = await workspaceService.getWorkspaces(req.user.id, req.user.role);
    res.json({ success: true, workspaces });
  } catch (err) { next(err); }
}

async function createWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.createWorkspace(req.body.name, req.body.description, req.user.id);
    res.status(201).json({ success: true, workspace });
  } catch (err) { next(err); }
}

async function updateWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.id, req.body.name, req.body.description);
    res.json({ success: true, workspace });
  } catch (err) { next(err); }
}

async function deleteWorkspace(req, res, next) {
  try {
    await workspaceService.deleteWorkspace(req.params.id);
    res.json({ success: true, message: "Workspace deleted." });
  } catch (err) { next(err); }
}

async function getMembers(req, res, next) {
  try {
    const members = await workspaceService.getMembers(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, members });
  } catch (err) { next(err); }
}

async function addMember(req, res, next) {
  try {
    const member = await workspaceService.addMember(req.params.id, req.body.userId);
    res.status(201).json({ success: true, member });
  } catch (err) { next(err); }
}

async function removeMember(req, res, next) {
  try {
    const result = await workspaceService.removeMember(req.params.id, req.params.userId, req.user);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function leaveWorkspace(req, res, next) {
  try {
    const result = await workspaceService.leaveWorkspace(req.params.id, req.user.id, req.user.name);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const result = await workspaceService.getMessages(
      req.params.id, req.user.id, req.user.role,
      req.query.page, req.query.limit
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const message = await workspaceService.sendMessage(
      req.params.id, req.user.id, req.user.role,
      req.body.content, req.user.name, req.user.email
    );
    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
}

async function editMessage(req, res, next) {
  try {
    const message = await workspaceService.editMessage(
      req.params.id, req.params.msgId, req.user.id, req.body.content
    );
    res.json({ success: true, message });
  } catch (err) { next(err); }
}

async function deleteMessage(req, res, next) {
  try {
    const result = await workspaceService.deleteMessage(
      req.params.id, req.params.msgId, req.user.id,
      req.user.role, req.body.deleteFrom
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getMembers,
  addMember,
  removeMember,
  leaveWorkspace,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};
