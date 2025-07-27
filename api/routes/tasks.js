const express = require("express");
const router = express.Router();

const Tasks = require("../db/models/Tasks");
const Projects = require("../db/models/Projects");
const Users = require("../db/models/Users");
const AuditLogs = require("../db/models/AuditLogs");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const { authenticateToken } = require("../middlewares/auth");
const { checkRole } = require("../middlewares/roleCheck");

// Get all tasks (filtered by user role)
router.get("/", authenticateToken, async (req, res) => {
  try {
    let tasks;
    const userRoleNames = req.user.roles.map((role) => role.role_name);

    // Admin and Managers can see all tasks
    if (
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER)
    ) {
      tasks = await Tasks.find({ is_active: true })
        .populate("created_by", "firs_name last_name email")
        .populate("assignedTo", "firs_name last_name email")
        .populate("project_id", "title description")
        .sort({ created_at: -1 });
    } else {
      // Developers can see tasks assigned to them or created by them
      tasks = await Tasks.find({
        $or: [{ assignedTo: req.user.id }, { created_by: req.user.id }],
        is_active: true,
      })
        .populate("created_by", "firs_name last_name email")
        .populate("assignedTo", "firs_name last_name email")
        .populate("project_id", "title description")
        .sort({ created_at: -1 });
    }

    res.json(Response.successResponse(tasks));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Get single task by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Tasks.findById(req.params.id)
      .populate("created_by", "firs_name last_name email")
      .populate("assignedTo", "firs_name last_name email")
      .populate("project_id", "title description");

    if (!task || !task.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Task not found",
        "Task does not exist or has been deleted"
      );
    }

    // Check access rights
    const userRoleNames = req.user.roles.map((role) => role.role_name);
    const canAccessAllTasks =
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER);

    const isAssignedOrCreated =
      task.assignedTo?._id.toString() === req.user.id ||
      task.created_by._id.toString() === req.user.id;

    if (!canAccessAllTasks && !isAssignedOrCreated) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        "Access denied",
        "You don't have permission to view this task"
      );
    }

    res.json(Response.successResponse(task));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Create new task
