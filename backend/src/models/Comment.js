import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.taskId = ret.taskId?.toString();
        ret.userId = ret.userId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CommentSchema.index({ taskId: 1 });
CommentSchema.index({ userId: 1 });

export const Comment = mongoose.model('Comment', CommentSchema);
