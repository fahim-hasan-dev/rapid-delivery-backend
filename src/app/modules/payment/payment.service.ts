import QueryBuilder from "../../builder/QueryBuilder";
import { IPayment } from "./payment.interface";
import { Payment } from "./payment.model";
import { createPaymentSession } from "../../../stripe/createPaymentSession";
import config from "../../../config";
import { JwtPayload } from "jsonwebtoken";

import { Parcel } from "../parcel/parcel.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { PARCEL_STATUS } from "../../../enum/parcel";

// Create session
const creatSession = async (user: JwtPayload, referenceId: string) => {
  const parcel = await Parcel.findById(referenceId);

  if (parcel?.status !== PARCEL_STATUS.CREATED) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Parcel is not ready for payment");
  }

  if (!parcel) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Parcel not found");
  }

  const url = await createPaymentSession(user, parcel.totalDeliveryFee, parcel._id.toString());

  return { url };
};

// create payment
const createPayment = async (payload: Partial<IPayment>) => {
  const payment = await Payment.create(payload);
  return payment;
};

// get payments
const getPayments = async (query: Record<string, unknown>) => {
  const paymentQueryBuilder = new QueryBuilder(Payment.find(), query)
    .filter()
    .sort()
    .paginate();

  const payments = await paymentQueryBuilder.modelQuery;
  const paginationInfo = await paymentQueryBuilder.getPaginationInfo();

  return {
    data: payments,
    meta: paginationInfo,
  };
};

// get payment by id
const getPaymentById = async (id: string) => {
  return await Payment.findById(id).populate("referenceId");
};

export const PaymentService = {
  creatSession,
  createPayment,
  getPayments,
  getPaymentById,
};
