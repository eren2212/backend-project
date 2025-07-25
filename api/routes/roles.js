const express = require("express");
const router = express.Router();

const Roles = require("../db/models/Roles");
const RolesPrivileges = require("../db/models/RolePrivileges");
const Response = require("../lib/Response");
const customError = require("../lib/Error");
const Enum = require("../config/Enum");

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

    let newRole = new Roles({
      role_name: body.role_name,
      is_active: true,
      created_by: req.user?.id,
    });

    await newRole.save();

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

module.exports = router;
