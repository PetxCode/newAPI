const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");
const verifiedModel = require("../model/verifiedModel");
const express = require("express");
const router = express.Router();

const myURL = "http://localhost:3356";

const transport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "ajmarketplace52@gmail.com",
		pass: "ajmarketplace",
	},
});

router.get("/", async (req, res) => {
	try {
		const user = await userModel.find();
		res.json({ message: "all users", data: user });
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/createUser", async (req, res) => {
	try {
		const { userName, email, password } = req.body;

		const salt = await bcrypt.genSalt(10);
		const hashed = await bcrypt.hash(password, salt);

		const user = await userModel.create({ email, userName, password: hashed });

		const cryptValue = crypto.randomBytes(32).toString("hex");
		const tokenValue = jwt.sign({ cryptValue }, "MySecret", {
			expiresIn: "20m",
		});

		const checkToken = await verifiedModel.create({
			userID: user._id,
			verification: tokenValue,
		});

		const mailOptions = {
			from: "no-reply@test.com",
			to: email,
			subject: "Please complete your registration",
			html: `<h3>
            With this <a
            href="${myURL}/api/new_user/${checkToken.userID}/${checkToken.verification}"
            >Link</a> you can finished up your registration!
            </h3>`,
		};

		transport.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.log("error");
			} else {
				console.log("message has been sent", info.response);
			}
		});

		res.send("Email has been send, check your Email");
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.get("/:id/:token", async (req, res) => {
	try {
		const user = await userModel.findById(req.params.id);
		if (user) {
			const checkToken = await verifiedModel.findOne({
				userID: req.params.id,
				verification: req.params.token,
			});

			if (checkToken) {
				await userModel.findByIdAndUpdate(
					req.params.id,
					{ _id: user._id, verified: true },
					{ new: true }
				);
				await verifiedModel.findByIdAndDelete(req.params.id);

				res.status(201).json({
					message: "your email is now verified... you can sign in now!",
				});
			} else {
				res.status(404).json({
					message: "user can't be found'",
				});
			}
		} else {
			res.status(404).json({
				message: "user can't be found'",
			});
		}
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/signin", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await userModel.findOne({ email });

		if (user) {
			const checkPassword = await bcrypt.compare(password, user.password);

			if (checkPassword) {
				if (user.verified) {
					const token = jwt.sign({ _id: user._id }, "letsDoThis", {
						expiresIn: "90m",
					});

					const { password, ...info } = user._doc;
					res
						.status(201)
						.json({ message: "welcome back", data: { token, ...info } });
				} else {
					const cryptValue = crypto.randomBytes(32).toString("hex");
					const tokenValue = jwt.sign({ cryptValue }, "MySecret", {
						expiresIn: "20m",
					});

					const mailOptions = {
						from: "no-reply@test.com",
						to: email,
						subject: "Please complete your registration",
						html: `<h3>
    With this <a
    href="${myURL}/api/new_user/${user._id}/${tokenValue}"
    >Link</a> you can finished up your registration!
    </h3>`,
					};

					transport.sendMail(mailOptions, (err, info) => {
						if (err) {
							console.log("error");
						} else {
							console.log("message has been sent", info.response);
						}
					});

					res.send("Email has been send, check your Email");
				}
			} else {
				res.status(404).json({ message: "failed password input" });
			}
		} else {
			res.status(404).json({ message: "failed user input" });
		}
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/forgot_password", async (req, res) => {
	const { email } = req.body;
	const user = await userModel.findOne({ email });

	if (user) {
		if (user.verified) {
			const cryptValue = crypto.randomBytes(32).toString("hex");

			await userModel.findByIdAndUpdate(
				user._id,
				{ resetLink: cryptValue },
				{ new: true }
			);

			const tokenValue = jwt.sign({ cryptValue }, "resetPassword", {
				expiresIn: "20m",
			});

			const mailOptions = {
				from: "no-reply@test.com",
				to: email,
				subject: "Request for Password Reset",
				html: `<h3>
        With this <a
        href="${myURL}/api/new_user/reset/${user._id}/${tokenValue}"
        >Link</a> your password request can be done!
        </h3>`,
			};

			transport.sendMail(mailOptions, (err, info) => {
				if (err) {
					console.log("error");
				} else {
					console.log("message has been sent", info.response);
				}
			});

			res.json({
				message:
					"Email has been send, check your Email to compelete password reset!",
			});
		} else {
			res.status(404).json({ message: "your email hasn't be verified" });
		}
	} else {
		res.status(404).json({ message: "failed user" });
	}

	try {
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/reset/:id/:token", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await userModel.findById(req.params.id);
		if (user) {
			if (user.resetLink) {
				const salt = await bcrypt.genSalt(10);
				const hashed = await bcrypt.hash(password, salt);
				user.password;
				newResetLink = user.resetLink;

				await userModel.findByIdAndUpdate(
					user._id,
					{ password: hashed, resetLink: req.params.token },
					{ new: true }
				);

				res.status(201).json({
					message:
						"password has been change, you can sign in now with your new Password!",
				});
			} else {
				res.status(404).json({ message: "invelid token" });
			}
		} else {
			res.status(404).json({ message: "failed user" });
		}
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

// router.get("/", async (req, res) => {
// 	try {
// 	} catch (err) {
// 		res.status(404).json({
// 			message: err.message,
// 		});
// 	}
// });

module.exports = router;
