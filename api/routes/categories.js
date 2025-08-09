var express = require("express");
var router = express.Router();
const Categories = require("../db/models/Categories");
const Response = require("../lib/Response");
const customError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/Auditlogs");
/**
 * Create
 * Read
 * Update
 * Delete
 * CRUD
 */
//get all categories
router.get("/", async (req, res, next) => {
  try {
    let categories = await Categories.find({});
    res.json(Response.successResponse(categories));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

//add category
router.post("/add", async (req, res, next) => {
  let body = req.body;
  try {
    if (!body.name)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "name is required"
      );

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    AuditLogs.info(req.user?.email, "Categories", "Add", category);

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", async (req, res, next) => {
  let body = req.body;

  try {
    if (!body._id)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id is required"
      );

    let updates = {};

    if (body.name) updates.name = body.name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    //burada true ve false değeri aldığı için isactive böyle bir kontrol yaptık.

    await Categories.updateOne({ _id: body._id }, updates);

    AuditLogs.info(req.user?.email, "Categories", "Update", {
      _id: body._id,
      ...updates,
    });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.delete("/delete", async (req, res, next) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id is required"
      );

    await Categories.deleteOne({ _id: body._id });

    AuditLogs.info(req.user?.email, "Categories", "Delete", { _id: body._id });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});
module.exports = router;
