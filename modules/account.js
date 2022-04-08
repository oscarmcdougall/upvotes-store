import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const accountSchema = new Schema({
    username: { type: String, unique: true, index: true, required: true },
    password: { type: String, required: true },
});

export default mongoose.model("Account", accountSchema);