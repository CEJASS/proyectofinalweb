import mongoose from "mongoose";
import { type } from "node:os";
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        required: true,
        unique: true
    },

    game_list: [{
        game_id: {
            type: Schema.Types.ObjectId,
            ref: "VideoGame",
            required: true
        },
        state: {
            type: String,
            enum: ["completado", "en progreso", "pendiente"],
            default: "pendiente"
        }
    }]
})

const User = mongoose.model("User", userSchema);
export default User;