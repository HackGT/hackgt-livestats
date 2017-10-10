import * as path from "path";
import * as fs from "fs";

import * as express from "express";
import * as serveStatic from "serve-static";
import * as compression from "compression";

export let app = express();
app.use(compression());

const PORT = process.env.PORT ? parseInt(process.env.PORT!, 10) : 3000;
const STATIC_ROOT = "./client";

// Throw and show a stack trace on an unhandled Promise rejection instead of logging an unhelpful warning
process.on("unhandledRejection", err => {
	throw err;
});

app.route("/").get((request, response) => {
	fs.createReadStream(path.resolve(STATIC_ROOT, "index.html")).pipe(response);
});

app.use("/js", serveStatic(path.resolve(STATIC_ROOT, "js")));
app.use("/css", serveStatic(path.resolve(STATIC_ROOT, "css")));
app.use("/assets", serveStatic(path.resolve(STATIC_ROOT, "assets")));

app.listen(PORT, () => {
	console.log(`Registration system started on port ${PORT}`);
});
