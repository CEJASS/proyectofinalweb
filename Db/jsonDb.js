/**
 * Motor de base de datos JSON — reemplaza MongoDB/Mongoose.
 * Guarda todos los datos en un archivo .json en disco.
 * No requiere instalación de ningún software externo.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

class JsonStore {
    constructor(name) {
        this.filePath = join(__dirname, `${name}.json`);
        if (!existsSync(this.filePath)) {
            writeFileSync(this.filePath, "[]", "utf-8");
        }
    }

    _read() {
        return JSON.parse(readFileSync(this.filePath, "utf-8"));
    }

    _write(data) {
        writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    }

    findAll(filter = {}) {
        let data = this._read();
        for (const [k, v] of Object.entries(filter)) {
            data = data.filter((d) => d[k] === v);
        }
        return data;
    }

    findById(id) {
        return this._read().find((d) => d._id === id) || null;
    }

    create(data) {
        const now = new Date().toISOString();
        const record = { _id: randomUUID(), ...data, createdAt: now, updatedAt: now };
        const all = this._read();
        all.push(record);
        this._write(all);
        return record;
    }

    update(id, data) {
        const all = this._read();
        const idx = all.findIndex((d) => d._id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
        this._write(all);
        return all[idx];
    }

    remove(id) {
        const all = this._read();
        const idx = all.findIndex((d) => d._id === id);
        if (idx === -1) return null;
        const deleted = all[idx];
        all.splice(idx, 1);
        this._write(all);
        return deleted;
    }

    count() {
        return this._read().length;
    }

    avgField(field) {
        const data = this._read();
        const values = data.map((d) => d[field]).filter((v) => typeof v === "number");
        if (!values.length) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
}

/**
 * Crea un "modelo" con la misma API que Mongoose:
 *   Model.find(filter).sort(...)
 *   Model.findById(id)
 *   Model.countDocuments()
 *   Model.aggregate([...])
 *   Model.findByIdAndUpdate(id, data, opts)
 *   Model.findByIdAndDelete(id)
 *   new Model(data) → doc con .save()
 */
export function createModel(name, validate, applyDefaults) {
    const store = new JsonStore(name);

    class Document {
        constructor(data) {
            Object.assign(this, data);
        }

        async save() {
            // Aplicar defaults antes de validar
            const data = applyDefaults({ ...this });
            const errors = validate(data);
            if (errors.length) {
                const err = new Error(errors[0]);
                err.errors = errors;
                throw err;
            }
            const saved = store.create(data);
            Object.assign(this, saved);
            return this;
        }
    }

    // API estática del modelo
    Document.find = (filter = {}) => {
        const results = store.findAll(filter);
        return {
            sort(sortObj) {
                const [field, order] = Object.entries(sortObj)[0];
                results.sort((a, b) =>
                    order === -1
                        ? new Date(b[field]) - new Date(a[field])
                        : new Date(a[field]) - new Date(b[field])
                );
                return Promise.resolve(results);
            },
        };
    };

    Document.countDocuments = async () => store.count();

    Document.aggregate = async (pipeline) => {
        // Soporte para $group con $avg (usado en /stats)
        const groupStage = pipeline.find((s) => s.$group);
        if (groupStage) {
            const avgDef = groupStage.$group.avg;
            if (avgDef && avgDef.$avg) {
                const field = String(avgDef.$avg).replace("$", "");
                return [{ _id: null, avg: store.avgField(field) }];
            }
        }
        return [];
    };

    Document.findById = async (id) => store.findById(id);

    Document.findByIdAndUpdate = async (id, data, opts = {}) => {
        const existing = store.findById(id);
        if (!existing) return null;

        const merged = applyDefaults({ ...existing, ...data });

        if (opts.runValidators) {
            const errors = validate(merged);
            if (errors.length) {
                const err = new Error(errors[0]);
                err.errors = errors;
                throw err;
            }
        }
        return store.update(id, merged);
    };

    Document.findByIdAndDelete = async (id) => store.remove(id);

    return Document;
}
