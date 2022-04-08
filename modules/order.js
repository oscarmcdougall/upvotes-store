import mongoose from "mongoose";

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    commentId: { type: String, required: true },
    email: { type: String, required: false },
    amount: { type: Number, required: true },
});

export default mongoose.model("Order", orderSchema);
