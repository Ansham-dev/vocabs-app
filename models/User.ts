import { Schema, models, model } from "mongoose";

export interface IUser {
  email: string;
  // Null for OAuth-only users (Step 5 may use NextAuth). Set for credentials/JWT.
  passwordHash?: string | null;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null, select: false },
    name: { type: String, default: null, trim: true },
    image: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
export default User;
