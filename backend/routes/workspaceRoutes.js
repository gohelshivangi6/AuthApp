const express = require("express");
const router = express.Router();
const { requireAuth } = require("../controllers/authController");
const { requireAdmin } = require("../middleware/adminAuth");
const ctrl = require("../controllers/workspaceController");

// All workspace routes need auth
router.use(requireAuth);

// Workspaces
router.get("/", ctrl.getWorkspaces);
router.post("/", requireAdmin, ctrl.createWorkspace);
router.put("/:id", requireAdmin, ctrl.updateWorkspace);
router.delete("/:id", requireAdmin, ctrl.deleteWorkspace);

// Members
router.get("/:id/members", ctrl.getMembers);
router.post("/:id/members", requireAdmin, ctrl.addMember);
router.delete("/:id/members/:userId", requireAdmin, ctrl.removeMember);

// Messages
router.get("/:id/messages", ctrl.getMessages);
router.post("/:id/messages", ctrl.sendMessage);
router.put("/:id/messages/:msgId", ctrl.editMessage);
router.delete("/:id/messages/:msgId", ctrl.deleteMessage);

module.exports = router;
