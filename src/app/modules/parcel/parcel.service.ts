import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { IParcel } from "./parcel.interface";
import { Parcel } from "./parcel.model";
import QueryBuilder from "../../builder/QueryBuilder";

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

    return {
        parcels,
        meta,
    };
};

const getSingleParcel = async (id: string) => {
    const parcel = await Parcel.findById(id).populate("sender driver");
    if (!parcel) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
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
    getSingleParcel,
    updateParcel,
    deleteParcel,
};
