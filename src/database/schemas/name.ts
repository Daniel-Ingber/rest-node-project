import { Schema } from "mongoose";
import { type Name } from "../../validations/name.ts";

export const nameDBSchema = new Schema<Name>({
  first: {
    type: String,
    minlength: 2,
    maxlength: 20,
    required: true,
  },
  middle: {
    type: String,
    minlength: 0,
    maxlength: 20,
    required: false,
    default: "",
  },
  last: {
    type: String,
    minlength: 2,
    maxlength: 20,
    required: true,
  },
});
