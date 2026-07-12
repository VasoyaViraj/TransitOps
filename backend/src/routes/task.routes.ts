import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createCommentSchema,
  createChecklistSchema,
  updateChecklistSchema,
  createLabelSchema,
} from "../validators/task.validator.js";
import * as taskService from "../services/task.services.js";

const router = Router();

const getParam = (req: Request, name: string): string => {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
};

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await taskService.getAllTasks(req.query as any);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/dashboard", authenticate, async (_req: Request, res: Response) => {
  try {
    const stats = await taskService.getDashboardStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/activity", authenticate, async (req: Request, res: Response) => {
  try {
    const activity = await taskService.getActivity(req.query.taskId as string | undefined);
    res.json({ activity });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/labels", authenticate, async (_req: Request, res: Response) => {
  try {
    const labels = await taskService.getAllLabels();
    res.json({ labels });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/labels", authenticate, authorizePermission("fleet", "EDIT"), validate(createLabelSchema), async (req: Request, res: Response) => {
  try {
    const label = await taskService.createLabel(req.body);
    res.status(201).json({ label });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const task = await taskService.getTaskById(getParam(req, "id"));
    res.json({ task });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/", authenticate, authorizePermission("fleet", "EDIT"), validate(createTaskSchema), async (req: AuthRequest, res: Response) => {
  try {
    const task = await taskService.createTask(req.body, req.userId!);
    res.status(201).json({ task });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:id", authenticate, authorizePermission("fleet", "EDIT"), validate(updateTaskSchema), async (req: AuthRequest, res: Response) => {
  try {
    const task = await taskService.updateTask(getParam(req, "id"), req.body, req.userId!);
    res.json({ task });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, authorizePermission("fleet", "EDIT"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await taskService.deleteTask(getParam(req, "id"), req.userId!);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:id/status", authenticate, authorizePermission("fleet", "EDIT"), validate(updateTaskStatusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const task = await taskService.updateTaskStatus(getParam(req, "id"), req.body, req.userId!);
    res.json({ task });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:id/duplicate", authenticate, authorizePermission("fleet", "EDIT"), async (req: AuthRequest, res: Response) => {
  try {
    const task = await taskService.duplicateTask(getParam(req, "id"), req.userId!);
    res.status(201).json({ task });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:id/comments", authenticate, validate(createCommentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const comment = await taskService.createComment(getParam(req, "id"), req.body, req.userId!);
    res.status(201).json({ comment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:taskId/comments/:commentId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const comment = await taskService.updateComment(getParam(req, "commentId"), req.body, req.userId!);
    res.json({ comment });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.delete("/:taskId/comments/:commentId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await taskService.deleteComment(getParam(req, "commentId"), req.userId!);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:id/checklists", authenticate, validate(createChecklistSchema), async (req: Request, res: Response) => {
  try {
    const item = await taskService.createChecklist(getParam(req, "id"), req.body);
    res.status(201).json({ item });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:taskId/checklists/:checklistId", authenticate, validate(updateChecklistSchema), async (req: Request, res: Response) => {
  try {
    const item = await taskService.updateChecklist(getParam(req, "checklistId"), req.body);
    res.json({ item });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.delete("/:taskId/checklists/:checklistId", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await taskService.deleteChecklist(getParam(req, "checklistId"));
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:id/watchers", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await taskService.addWatcher(getParam(req, "id"), req.userId!);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.delete("/:id/watchers", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await taskService.removeWatcher(getParam(req, "id"), req.userId!);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
