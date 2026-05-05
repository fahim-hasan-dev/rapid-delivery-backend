import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IParcel } from "./parcel.interface";
import { Parcel } from "./parcel.model";
import { PARCEL_STATUS } from "../../../enum/parcel";
import { notificationQueue } from "../../../queues";
import QueryBuilder from "../../builder/QueryBuilder";
import { trackingService } from "../../../helpers/trackingService";

const createParcel = async (payload: IParcel) => {
    return await Parcel.create(payload);
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
    updateParcel,
    deleteParcel,
};
