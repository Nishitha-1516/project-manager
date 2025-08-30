import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

projectSchema.pre('save', function(next) {
  if (this.isNew) {
    this.members.push(this.owner);
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;