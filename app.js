const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const busboy = require("connect-busboy");
const busboyBodyParser = require("busboy-body-parser");

const leaderboardRouter = require("./routes/leaderboard");

const app = express();

// view engine setup (ejs)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//  various setup commands
app.use(busboy());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

//  set static folder
app.use(express.static(path.join(__dirname, "public")));

//  setup routes
app.use("/", leaderboardRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;