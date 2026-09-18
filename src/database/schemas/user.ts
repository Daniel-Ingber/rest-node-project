import { Schema, Document, Model } from "mongoose";
import { type User } from "../../validations/user.ts";
import { nameDBSchema } from "./name.ts";
import { addressDBSchema } from "./address.ts";
import { imageDBSchema } from "./image.ts";
import { ObjectId } from "mongodb";

export type DBUser = User & {
  isAdmin?: boolean;
  createdAt?: Date;
  failedLoginAttempts?: number;
  blockedUntil?: Date | null;
  _id: ObjectId;
};

// Methods For Each Document
export interface IUserDocument extends DBUser, Document {
  setPassword(password: string): Promise<void>;
}

// Methods For The Collection
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument>;
}

export const userDBSchema = new Schema<DBUser, IUserModel>({
  name: { type: nameDBSchema, required: true },
  address: { type: addressDBSchema, required: true },
  image: {
    type: imageDBSchema,
    required: false,
    default: {
      alt: "user-profile",
      url: "https://picsum.photos/200/300",
    },
  },
  phone: {
    type: String,
    minlength: 9,
    maxlength: 15,
    required: true,
  },
  email: {
    type: String,
    minlength: 7,
    maxlength: 250,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minlength: 7,
    select: false,
    maxlength: 100,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: false,
    default: false,
  },
  isBusiness: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    required: false,
    default: Date.now,
  },
  /** Bonus - blocking a user after 3 failed login attempts.
   * Both fields are hidden from every regular query (select: false)
   * and are read only by the login flow itself
   * */
  failedLoginAttempts: {
    type: Number,
    required: false,
    select: false,
    default: 0,
  },
  blockedUntil: {
    type: Date,
    required: false,
    select: false,
    default: null,
  },
});
