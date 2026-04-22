import mongoose from "mongoose";
import { platform, type } from "node:os";
const { Schema } = mongoose;


const videogameSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    genre: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    },
    calification: {
        type: Number,
        required: true
    },   
})