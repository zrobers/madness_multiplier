import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/health", (_, res) => res.json({ ok: true }));

export default app;