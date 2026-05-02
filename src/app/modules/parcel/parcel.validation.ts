import { z } from "zod";
import { PARCEL_STATUS, VEHICLE_TYPE } from "../../../enum/parcel";

const createParcelSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" }),
        itemValue: z.number({ required_error: "Item value is required" }),
        pickupLocation: z.object({
            address: z.string({ required_error: "Pickup address is required" }),
            coordinates: z.array(z.number()).length(2, "Coordinates must be [latitude, longitude]"),
        }),
        dropLocation: z.object({
            address: z.string({ required_error: "Drop address is required" }),
            coordinates: z.array(z.number()).length(2, "Coordinates must be [latitude, longitude]"),
        }),
        vehicleType: z.nativeEnum(VEHICLE_TYPE),
        distance: z.number({ required_error: "Distance is required" }),
        baseFare: z.number({ required_error: "Base fare is required" }),
        totalPrice: z.number({ required_error: "Total price is required" }),
        paymentId: z.string().optional(),
        deliveryDate: z.string({ required_error: "Delivery date is required" }),
        receiverName: z.string({ required_error: "Receiver name is required" }),
        receiverPhone: z.string({ required_error: "Receiver phone is required" }),
        note: z.string().optional(),
    }),
});

const updateParcelSchema = z.object({
    body: z.object({
        status: z.nativeEnum(PARCEL_STATUS).optional(),
        isDriverAssigned: z.boolean().optional(),
        driver: z.string().optional(),
        pickupProof: z.array(z.string()).optional(),
        deliveryProof: z.array(z.string()).optional(),
        note: z.string().optional(),
    }),
});

export const ParcelValidation = {
    createParcelSchema,
    updateParcelSchema,
};
