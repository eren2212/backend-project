const jwt = require("jsonwebtoken");
const Users = require("../db/models/Users");
const UserRoles = require("../db/models/UserRoles");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Access denied",
        "Token is required"
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user info with roles
    const user = await Users.findById(decoded.id);
    if (!user || !user.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Access denied",
        "User not found or inactive"
      );
    }

    // Get user roles
    const userRoles = await UserRoles.find({ user_id: decoded.id }).populate(
      "role_id"
    );

    req.user = {
      id: user._id,
      email: user.email,
      first_name: user.firs_name,
      last_name: user.last_name,
      roles: userRoles.map((ur) => ur.role_id),
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      error = new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Access denied",
        "Invalid token"
      );
    } else if (error.name === "TokenExpiredError") {
      error = new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Access denied",
        "Token expired"
      );
    }

    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
};

module.exports = { authenticateToken };
