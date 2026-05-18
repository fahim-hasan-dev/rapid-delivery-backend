import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IParcel } from "./parcel.interface";
import { Parcel } from "./parcel.model";
import { PARCEL_STATUS } from "../../../enum/parcel";
import { notificationQueue } from "../../../queues";
import QueryBuilder from "../../builder/QueryBuilder";
import { trackingService } from "../../../helpers/trackingService";
import { getDistanceAndDuration } from "../../../utils/googleMaps.util";
import { SettingServices } from "../setting/setting.service";
import { redisClient } from "../../../helpers/redis";
import { createPaymentSession } from "../../../stripe/createPaymentSession";
import { JwtPayload } from "jsonwebtoken";
import { NotificationService } from "../notification/notification.service";
import { USER_ROLES } from "../../../enum/user";
import { User } from "../user/user.model";
import { Review } from "../review/review.model";

// Calculates distance and price for a parcel delivery.
const calculateParcelDistanceAndPrice = async (query: Record<string, any>) => {
    const { pickupLat, pickupLng, dropLat, dropLng } = query;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Missing coordinates. Required: pickupLat, pickupLng, dropLat, dropLng."
        );
    }

    const fromLat = Number(pickupLat);
    const fromLng = Number(pickupLng);
    const toLat = Number(dropLat);
    const toLng = Number(dropLng);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Coordinates must be valid numbers.");
    }

    if (fromLat < -90 || fromLat > 90 || toLat < -90 || toLat > 90) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid latitude. Must be between -90 and 90.");
    }

    if (fromLng < -180 || fromLng > 180 || toLng < -180 || toLng > 180) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid longitude. Must be between -180 and 180.");
    }

    const cacheKey = `dist_cache:${fromLat.toFixed(5)}:${fromLng.toFixed(5)}:${toLat.toFixed(5)}:${toLng.toFixed(5)}`;

    const cachedData = await redisClient.get(cacheKey);
    let distanceData;

    if (cachedData) {
        distanceData = JSON.parse(cachedData);
    } else {
        distanceData = await getDistanceAndDuration(
            { lat: fromLat, lng: fromLng },
            { lat: toLat, lng: toLng }
        );
        await redisClient.set(cacheKey, JSON.stringify(distanceData), "EX", 3600);
    }

    const settings = await SettingServices.getSettings();
    if (!settings) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Pricing settings are not configured yet. Please contact support.");
    }

    const perKiloCost = settings.perKiloCost || 0;
    const distanceKm = distanceData.distanceKm;

    const vehicles = {
        motorcycle: {
            baseFare: settings.vehicleBaseFares.motorcycle,
            totalPrice: Math.ceil(settings.vehicleBaseFares.motorcycle + distanceKm * perKiloCost),
        },
        tricycle: {
            baseFare: settings.vehicleBaseFares.tricycle,
            totalPrice: Math.ceil(settings.vehicleBaseFares.tricycle + distanceKm * perKiloCost),
        },
        van: {
            baseFare: settings.vehicleBaseFares.van,
            totalPrice: Math.ceil(settings.vehicleBaseFares.van + distanceKm * perKiloCost),
        },
    };

    return {
        distanceKm,
        duration: distanceData.durationText,
        distanceSource: distanceData.source,
        perKiloCost,
        vehicles,
    };
};

