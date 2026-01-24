import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "*"
}));

app.get("/", (req, res) => {
  res.send("OK 🚀");
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Listening on", PORT);
});
