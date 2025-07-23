const CustomError = require("./Error");

class Response {
  static successResponse(data, code = 200) {
    return {
      code,
      data,
    };
  }
  static errorResponse(error) {
    console.log(error.message);
    if (error instanceof CustomError) {
      return {
        code: error.code,
        error: {
          message: error.message,
          data: error.description,
        },
      };
    }

    return {
      code: Enum.HTTP_CODES.INT_SERVER_ERROR,
      error: {
        message: "Unexpected error",
        data: error.message,
      },
    };
  }
}

module.exports = Response;
