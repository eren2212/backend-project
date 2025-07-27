const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Users = require("../db/models/Users");
const UserRoles = require("../db/models/UserRoles");
const Roles = require("../db/models/Roles");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, firs_name, last_name, phone_number, role } =
      req.body;

    // Validation
    if (!email || !password || !firs_name) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation error",
        "Email, password, and first name are required"
      );
    }

    // Check if user already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT,
        "User already exists",
        "A user with this email already exists"
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = new Users({
      email,
      password: hashedPassword,
      firs_name,
      last_name,
      phone_number,
      is_active: true,
    });

    await newUser.save();

    // Assign default role (Developer) if no role specified
    let userRole = role || Enum.USER_ROLES.DEVELOPER;
    const roleDoc = await Roles.findOne({ role_name: userRole });

    if (roleDoc) {
      const newUserRole = new UserRoles({
        user_id: newUser._id,
        role_id: roleDoc._id,
      });
      await newUserRole.save();
    }

    res.status(201).json(
      Response.successResponse(
        {
          message: "User registered successfully",
          user: {
            id: newUser._id,
            email: newUser.email,
            first_name: newUser.firs_name,
            last_name: newUser.last_name,
          },
        },
        201
      )
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation error",
        "Email and password are required"
      );
    }

    // Find user
    const user = await Users.findOne({ email });
    if (!user) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Invalid credentials",
        "Email or password is incorrect"
      );
    }

    // Check if user is active
    if (!user.is_active) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Account disabled",
        "Your account has been disabled"
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        "Invalid credentials",
        "Email or password is incorrect"
      );
    }

    // Get user roles
    const userRoles = await UserRoles.find({ user_id: user._id }).populate(
      "role_id"
    );

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json(
      Response.successResponse({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          first_name: user.firs_name,
          last_name: user.last_name,
          roles: userRoles.map((ur) => ({
            id: ur.role_id._id,
            name: ur.role_id.role_name,
          })),
        },
      })
    );
  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
