var express = require("express");
var router = express.Router();
const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const { isValidPassword } = require("../utils/passwords_control");
const customError = require("../lib/Error");
const Enum = require("../config/Enum");
const bcrypt = require("bcryptjs");
const is = require("is_js");

/* GET users listing. */
router.get("/", async (req, res, next) => {
  try {
    let users = await Users.find({});
    res.json(Response.successResponse(users));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async (req, res) => {
  let body = req.body;
  try {
    if (!body.email) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "email must be filled"
      );
    }
    if (await Users.findOne({ email: body.email })) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "This email is already registered."
      );
    }
    if (!is.email(body.email)) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "email be real email"
      );
    }
    if (!body.password) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "password must be filled"
      );
    }
    if (!body.first_name) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "first_name must be filled"
      );
    }

    if (!isValidPassword(body.password)) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
    }

    const hash = await bcrypt.hashSync(body.password, 10);

    // let user = new Users({
    //   email: body.email,
    //   password: hash,
    //   firs_name: body.firs_name,
    //   last_name: body.last_name,
    //   phone_number: body.phone_number,
    // });
    //await user.save();

    await Users.create({
      email: body.email,
      password: hash,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });
    //burada static olarak yapıyoruz nesne oluşturmamıza gerek kalmıyor
    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED)
      );
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.put("/update", async (req, res) => {
  let body = req.body;
  try {
    let updates = {};

    if (!body._id)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id is required"
      );

    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    await Users.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
