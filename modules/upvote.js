import mongoose from "mongoose";

const Schema = mongoose.Schema;

const upvoteSchema = new Schema({
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    time: { type: Date, required: true },
});

export default mongoose.model("UpVote", upvoteSchema);
