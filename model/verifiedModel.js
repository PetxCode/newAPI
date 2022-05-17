const mongoose = require("mongoose");
// const bcrypt = require("bcrypt")
// const jwt = require("jsonwebtoken")

const verifiedModel = mongoose.Schema({
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "users",
	},
	verification: {
		type: String,
	},
});

module.exports = mongoose.model("verifieds", verifiedModel);
