const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");
const verifiedModel = require("../model/verifiedModel");
const express = require("express");
const router = express.Router();

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

		res.status(200).json({
			message: "success",
			data: user,
		});
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/create", async (req, res) => {
	try {
		const { userName, password, email } = req.body;

		const salt = await bcrypt.genSalt(10);
		const hashed = await bcrypt.hash(password, salt);

		const user = await userModel.create({
			email,
			userName,
			password: hashed,
		});

		const token = await verifiedModel.create({
			userID: user._id,
			verification: crypto.randomBytes(64).toString("hex"),
		});

		const mailOptions = {
			from: "no-reply@test.com",
			to: email,
			subject: "Please complete your registration",
			html: `<h3>
            Thank you for registring for our services, to complete your registration, please follow the <a
            href="http://localhost:3356/api/user/${token.userID}/verified/${token.verification}"
            >Link</a> to finish up your registration!
            </h3>`,
		};

		transport.sendMail(mailOptions, (err, info) => {
			if (err) {
				console.log(err.message);
			} else {
				console.log("message send", info.response);
			}
		});

		res.status(201).json({ message: "check your Email" });
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.get("/:id/verified/:token", async (req, res) => {
	try {
		const user = await userModel.findById(req.params.id);

		if (user) {
			const token = await verifiedModel.findOne({
				userID: req.params.id,
				verification: req.params.token,
			});

			if (token) {
				await userModel.findByIdAndUpdate(
					user._id,
					{
						_id: user._id,
						verified: true,
					},
					{ new: true }
				);
				await verifiedModel.findByIdAndDelete(user._id);

				res.status(200).json({ message: "Your account has been Verified" });
			} else {
				res.status(404).json({ message: "failed" });
			}
		} else {
			res.status(404).json({ message: "failed" });
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
			if (user.verified) {
				const checkPassword = await bcrypt.compare(password, user.password);

				if (checkPassword) {
					const token = jwt.sign(
						{
							_id: user._id,
							email: user.email,
						},
						"AverySimpleSecrete",
						{ expiresIn: "2d" }
					);

					const { password, ...info } = user._doc;

					res.status(201).json({ message: "done", data: { token, ...info } });
				} else {
					res.status(404).json({
						message: "user can't be found",
					});
				}
			} else {
				const token = await verifiedModel.create({
					userID: user._id,
					verification: crypto.randomBytes(64).toString("hex"),
				});

				const mailOptions = {
					from: "no-reply@test.com",
					to: email,
					subject: "Please complete your registration",
					html: `<h3>
            Thank you for registring for our services, to complete your registration, please follow the <a
            href="http://localhost:3356/api/user/${token.userID}/verified/${token.verification}"
            >Link</a> to finish up your registration!
            </h3>`,
				};

				transport.sendMail(mailOptions, (err, info) => {
					if (err) {
						console.log(err.message);
					} else {
						console.log("message send", info.response);
					}
				});

				res.status(201).json({ message: "check your Email for verification" });
			}
		} else {
			res.status(404).json({
				message: "user can't be found",
			});
		}
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/reset", async (req, res) => {
	try {
		const { email } = req.body;

		const user = await userModel.findOne({ email });

		if (user) {
			const value = crypto.randomBytes(32).toString("hex");

			const token = jwt.sign({ value }, "This_is_it", { expiresIn: "20m" });

			const mailOptions = {
				from: "no-reply@test.com",
				to: email,
				subject: "Please complete your registration",
				html: `<h3>
        Thank you for registring for our services, to complete yourpassword reset request, please follow the <a
        href="http://localhost:3356/api/user/${user._id}/reset/${token}"
        >Link</a> to finish up your registration!
        </h3>`,
			};

			transport.sendMail(mailOptions, (err, info) => {
				if (err) {
					console.log(err.message);
				} else {
					console.log("mail sent for Password check", info.response);
				}
			});

			res.send("check your email for Password reset");
		} else {
			res.status(404).json({
				message: "user can't be found",
			});
		}
	} catch (err) {
		res.status(404).json({
			message: err.message,
		});
	}
});

router.post("/updated", async (req, res) => {
	try {
		const { password, email } = req.body;

		const user = await userModel.findOne({ email });

		if (user) {
			const newUser = await userModel.findByIdAndUpdate(
				user._id,
				{
					password: password,
				},
				{ new: true }
			);

			res.status(201).json({ message: "change done", data: newUser });
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
