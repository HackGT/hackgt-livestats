import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import * as WebSocket from "ws";
import * as Influx from "influx";

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

const influx = new Influx.InfluxDB({
	host: process.env.INFLUX_URL || 'localhost',
	database: 'metrics',
	schema: [
		{
			measurement: 'https://checkin.hack.gt',
			fields: {
				value: Influx.FieldType.INTEGER
			},
			tags: [
				'check_in',
				'checked_in_by',
				'checkinTag',
				'email',
				'id',
				'name'
			]
		}
	]
});

const server = http.createServer(app);
export const wss = new WebSocket.Server({ server });
const usersAlreadySeen: string[] = [];

wss.on("connection", connection => {
	connection.send(JSON.stringify({
		"type": "count",
		"count": 0
	}));
	connection.send(JSON.stringify({
		"type": "users",
		"count": usersAlreadySeen
	}));
});

function getInfluxData() {
	influx.query('SELECT count("value") FROM "https://checkin.hack.gt" GROUP BY "name";').then((data: any) => {
		let count = data.length;
		let newUsers = [];
		for (let user of data) {
			if (usersAlreadySeen.indexOf(user.name) === -1) {
				usersAlreadySeen.push(user.name);
				newUsers.push(user.name);
			}
		}
		console.log(newUsers);
		for (let socket of wss.clients) {
			socket.send(JSON.stringify({
				"type": "count",
				"count": count
			}));
			socket.send(JSON.stringify({
				"type": "users",
				"users": newUsers
			}));
		}
	}).catch((err) => {
		console.error(err);
	});
}
setInterval(getInfluxData, 5000);
server.listen(PORT, () => {
	console.log(`Registration system started on port ${PORT}`);
});
