var express = require("express");
var router = express.Router();

const isAuthontication = true;

//burada tüm istekleri kontrol ediyoruz ve isAuthontication true ise devam ediyoruz
router.all("*", (req, res, next) => {
  if (isAuthontication) {
    next();
  } else {
    res.json({ success: false, message: "Unauthorized" });
  }
});

router.get("/", (req, res, next) => {
  res.json({ success: true });
});

module.exports = router;
