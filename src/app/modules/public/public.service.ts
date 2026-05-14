import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IFaq, IPublic } from './public.interface'
import { Faq, Public } from './public.model'
import { User } from '../../../app/modules/user/user.model'
import { emailQueue } from '../../../queues'
import QueryBuilder from '../../builder/QueryBuilder'
import { emailTemplate } from '../../../shared/emailTemplate'

const createPublic = async (payload: IPublic) => {
  const isExist = await Public.findOne({
    type: payload.type,
  })
  if (isExist) {
    await Public.findByIdAndUpdate(
      isExist._id,
      {
        $set: {
          content: payload.content,
        },
      },
      {
        new: true,
      },
    )
  } else {
    const result = await Public.create(payload)
    if (!result)
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Public')
  }

  return `${payload.type} created successfully}`
}

const getAllPublics = async (
  type: 'privacy-policy' | 'terms-and-condition',
) => {
  const result = await Public.findOne({ type: type }).lean()
  return result || null
}

const deletePublic = async (id: string) => {
  const result = await Public.findByIdAndDelete(id)
  return result
}

const createFaq = async (payload: IFaq) => {
  const result = await Faq.create(payload)
  if (!result)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create Faq')
  return result
}

const getAllFaqs = async () => {
  const result = await Faq.find({})
  return result || []
}

const getSingleFaq = async (id: string) => {
  const result = await Faq.findById(id)
  return result || null
}

const updateFaq = async (id: string, payload: Partial<IFaq>) => {
  const isExist = await Faq.findById(id)
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Faq not found')
  }
  const result = await Faq.findByIdAndUpdate(
    id,
    { $set: payload },
    {
      new: true,
    },
  )
  return result
}

const deleteFaq = async (id: string) => {
  const isExist = await Faq.findById(id)
  if (!isExist) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Faq not found')
  }
  const result = await Faq.findByIdAndDelete(id)
  return result
}

export const PublicServices = {
  createPublic,
  getAllPublics,
  deletePublic,
  createFaq,
  getAllFaqs,
  getSingleFaq,
  updateFaq,
  deleteFaq,
}
