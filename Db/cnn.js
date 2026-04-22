import mongoose from "mongoose";
import dotenv from "dotenv";

// Cargar las variables de entorno
dotenv.config();

// conexion a la base de datos
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error("la conexion no está definida en el env");
    }
    
    await mongoose.connect(mongoURI);
    console.log("conexión exitosa a la DB");
    
  } catch (error) {
    console.error("Error de conexión: ", error.message);
    process.exit(1);
  }
};

export default connectDB;