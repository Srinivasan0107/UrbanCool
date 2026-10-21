import mongoose from 'mongoose';

const CoolingInitiativeSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, default: '' },
    type:        {
      type: String,
      enum: ['tree_plantation', 'cool_roof', 'reflective_pavement', 'water_body'],
      required: true,
    },
    location:    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    ward:        { type: String, required: true },
    startDate:   { type: Date, required: true },
    beforeTemp:  { type: Number, required: true },
    afterTemp:   { type: Number },
    status:      { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
  },
  { timestamps: true }
);

export default mongoose.model('CoolingInitiative', CoolingInitiativeSchema);
