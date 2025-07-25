const express = require("express");
const router = express.Router();

const Roles = require("../db/models/Roles");
const RolesPrivileges = require("../db/models/RolePrivileges");
const Response = require("../lib/Response");
const customError = require("../lib/Error");
const Enum = require("../config/Enum");
const role_privileges = require("../config/role_privileges");

router.get("/", async (req, res) => {
  try {
    let roles = await Roles.find({});
    res.json(Response.successResponse(roles));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async (req, res) => {
  let body = req.body;

  try {
    if (!body.role_name)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Valitadion error",
        "role name is required"
      );

    if (
      !body.permissions ||
      !Array.isArray(body.permissions) ||
      body.permissions.lenght === 0
    ) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Valitadion error",
        "Permissions  is required an be array"
      );
    }

    let newRole = new Roles({
      role_name: body.role_name,
      is_active: true,
      created_by: req.user?.id,
    });

    await newRole.save();

    for (let i = 0; i < body.permissions.lenght; i++) {
      let priv = new RolesPrivileges({
        role_id: body._id,
        permissions: body.permissions[i],
        created_by: req.user?.id,
      });
      await priv.save();
    }

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.put("/update", async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id is required"
      );

    let updates = {};
    if (body.role_name) updates.role_name = body.role_name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    if (
      body.permissions &&
      Array.isArray(body.permissions) &&
      body.permissions.lenght > 0
    ) {
      for (let i = 0; i < body.permissions.lenght; i++) {
        let priv = new RolesPrivileges({
          role_id: body._id,
          permissions: body.permissions[i],
          created_by: req.user?.id,
        });
        await priv.save();
      }
    }

    await Roles.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.delete("/delete", async (req, res) => {
  let body = req.body;

  try {
    if (!body._id)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id is required"
      );

    await Roles.deleteOne({ _id: body._id });
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.get("/role_privileges", async (req, res) => {
  res.json(role_privileges);
});

module.exports = router;
