"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const public_model_1 = require("./public.model");
const user_model_1 = require("../../../app/modules/user/user.model");
const queues_1 = require("../../../queues");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const emailTemplate_1 = require("../../../shared/emailTemplate");
const createPublic = async (payload) => {
    const isExist = await public_model_1.Public.findOne({
        type: payload.type,
    });
    if (isExist) {
        await public_model_1.Public.findByIdAndUpdate(isExist._id, {
            $set: {
                content: payload.content,
            },
        }, {
            new: true,
        });
    }
    else {
        const result = await public_model_1.Public.create(payload);
        if (!result)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Public');
    }
    return `${payload.type} created successfully}`;
};
const getAllPublics = async (type) => {
    const result = await public_model_1.Public.findOne({ type: type }).lean();
    return result || null;
};
const deletePublic = async (id) => {
    const result = await public_model_1.Public.findByIdAndDelete(id);
    return result;
};
const createContact = async (payload) => {
    try {
        // Find admin user to send notification
        const admin = await user_model_1.User.findOne({ role: 'admin' });
        if (!admin || !admin.email) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Admin user not found');
        }
        const result = await public_model_1.Contact.create(payload);
        if (!result)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Contact');
        // send admin email
        await queues_1.emailQueue.add('send-email', emailTemplate_1.emailTemplate.adminContactNotificationEmail(payload));
        // send user email
        await queues_1.emailQueue.add('send-email', emailTemplate_1.emailTemplate.userContactConfirmationEmail(payload));
        return {
            message: 'Contact form submitted successfully',
        };
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to submit contact form');
    }
};
const getAllContacts = async (query) => {
    const contactQueryBuilder = new QueryBuilder_1.default(public_model_1.Contact.find(), query);
    contactQueryBuilder.paginate();
    const result = await contactQueryBuilder.modelQuery.lean();
    // Get pagination info separately
    const paginationResult = await contactQueryBuilder.getPaginationInfo();
    // Return clean objects without circular references
    return {
        meta: paginationResult,
        result,
    };
};
const createFaq = async (payload) => {
    const result = await public_model_1.Faq.create(payload);
    if (!result)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create Faq');
    return result;
};
const getAllFaqs = async () => {
    const result = await public_model_1.Faq.find({});
    return result || [];
};
const getSingleFaq = async (id) => {
    const result = await public_model_1.Faq.findById(id);
    return result || null;
};
const updateFaq = async (id, payload) => {
    const isExist = await public_model_1.Faq.findById(id);
    if (!isExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Faq not found');
    }
    const result = await public_model_1.Faq.findByIdAndUpdate(id, { $set: payload }, {
        new: true,
    });
    return result;
};
const deleteFaq = async (id) => {
    const isExist = await public_model_1.Faq.findById(id);
    if (!isExist) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Faq not found');
    }
    const result = await public_model_1.Faq.findByIdAndDelete(id);
    return result;
};
exports.PublicServices = {
    createPublic,
    getAllPublics,
    deletePublic,
    createContact,
    createFaq,
    getAllFaqs,
    getSingleFaq,
    updateFaq,
    deleteFaq,
    getAllContacts,
};
