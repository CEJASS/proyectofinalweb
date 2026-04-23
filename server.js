import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connectDB from "./Db/cnn.js";
import videogameRoutes from "./routes/videogames.js";

const app = express();
const PORT = process.env.PORT || 2999;

connectDB();

app.use(express.json());
app.use(express.static("public"));

app.use("/api/videogames", videogameRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
