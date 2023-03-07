const express = require("express");
const router = express.Router();
const { createUser,getUser, showAvatar,removeAvatar} = require("./controller/userController");

router.get("/", (req, res) => {
  res.send("Index page!");
});

router.post("/user/", createUser);
router.get("/user/:userId", getUser);
router.get("/user/:userId/avatar", showAvatar);
router.delete("/user/:userId/avatar", removeAvatar);

module.exports = router;