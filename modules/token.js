import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const tokenSchema = new Schema({
    createdAt: { type: Date, expires: 3600, default: Date.now },
    username: { type: String, unique: true, index: true, required: true },
    token: { type: String, required: true },
});

export default mongoose.model("Token", tokenSchema);