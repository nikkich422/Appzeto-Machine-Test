import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
      default: 'TODO',
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      required: true,
    },
    order: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
    labels: { type: String, default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.projectId = ret.projectId?.toString();
        ret.organizationId = ret.organizationId?.toString();
        ret.creatorId = ret.creatorId?.toString();
        ret.assigneeId = ret.assigneeId ? ret.assigneeId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-Performance indexes for 100k tasks scale
TaskSchema.index({ organizationId: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ organizationId: 1, status: 1 });
TaskSchema.index({ assigneeId: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model('Task', TaskSchema);
