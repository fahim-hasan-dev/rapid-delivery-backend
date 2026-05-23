import { z } from "zod";
import { PARCEL_STATUS, VEHICLE_TYPE } from "../../../enum/parcel";

const coordinateSchema = z.array(z.number())
    .length(2)
    .refine((coords) => {
        const [lng, lat] = coords;
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    }, {
        message: "Invalid coordinates. Format must be [longitude, latitude]. Longitude must be between -180 and 180, and Latitude must be between -90 and 90."
    });

const createParcelSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Parcel name is required" }),
        itemValue: z.number({ required_error: "Item value is required" }),
        pickupLocation: z.object({
            address: z.string({ required_error: "Pickup address is required" }),
            coordinates: coordinateSchema,
        }),
        dropLocation: z.object({
            address: z.string({ required_error: "Drop address is required" }),
            coordinates: coordinateSchema,
        }),
        vehicleType: z.nativeEnum(VEHICLE_TYPE),
        deliveryDate: z.string({ required_error: "Delivery date and time is required" }),
        receiverName: z.string({ required_error: "Receiver name is required" }),
        receiverPhone: z.string({ required_error: "Receiver phone is required" }),
        note: z.string().optional(),
    }).superRefine((data, ctx) => {
        const val = data.deliveryDate;
        const pureDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const isoWithTimezoneRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

        const today = new Date();
        const inputDate = new Date(val);

        if (pureDateRegex.test(val)) {
            if (isNaN(inputDate.getTime())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid date format.",
                    path: ["deliveryDate"]
                });
                return;
            }

            // Calculate timezone-independent calendar day difference between input date and server UTC date
            const todayUTCZero = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
            const inputUTCZero = Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate());
            const diffDays = Math.round((inputUTCZero - todayUTCZero) / (1000 * 60 * 60 * 24));

            // Permitted as "today" if the calendar day difference is within [-1, 0, 1] to cover all global timezones
            const isTodayGlobally = diffDays === 0 || diffDays === 1 || diffDays === -1;

            if (!isTodayGlobally || diffDays < -1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "For dates other than today, you must provide a full ISO 8601 datetime with a timezone offset (e.g. 2026-05-24T11:20:12+06:00).",
                    path: ["deliveryDate"]
                });
            }
            return;
        }

        if (isoWithTimezoneRegex.test(val)) {
            if (isNaN(inputDate.getTime())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Invalid datetime format.",
                    path: ["deliveryDate"]
                });
                return;
            }

            // Must not be in the past (using a 1-minute buffer for network latency)
            if (inputDate.getTime() < today.getTime() - 60000) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Delivery date and time cannot be in the past.",
                    path: ["deliveryDate"]
                });
            }
            return;
        }

        // If matches neither regex, it is invalid format
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid format. Provide 'YYYY-MM-DD' for today, or a complete 'YYYY-MM-DDTHH:mm:ss+HH:MM' ISO datetime with timezone offset for future dates.",
            path: ["deliveryDate"]
        });
    }),
});

const updateParcelSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        itemValue: z.number().optional(),
        pickupLocation: z.object({
            address: z.string(),
            coordinates: coordinateSchema,
        }).optional(),
        dropLocation: z.object({
            address: z.string(),
            coordinates: coordinateSchema,
        }).optional(),
        vehicleType: z.nativeEnum(VEHICLE_TYPE).optional(),
        deliveryDate: z.string().optional(),
        receiverName: z.string().optional(),
        receiverPhone: z.string().optional(),
        status: z.nativeEnum(PARCEL_STATUS).optional(),
        note: z.string().optional(),
        pickupProof: z.array(z.string()).optional(),
        deliveryProof: z.array(z.string()).optional(),
        estimatedArrival: z.string().optional(),
    }).superRefine((data, ctx) => {
        if (data.deliveryDate) {
            const val = data.deliveryDate;
            const pureDateRegex = /^\d{4}-\d{2}-\d{2}$/;
            const isoWithTimezoneRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

            const today = new Date();
            const inputDate = new Date(val);

            if (pureDateRegex.test(val)) {
                if (isNaN(inputDate.getTime())) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Invalid date format.",
                        path: ["deliveryDate"]
                    });
                    return;
                }

                const todayUTCZero = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
                const inputUTCZero = Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), inputDate.getUTCDate());
                const diffDays = Math.round((inputUTCZero - todayUTCZero) / (1000 * 60 * 60 * 24));

                const isTodayGlobally = diffDays === 0 || diffDays === 1 || diffDays === -1;

                if (!isTodayGlobally || diffDays < -1) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "For dates other than today, you must provide a full ISO 8601 datetime with a timezone offset (e.g. 2026-05-24T11:20:12+06:00).",
                        path: ["deliveryDate"]
                    });
                }
                return;
            }

            if (isoWithTimezoneRegex.test(val)) {
                if (isNaN(inputDate.getTime())) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Invalid datetime format.",
                        path: ["deliveryDate"]
                    });
                    return;
                }

                // Must not be in the past
                if (inputDate.getTime() < today.getTime() - 60000) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Delivery date and time cannot be in the past.",
                        path: ["deliveryDate"]
                    });
                }
                return;
            }

            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid format. Provide 'YYYY-MM-DD' for today, or a complete 'YYYY-MM-DDTHH:mm:ss+HH:MM' ISO datetime with timezone offset for future dates.",
                path: ["deliveryDate"]
            });
        }
    }),
});

const getNearbyParcelsSchema = z.object({
    query: z.object({
        latitude: z.string({ required_error: "Latitude is required in query" }),
        longitude: z.string({ required_error: "Longitude is required in query" }),
        distance: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
    }),
});

export const ParcelValidation = {
    createParcelSchema,
    updateParcelSchema,
    getNearbyParcelsSchema,
};

