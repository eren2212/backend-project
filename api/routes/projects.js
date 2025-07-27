const express = require("express");
const router = express.Router();

const Projects = require("../db/models/Projects");
const Tasks = require("../db/models/Tasks");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const { authenticateToken } = require("../middlewares/auth");
const { checkRole } = require("../middlewares/roleCheck");

// Get all projects (filtered by user role)
router.get("/", authenticateToken, async (req, res) => {
  try {
    let projects;
    const userRoleNames = req.user.roles.map((role) => role.role_name);

    // Admin and Managers can see all projects
    if (
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER)
    ) {
      projects = await Projects.find({ is_active: true })
        .populate("created_by", "firs_name last_name email")
        .sort({ created_at: -1 });
    } else {
      // Developers can only see their own projects
      projects = await Projects.find({
        created_by: req.user.id,
        is_active: true,
      })
        .populate("created_by", "firs_name last_name email")
        .sort({ created_at: -1 });
    }

    res.json(Response.successResponse(projects));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Get single project by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Projects.findById(req.params.id).populate(
      "created_by",
      "firs_name last_name email"
    );

    if (!project || !project.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Project not found",
        "Project does not exist or has been deleted"
      );
    }

    // Check access rights
    const userRoleNames = req.user.roles.map((role) => role.role_name);
    const canAccessAllProjects =
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER);

    if (
      !canAccessAllProjects &&
      project.created_by._id.toString() !== req.user.id
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        "Access denied",
        "You don't have permission to view this project"
      );
    }

    res.json(Response.successResponse(project));
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Create new project
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validation
    if (!title || !description) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation error",
        "Title and description are required"
      );
    }

    const newProject = new Projects({
      title,
      description,
      created_by: req.user.id,
      is_active: true,
    });

    await newProject.save();
    await newProject.populate("created_by", "firs_name last_name email");

    res.status(201).json(
      Response.successResponse(
        {
          message: "Project created successfully",
          project: newProject,
        },
        201
      )
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Update project
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { title, description, is_active } = req.body;
    const projectId = req.params.id;

    const project = await Projects.findById(projectId);
    if (!project) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Project not found",
        "Project does not exist"
      );
    }

    // Check permissions: owner or admin/manager can update
    const userRoleNames = req.user.roles.map((role) => role.role_name);
    const canUpdateAllProjects =
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER);

    if (
      !canUpdateAllProjects &&
      project.created_by.toString() !== req.user.id
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        "Access denied",
        "You don't have permission to update this project"
      );
    }

    // Prepare updates
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (typeof is_active === "boolean") updates.is_active = is_active;

    await Projects.updateOne({ _id: projectId }, updates);

    const updatedProject = await Projects.findById(projectId).populate(
      "created_by",
      "firs_name last_name email"
    );

    res.json(
      Response.successResponse({
        message: "Project updated successfully",
        project: updatedProject,
      })
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// Delete project (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  checkRole([Enum.USER_ROLES.ADMIN, Enum.USER_ROLES.MANAGER]),
  async (req, res) => {
    try {
      const projectId = req.params.id;

      const project = await Projects.findById(projectId);
      if (!project) {
        throw new CustomError(
          Enum.HTTP_CODES.NOT_FOUND,
          "Project not found",
          "Project does not exist"
        );
      }

      // Soft delete project and its tasks
      await Projects.updateOne({ _id: projectId }, { is_active: false });
      await Tasks.updateMany({ project_id: projectId }, { is_active: false });

      res.json(
        Response.successResponse({
          message: "Project deleted successfully",
        })
      );
    } catch (error) {
      const errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  }
);

// Get project tasks
router.get("/:id/tasks", authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if project exists and user has access
    const project = await Projects.findById(projectId);
    if (!project || !project.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Project not found",
        "Project does not exist or has been deleted"
      );
    }

    // Check access rights
    const userRoleNames = req.user.roles.map((role) => role.role_name);
    const canAccessAllProjects =
      userRoleNames.includes(Enum.USER_ROLES.ADMIN) ||
      userRoleNames.includes(Enum.USER_ROLES.MANAGER);

    if (
      !canAccessAllProjects &&
      project.created_by.toString() !== req.user.id
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.FORBIDDEN,
        "Access denied",
        "You don't have permission to view this project's tasks"
      );
    }

    const tasks = await Tasks.find({
      project_id: projectId,
      is_active: true,
    })
      .populate("created_by", "firs_name last_name email")
      .populate("assignedTo", "firs_name last_name email")
      .sort({ created_at: -1 });

    res.json(
      Response.successResponse({
        project: {
          id: project._id,
          title: project.title,
          description: project.description,
        },
        tasks,
      })
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
