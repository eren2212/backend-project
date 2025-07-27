const RolePrivileges = require("../db/models/RolePrivileges");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        throw new CustomError(
          Enum.HTTP_CODES.FORBIDDEN,
          "Access denied",
          "User roles not found"
        );
      }

      // Admin has all permissions
      const isAdmin = req.user.roles.some(
        (role) => role.role_name === Enum.USER_ROLES.ADMIN
      );
      if (isAdmin) {
        return next();
      }

      // Check if user has the required permission
      const roleIds = req.user.roles.map((role) => role._id);
      const hasPermission = await RolePrivileges.findOne({
        role_id: { $in: roleIds },
        permission: requiredPermission,
      });

      if (!hasPermission) {
        throw new CustomError(
          Enum.HTTP_CODES.FORBIDDEN,
          "Access denied",
          `${requiredPermission} permission required`
        );
      }

      next();
    } catch (error) {
      const errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  };
};

const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        throw new CustomError(
          Enum.HTTP_CODES.FORBIDDEN,
          "Access denied",
          "User roles not found"
        );
      }

      const userRoleNames = req.user.roles.map((role) => role.role_name);
      const hasRole = requiredRoles.some((role) =>
        userRoleNames.includes(role)
      );

      if (!hasRole) {
        throw new CustomError(
          Enum.HTTP_CODES.FORBIDDEN,
          "Access denied",
          `One of these roles required: ${requiredRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      const errorResponse = Response.errorResponse(error);
      res.status(errorResponse.code).json(errorResponse);
    }
  };
};

module.exports = { checkPermission, checkRole };
