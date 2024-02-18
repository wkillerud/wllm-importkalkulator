import express from "express";
import nokHandler from "./api/nok.js";

const app = express();

app.get("/api/nok", nokHandler);
app.get("/*", express.static("public"));

app.listen(8080);
console.log("Visit http://localhost:8080/");
