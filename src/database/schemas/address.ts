import { Schema } from "mongoose";
import { type Address } from "../../validations/address.ts";

export const addressDBSchema = new Schema<Address>({
  city: {
    type: String,
    minlength: 2,
    maxlength: 50,
    required: true,
  },
  state: {
    type: String,
    minlength: 2,
    maxlength: 255,
    required: false,
    default: "",
  },
  country: {
    type: String,
    minlength: 2,
    maxlength: 50,
    required: true,
  },
  street: {
    type: String,
    minlength: 2,
    maxlength: 100,
    required: true,
  },
  zip: {
    type: String,
    maxlength: 30,
    required: false,
    default: "",
  },
  houseNumber: {
    type: Number,
    min: 1,
    max: 9999,
    required: true,
  },
});
