var express = require("express");
var router = express.Router();
const Users = require("../db/models/Users");
const Response = require("../lib/Response");
const { isValidPassword } = require("../utils/passwords_control");
const customError = require("../lib/Error");
const Enum = require("../config/Enum");
const bcrypt = require("bcryptjs");
const is = require("is_js");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRoles");

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

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "roles field must be an array"
      );
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length == 0) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "roles field must be an array"
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

    let user = await Users.create({
      email: body.email,
      password: hash,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });
    //burada static olarak yapıyoruz nesne oluşturmamıza gerek kalmıyor

    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id,
      });
    }
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

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    if (Array.isArray(body.roles) && body.roles.length > 0) {
      let userRoles = await UserRoles.find({ user_id: body._id });

      let removedRoles = userRoles.filter(
        (x) => !body.roles.includes(x.role_id)
      ); //["use_viwe"]
      let newRoles = body.roles.filter(
        (x) => !userRoles.map((r) => r.role_id).includes(x)
      );

      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({
          _id: { $in: removedRoles.map((x) => x._id.toString()) },
        });
      }

      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: body._id,
          });
          await userRole.save();
        }
      }
    }

    await Users.updateOne({ _id: body._id }, updates);
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});
router.put("/update/password", async (req, res) => {
  let { password, _id } = req.body;
  try {
    if (!_id)
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id is required"
      );

    if (!isValidPassword(password))
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
      );

    const hash = await bcrypt.hashSync(password, 10);
    await Users.updateOne({ _id }, { password: hash });
    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.delete("/delete", async (req, res) => {
  let body = req.body;
  try {
    if (!body._id) {
      throw new customError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "validation error",
        "_id must be filled"
      );
    }
    await Users.deleteOne({ _id: body._id });

    await UserRoles.deleteMany({ user_id: body._id });

    res.json(Response.successResponse({ success: true }));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/register", async (req, res) => {
  let body = req.body;
  try {
    let user = await Users.findOne({});
    if (user) {
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
    }
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

    let created_user = await Users.create({
      email: body.email,
      password: hash,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });
    //burada static olarak yapıyoruz nesne oluşturmamıza gerek kalmıyor

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: created_user._id,
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: created_user._id,
    });

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
module.exports = router;
