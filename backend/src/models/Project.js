import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.organizationId = ret.organizationId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ProjectSchema.index({ organizationId: 1 });
ProjectSchema.index({ createdAt: -1 });

export const Project = mongoose.model('Project', ProjectSchema);