router.post(
  "/projects/:projectId/tasks",
  authenticateToken,
  async (req, res) => {
    try {
      const { title, description, priority, assignedTo } = req.body;
      const projectId = req.params.projectId;

      // Validation
      if (!title || !description) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "Validation error",
          "Title and description are required"
        );
      }

      // Check if project exists and user has access
      const project = await Projects.findById(projectId);
      if (!project || !project.is_active) {
        throw new CustomError(
          Enum.HTTP_CODES.NOT_FOUND,
          "Project not found",
          "Project does not exist or has been deleted"
        );
      }

      // Check permissions: owner or admin/manager can create tasks
      const userRoleNames = req.user.roles.map((role) => role.role_name);
      const canCreateInAllProjects =
        userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
        userRoleNames.includes(Enum.USER_ROLES.MANAGER);

      if (
        !canCreateInAllProjects &&
        project.created_by.toString() !== req.user.id
      ) {
        throw new CustomError(
          Enum.HTTP_CODES.FORBIDDEN,
          "Access denied",
          "You don't have permission to create tasks in this project"
        );
      }

      // Validate assignedTo user if provided
      if (assignedTo) {
        const assignedUser = await Users.findById(assignedTo);
        if (!assignedUser || !assignedUser.is_active) {
          throw new CustomError(
            Enum.HTTP_CODES.BAD_REQUEST,
            "Invalid assigned user",
            "Assigned user does not exist or is inactive"
          );
        }
      }

      const newTask = new Tasks({
        title,
        description,
        priority: priority || Enum.TASK_PRIORITY.MEDIUM,
        status: Enum.TASK_STATUS.PENDING,
        assignedTo: assignedTo || null,
        project_id: projectId,
        created_by: req.user.id,
        is_active: true,
      });

      await newTask.save();
      await newTask.populate([
        { path: "created_by", select: "firs_name last_name email" },
        { path: "assignedTo", select: "firs_name last_name email" },
        { path: "project_id", select: "title description" },
      ]);

      // Log task creation
      const auditLog = new AuditLogs({
        level: "info",
        email: req.user.email,
        location: "tasks.js",
        proc_type: "CREATE_TASK",
        log: `Task "${title}" created in project "${project.title}"`,
      });
      await auditLog.save();

      res.status(201).json(
        Response.successResponse(
          {
            message: "Task created successfully",
            task: newTask,
          },
          201
        )
      );
    } catch (error) {
      const errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

// Update task
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, is_active } =
      req.body;
    const taskId = req.params.id;

    const task = await Tasks.findById(taskId).populate("project_id", "title");
    if (!task || !task.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Task not found",
        "Task does not exist or has been deleted"
      );
    }

    // Check permissions
    const userRoleNames = req.user.roles.map((role) => role.role_name);
    const canUpdateAllTasks =
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER);

    const isAssignedOrCreated =
      task.assignedTo?.toString() === req.user.id ||
      task.created_by.toString() === req.user.id;

    if (!canUpdateAllTasks && !isAssignedOrCreated) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        "Access denied",
        "You don't have permission to update this task"
      );
    }

    // Validate assignedTo user if provided
    if (assignedTo) {
      const assignedUser = await Users.findById(assignedTo);
      if (!assignedUser || !assignedUser.is_active) {
        throw new CustomError(
          Enum.HTTP_CODES.BAD_REQUEST,
          "Invalid assigned user",
          "Assigned user does not exist or is inactive"
        );
      }
    }

    // Prepare updates
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (typeof is_active === "boolean") updates.is_active = is_active;

    // Log status change if status is being updated
    if (status !== undefined && status !== task.status) {
      updates.status = status;

      const auditLog = new AuditLogs({
        level: "info",
        email: req.user.email,
        location: "tasks.js",
        proc_type: "UPDATE_TASK_STATUS",
        log: `Task "${task.title}" status changed from "${task.status}" to "${status}"`,
      });
      await auditLog.save();
    }

    await Tasks.updateOne({ _id: taskId }, updates);

    const updatedTask = await Tasks.findById(taskId)
      .populate("created_by", "firs_name last_name email")
      .populate("assignedTo", "firs_name last_name email")
      .populate("project_id", "title description");

    res.json(
      Response.successResponse({
        message: "Task updated successfully",
        task: updatedTask,
      })
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Delete task (soft delete)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Tasks.findById(taskId).populate("project_id", "title");
    if (!task || !task.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Task not found",
        "Task does not exist or has been deleted"
      );
    }

    // Check permissions: creator, admin, or manager can delete
    const userRoleNames = req.user.roles.map((role) => role.role_name);
    const canDeleteAllTasks =
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER);

    if (!canDeleteAllTasks && task.created_by.toString() !== req.user.id) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        "Access denied",
        "You don't have permission to delete this task"
      );
    }

    // Soft delete
    await Tasks.updateOne({ _id: taskId }, { is_active: false });

    // Log task deletion
    const auditLog = new AuditLogs({
      level: "info",
      email: req.user.email,
      location: "tasks.js",
      proc_type: "DELETE_TASK",
      log: `Task "${task.title}" deleted from project "${task.project_id.title}"`,
    });
    await auditLog.save();

    res.json(
      Response.successResponse({
        message: "Task deleted successfully",
      })
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Get task history/audit logs
router.get(
  "/:id/history",
  authenticateToken,
  checkRole([Enum.USER_ROLES.ADMIN, Enum.USER_ROLES.MANAGER]),
  async (req, res) => {
    try {
      const taskId = req.params.id;

      const task = await Tasks.findById(taskId);
      if (!task) {
        throw new CustomError(
          Enum.HTTP_CODES.NOT_FOUND,
          "Task not found",
          "Task does not exist"
        );
      }

      // Get audit logs related to this task
      const logs = await AuditLogs.find({
        log: { $regex: `"${task.title}"`, $options: "i" },
      }).sort({ created_at: -1 });

      res.json(
        Response.successResponse({
          task: {
            id: task._id,
            title: task.title,
          },
          history: logs,
        })
      );
    } catch (error) {
      const errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

module.exports = router;
