import { Router } from "express";
import Videogame from "../models/videogame.js";

const router = Router();

// GET todos (con filtro opcional por status)
router.get("/", async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const games = await Videogame.find(filter).sort({ createdAt: -1 });
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET estadísticas
router.get("/stats", async (req, res) => {
    try {
        const total = await Videogame.countDocuments();
        const result = await Videogame.aggregate([
            { $group: { _id: null, avg: { $avg: "$calification" } } }
        ]);
        const avg = result.length ? result[0].avg.toFixed(1) : 0;
        res.json({ total, avg });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET uno
router.get("/:id", async (req, res) => {
    try {
        const game = await Videogame.findById(req.params.id);
        if (!game) return res.status(404).json({ message: "No encontrado" });
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST crear
router.post("/", async (req, res) => {
    try {
        const game = new Videogame(req.body);
        const saved = await game.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT actualizar
router.put("/:id", async (req, res) => {
    try {
        const updated = await Videogame.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updated) return res.status(404).json({ message: "No encontrado" });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE eliminar
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Videogame.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "No encontrado" });
        res.json({ message: "Eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
