import http from "http";
import app from "./app.js";

const PORT = process.env.PORT || 4000;
http.createServer(app).listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});