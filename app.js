require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/connect");
const router = require("./routes/index");
const notFound = require("./middleware/notFound");
const app = express();
const PORT = process.env.PORT || 80;

// middleware
app.use(
	cors({
		origin: "*",
		credentials: "true",
		methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
	}),
);
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/api", router);
app.use(notFound);

// start server
const start = async () => {
	try {
		// await connectDB(process.env.MONGO_URI);
		app.listen(PORT, () => {
			console.log(`Server is listening on port ${PORT}...`);
		});
	} catch (error) {
		console.log(error.message);
	}
};

start();
