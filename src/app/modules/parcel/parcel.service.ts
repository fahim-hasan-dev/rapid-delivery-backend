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

const createParcel = async (payload: IParcel, user: JwtPayload) => {
    // Automatically calculate distance and price before creation
    const calculation = await calculateParcelDistanceAndPrice(
        payload.pickupLocation.coordinates[0],
        payload.pickupLocation.coordinates[1],
        payload.dropLocation.coordinates[0],
        payload.dropLocation.coordinates[1]
    );

    // Get the specific vehicle's data from the calculation results
    const vt = payload.vehicleType.toLowerCase() as keyof typeof calculation.vehicles;
    const vehicleData = calculation.vehicles[vt];

    if (!vehicleData) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid vehicle type: ${payload.vehicleType}`);
    }

    // Override with server-side calculated values for security
    payload.distance = calculation.distance;
    payload.baseFare = vehicleData.baseFare;
    payload.totalPrice = vehicleData.totalPrice;
    payload.sender = new Types.ObjectId(user.authId);

    const parcel = await Parcel.create(payload);

    // Create Stripe payment session
    const paymentLink = await createPaymentSession(user, parcel.totalPrice, parcel._id.toString());

    return { parcel, paymentLink };
};

const getAllParcels = async (query: Record<string, unknown>) => {
    const parcelQuery = new QueryBuilder(Parcel.find().populate("sender driver"), query)
        .search(["name", "receiverName", "receiverPhone"])
        .filter()
        .sort()
        .paginate()
        .fields();

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
        Parcel.find(filter).populate("sender driver"),
        query
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    const parcels = await parcelQuery.modelQuery;
    const meta = await parcelQuery.getPaginationInfo();

    return { parcels, meta };
};

const getNearbyParcels = async (
    lat: number,
    lng: number,
    maxDistanceKm: number = 10,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const parcels = await Parcel.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distanceFromDriver",
                maxDistance: maxDistanceKm * 1000,
                spherical: true,
                query: {
                    status: PARCEL_STATUS.PENDING,
                    isDriverAssigned: false,
                },
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
                pipeline: [{ $project: { password: 0, authentication: 0 } }],
            },
        },
        { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
    ]);

    const totalResult = await Parcel.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distanceFromDriver",
                maxDistance: maxDistanceKm * 1000,
                spherical: true,
                query: {
                    status: PARCEL_STATUS.PENDING,
                    isDriverAssigned: false,
                },
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
        status: { $in: [PARCEL_STATUS.PICKED_UP, PARCEL_STATUS.IN_TRANSIT] },
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

    await notificationQueue.add("parcel-accepted", {
        userId: parcel.sender.toString(),
        title: "Driver Assigned",
        body: "A driver has accepted your parcel and will pick it up soon!",
        data: {
            referenceId: parcelId,
            screen: "PARCEL_TRACKING",
            type: "DRIVER_ASSIGNED",
        },
    });

    return updatedParcel;
};

const getSingleParcel = async (id: string) => {
    const parcel = await Parcel.findById(id).populate("sender driver");
    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
    }

    // Merge Redis location if available (Cache-Aside pattern)
    const liveLocation = await trackingService.getDriverLocation(id);
    if (liveLocation) {
        const parcelObj = parcel.toObject() as any;
        parcelObj.driverLocation = {
            coordinates: [liveLocation.lat, liveLocation.lng],
            updatedAt: new Date(liveLocation.timestamp),
        };
        return parcelObj;
    }

    return parcel;
};

const calculateParcelDistanceAndPrice = async (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
) => {
    // Round coordinates to 5 decimal places for consistent cache keys
    const cacheKey = `dist_cache:${fromLat.toFixed(5)}:${fromLng.toFixed(5)}:${toLat.toFixed(5)}:${toLng.toFixed(5)}`;

    // 1. Try to get from Redis Cache
    const cachedData = await redisClient.get(cacheKey);
    let distanceData;

    if (cachedData) {
        distanceData = JSON.parse(cachedData);
    } else {
        // 2. If not in cache, call Google Maps
        distanceData = await getDistanceAndDuration(
            { lat: fromLat, lng: fromLng },
            { lat: toLat, lng: toLng }
        );

        if (!distanceData) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Could not calculate distance. Please check your coordinates."
            );
        }

        // 3. Store in Redis (1 hour TTL)
        await redisClient.set(cacheKey, JSON.stringify(distanceData), "EX", 3600);
    }

    const settings = await SettingServices.getSettings();
    if (!settings) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Settings not found.");
    }

    const perKiloCost = settings.perKiloCost || 0;
    const distance = distanceData.distanceKm;

    // Calculate price for each vehicle type
    const vehicles = {
        motorcycle: {
            baseFare: settings.vehicleBaseFares.motorcycle,
            totalPrice: Math.ceil(settings.vehicleBaseFares.motorcycle + distance * perKiloCost),
        },
        tricycle: {
            baseFare: settings.vehicleBaseFares.tricycle,
            totalPrice: Math.ceil(settings.vehicleBaseFares.tricycle + distance * perKiloCost),
        },
        van: {
            baseFare: settings.vehicleBaseFares.van,
            totalPrice: Math.ceil(settings.vehicleBaseFares.van + distance * perKiloCost),
        },
    };

    return {
        distance,
        duration: distanceData.durationText,
        perKiloCost,
        vehicles,
    };
};

const updateParcel = async (id: string, payload: Partial<IParcel>) => {
    const parcel = await Parcel.findById(id);
    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

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
