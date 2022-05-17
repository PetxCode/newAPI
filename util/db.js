const mongoose = require("mongoose");
const url = "mongodb://localhost/testingDB";

module.exports = mongoose.connect(url).then(() => {
	console.log("database connected...!");
});
