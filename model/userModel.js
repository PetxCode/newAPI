const mongoose = require("mongoose");
// const bcrypt = require("bcrypt")
// const jwt = require("jsonwebtoken")

const userModel = mongoose.Schema({
	userName: {
		type: String,
	},
	email: {
		type: String,
		unique: true,
		// 	trim: true,
		// 	toLower: true,
	},
	password: {
		type: String,
	},
	resetLink: {
		type: String,
	},
	verified: {
		type: Boolean,
	},
});

module.exports = mongoose.model("users", userModel);
