import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    oldValue: { type: String, default: null },
    newValue: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.organizationId = ret.organizationId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

AuditLogSchema.index({ organizationId: 1, timestamp: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