const createParcel = async (payload: IParcel, user: JwtPayload) => {
    // Automatically calculate distance and price before creation
    const calculation = await calculateParcelDistanceAndPrice({
        // GeoJSON format: coordinates = [lng, lat]
        pickupLat: payload.pickupLocation.coordinates[1],
        pickupLng: payload.pickupLocation.coordinates[0],
        dropLat: payload.dropLocation.coordinates[1],
        dropLng: payload.dropLocation.coordinates[0],
    });

    // Get the specific vehicle's data from the calculation results
    const vt = payload.vehicleType.toLowerCase() as keyof typeof calculation.vehicles;
    const vehicleData = calculation.vehicles[vt];

    if (!vehicleData) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid vehicle type: ${payload.vehicleType}`);
    }

    // Override with server-side calculated values for security
    payload.distance = calculation.distanceKm;
    payload.duration = calculation.duration;
    payload.baseFare = vehicleData.baseFare;
    payload.totalDeliveryFee = vehicleData.totalPrice;

    // Fetch settings for commission calculation
    const settings = await SettingServices.getSettings();
    const commissionPercentage = settings?.platformCommissionPercentage || 0;

    // Calculate Breakdown
    payload.platformCommission = Number(((payload.totalDeliveryFee * commissionPercentage) / 100).toFixed(2));
    payload.driverShare = Number((payload.totalDeliveryFee - payload.platformCommission).toFixed(2));

    payload.sender = new Types.ObjectId(user.authId);

    const parcel = await Parcel.create(payload);

    // Create Stripe payment session
    const paymentLink = await createPaymentSession(user, vehicleData.totalPrice, parcel._id.toString());

    return { parcel, paymentLink };
};

const getAllParcels = async (query: Record<string, unknown>) => {
    const parcelQuery = new QueryBuilder(
        Parcel.find().populate({
            path: "sender driver",
            select: "fullName email phone image"
        }),
        query
    )
        .search(["name", "receiverName", "receiverPhone"])
        .filter()
        .sort()
        .paginate()
        .fields();

    // Select specific fields to reduce payload and use lean() for performance
    parcelQuery.modelQuery.select("name itemValue status totalDeliveryFee vehicleType sender driver createdAt").lean();

    const parcels = await parcelQuery.modelQuery;
    const meta = await parcelQuery.getPaginationInfo();

    return { parcels, meta };
};

const getMyParcels = async (
    userId: string,
    role: string,
    query: Record<string, unknown>
) => {
    const filter = role === "driver"
        ? { driver: userId }
        : { sender: userId };

    const parcelQuery = new QueryBuilder(
        Parcel.find(filter).populate({
            path: "sender driver",
            select: "fullName email phone image driverInfo.averageRating driverInfo.totalRating"
        }),
        query
    )
        .filter()
        .search(["name", "receiverName", "receiverPhone","_id"])
        .sort()
        .paginate()
        .fields();

    // Select essential fields for the list view and use lean()
    parcelQuery.modelQuery.select("name status totalDeliveryFee vehicleType pickupLocation.address dropLocation.address deliveryDate createdAt").lean();

    const parcels = await parcelQuery.modelQuery;
    const meta = await parcelQuery.getPaginationInfo();

    return { parcels, meta };
};

const getNearbyParcels = async (
    lat: number,
    lng: number,
    maxDistanceKm: number = 50,
    query: Record<string, unknown>
) => {
    if (!lat || !lng) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Latitude and Longitude are required to find nearby parcels.");
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Calculate start and end of today for filtering deliveryDate
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const matchQuery = {
        status: PARCEL_STATUS.PENDING,
        isDriverAssigned: false,
        deliveryDate: {
            $lte: todayEnd
        }
    };

    const parcels = await Parcel.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distanceFromDriver",
                maxDistance: maxDistanceKm * 1000,
                spherical: true,
                query: matchQuery,
            },
        },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender",
                pipeline: [{ $project: { fullName: 1, image: 1, phone: 1 } }],
            },
        },
        { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                name: 1,
                totalDeliveryFee: 1,
                vehicleType: 1,
                pickupLocation: 1,
                dropLocation: 1,
                distance: 1,
                distanceFromDriver: 1,
                deliveryDate: 1,
                sender: 1,
                status: 1
            }
        }
    ]);

    const totalResult = await Parcel.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distanceFromDriver",
                maxDistance: maxDistanceKm * 1000,
                spherical: true,
                query: matchQuery,
            },
        },
        { $count: "total" },
    ]);

    const total = totalResult[0]?.total || 0;

    return {
        parcels,
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
    };
};

const acceptParcel = async (parcelId: string, driverId: string) => {
    const activeDelivery = await Parcel.findOne({
        driver: driverId,
        status: { $nin: [PARCEL_STATUS.DELIVERED, PARCEL_STATUS.CANCELLED] },
    });

    if (activeDelivery) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "You already have an active delivery. Complete it before accepting a new one."
        );
    }

    const parcel = await Parcel.findById(parcelId);

    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
    }

    if (parcel.status !== PARCEL_STATUS.PENDING) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "This parcel is not available for acceptance. It might not be paid for yet or already handled."
        );
    }

    if (parcel.isDriverAssigned) {
        throw new ApiError(
            StatusCodes.CONFLICT,
            "This parcel has already been accepted by another driver."
        );
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(
        parcelId,
        {
            driver: driverId,
            isDriverAssigned: true,
            status: PARCEL_STATUS.ACCEPTED,
        },
        { new: true }
    ).populate("sender driver");

    // Notify Sender via in-app notification
    await NotificationService.insertNotification({
        receiver: parcel.sender,
        title: "Driver Assigned",
        message: "A driver has accepted your parcel and will pick it up soon!",
        screen: "PARCEL_TRACKING",
        type: USER_ROLES.SENDER
    });

    return updatedParcel;
};

const getSingleParcel = async (id: string) => {
    const parcel = await Parcel.findById(id).populate("sender driver");

    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
    }

    const review = await Review.findOne({ parcel: id });

    // Convert mongoose document to plain object
    const parcelObj = parcel.toObject() as any;

    // Get live driver location from Redis
    const liveLocation = await trackingService.getDriverLocation(id);

    // Attach live location if available
    if (liveLocation) {
        parcelObj.driverLocation = {
            type: "Point",
            coordinates: [liveLocation.lng, liveLocation.lat],
            updatedAt: new Date(liveLocation.timestamp),
        };
    }

    // Attach review
    parcelObj.review = review;

    return parcelObj;
};

const updateParcel = async (
    id: string,
    payload: Partial<IParcel>,
    user: JwtPayload
) => {
    const parcel = await Parcel.findById(id);
    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
    }

    // Role-based security check for drivers
    if (user.role === "driver") {
        if (parcel.driver?.toString() !== user.authId) {
            throw new ApiError(StatusCodes.FORBIDDEN, "You are not assigned to this parcel");
        }

        // Drivers can only update status and note
        const allowedFields = ["status", "note", "pickupProof", "deliveryProof"];
        const keys = Object.keys(payload);
        const isAllowed = keys.every(key => allowedFields.includes(key));
        if (!isAllowed) {
            throw new ApiError(StatusCodes.FORBIDDEN, "Drivers can only update status, note, and proof images.");
        }

        // Enforce mandatory proofs for drivers
        if (payload.status === PARCEL_STATUS.PICKED_UP && !payload.pickupProof) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Pickup proof is required to mark as picked up.");
        }
        if (payload.status === PARCEL_STATUS.DELIVERED && !payload.deliveryProof) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Delivery proof is required to mark as delivered.");
        }

        if (payload.status === PARCEL_STATUS.PICKED_UP) {
            // Flow validation: Cannot pick up if already transit or delivered
            if (parcel.status !== PARCEL_STATUS.ACCEPTED) {
                throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid transition: Cannot pick up a parcel that is currently ${parcel.status.toLowerCase()}`);
            }
            payload.status = PARCEL_STATUS.IN_TRANSIT;
        }

        if (payload.status === PARCEL_STATUS.DELIVERED) {
            // Flow validation: Must be in transit to deliver
            if (parcel.status !== PARCEL_STATUS.IN_TRANSIT) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid transition: Parcel must be picked up before marking as delivered.");
            }
        }
    }

    // Role-based security check for senders
    if (user.role === "sender") {
        if (parcel.sender.toString() !== user.authId) {
            throw new ApiError(StatusCodes.FORBIDDEN, "You do not own this parcel");
        }

        // Senders can only update basic info
        const forbiddenFields = ["name", "pickupLocation", "dropLocation", "itemValue"];
        const keys = Object.keys(payload);
        const hasForbidden = keys.some(key => forbiddenFields.includes(key));
        if (hasForbidden) {
            throw new ApiError(StatusCodes.FORBIDDEN, "Senders cannot update status, driver, or proof images.");
        }
    }

    // Handle status transitions and notifications
    if (payload.status === PARCEL_STATUS.PICKED_UP || payload.status === PARCEL_STATUS.IN_TRANSIT) {
        payload.pickedUpAt = new Date();
        // Notify Sender
        await NotificationService.insertNotification({
            receiver: parcel.sender,
            title: "Parcel Picked Up",
            message: `Your parcel "${parcel.name}" has been picked up and is on the way!`,
            screen: "PARCEL_TRACKING",
            type: USER_ROLES.SENDER
        });
    } else if (payload.status === PARCEL_STATUS.DELIVERED) {
        payload.deliveredAt = new Date();
        // Stop tracking in Redis once delivered
        await trackingService.removeDriverTracking(id, parcel.driver!.toString());

        // Notify Sender
        await NotificationService.insertNotification({
            receiver: parcel.sender,
            title: "Parcel Delivered",
            message: `Great news! Your parcel "${parcel.name}" has been successfully delivered.`,
            screen: "PARCEL_DETAILS",
            type: USER_ROLES.SENDER
        });
    } else if (payload.status === PARCEL_STATUS.CANCELLED) {
        // Notify both if cancelled
        const recipients = [
            { id: parcel.sender, role: USER_ROLES.SENDER },
            ...(parcel.driver ? [{ id: parcel.driver, role: USER_ROLES.DRIVER }] : [])
        ];

        for (const recipient of recipients) {
            await NotificationService.insertNotification({
                receiver: recipient.id,
                title: "Parcel Cancelled",
                message: `The parcel "${parcel.name}" has been cancelled.`,
                screen: "PARCEL_DETAILS",
                type: recipient.role
            });
        }
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).populate("sender driver");

    return updatedParcel;
};

const deleteParcel = async (id: string) => {
    const parcel = await Parcel.findById(id);
    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
    }

    return await Parcel.findByIdAndDelete(id);
};

export const ParcelServices = {
    createParcel,
    getAllParcels,
    getMyParcels,
    getNearbyParcels,
    acceptParcel,
    getSingleParcel,
    calculateParcelDistanceAndPrice,
    updateParcel,
    deleteParcel,
};
