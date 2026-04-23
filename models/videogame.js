import mongoose from "mongoose";
const { Schema } = mongoose;

const videogameSchema = new Schema({
    name: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        trim: true,
        minlength: [2, "El nombre debe tener al menos 2 caracteres"],
        maxlength: [80, "El nombre no puede superar 80 caracteres"]
    },
    genre: {
        type: String,
        required: [true, "El género es obligatorio"],
        trim: true,
        minlength: [2, "El género debe tener al menos 2 caracteres"],
        maxlength: [40, "El género no puede superar 40 caracteres"]
    },
    platform: {
        type: String,
        required: [true, "La plataforma es obligatoria"],
        trim: true,
        minlength: [2, "La plataforma debe tener al menos 2 caracteres"],
        maxlength: [40, "La plataforma no puede superar 40 caracteres"]
    },
    calification: {
        type: Number,
        required: [true, "La calificación es obligatoria"],
        min: [1, "La calificación mínima es 1 estrella"],
        max: [5, "La calificación máxima es 5 estrellas"],
        validate: {
            validator: Number.isInteger,
            message: "La calificación debe ser un número entero"
        }
    },
    status: {
        type: String,
        enum: ["pendiente", "en progreso", "completado"],
        default: "pendiente"
    }
}, { timestamps: true });

const Videogame = mongoose.model("Videogame", videogameSchema);
export default Videogame;
