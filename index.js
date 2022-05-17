const express = require("express");
const cors = require("cors");
require("./util/db");

const port = 3356;
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/user", require("./router/userRouters"));
app.use("/api/new_user", require("./router/newRouter"));

app.listen(port, () => {
	console.log("server is up: 3356");
});
