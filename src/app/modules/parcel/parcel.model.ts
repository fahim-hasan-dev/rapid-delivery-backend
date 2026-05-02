import mongoose, { Schema } from "mongoose";
import { IParcel } from "./parcel.interface";
import { PARCEL_STATUS, VEHICLE_TYPE } from "../../../enum/parcel";

const ParcelSchema = new Schema<IParcel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        itemValue: {
            type: Number,
            required: true,
        },
        pickupLocation: {
            address: { type: String, required: true },
            coordinates: { type: [Number], required: true },
        },
        dropLocation: {
            address: { type: String, required: true },
            coordinates: { type: [Number], required: true },
        },
        vehicleType: {
            type: String,
            enum: Object.values(VEHICLE_TYPE),
            required: true,
        },
        distance: {
            type: Number,
            required: true,
        },
        baseFare: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        paymentId: {
            type: String,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        deliveryDate: {
            type: Date,
            required: true,
        },
        receiverName: {
            type: String,
            required: true,
            trim: true,
        },
        receiverPhone: {
            type: String,
            required: true,
        },
        isDriverAssigned: {
            type: Boolean,
            default: false,
        },
        driver: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: Object.values(PARCEL_STATUS),
            default: PARCEL_STATUS.PENDING,
        },
        note: {
            type: String,
            default: "",
        },
        pickupProof: {
            type: [String],
            default: [],
        },
        deliveryProof: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
    }
);

export const Parcel = mongoose.model<IParcel>("Parcel", ParcelSchema);
