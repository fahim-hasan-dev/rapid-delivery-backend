import { PARCEL_STATUS } from "../../../enum/parcel";
import { Parcel } from "../parcel/parcel.model";
import { Types } from "mongoose";

const getDriverStats = async (driverId: string) => {
    const id = new Types.ObjectId(driverId);
    const now = new Date();

    // today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // week start (Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // month start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const aggregateStats = async (startDate?: Date) => {
        const matchQuery: any = {
            driver: id,
            status: PARCEL_STATUS.DELIVERED
        };

        if (startDate) {
            matchQuery.deliveredAt = { $gte: startDate, $lte: todayEnd };
        }

        const result = await Parcel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    earnings: { $sum: "$driverShare" }
                }
            }
        ]);

        return {
            count: result[0]?.count || 0,
            earnings: result[0]?.earnings || 0
        };
    };

    const [today, week, month, total] = await Promise.all([
        aggregateStats(todayStart),
        aggregateStats(weekStart),
        aggregateStats(monthStart),
        aggregateStats()
    ]);

    return {
        todaysEarning: today.earnings,
        todayDeliverdParcel: today.count,
        thisWeekEarning: week.earnings,
        thisWeekDelivery: week.count,
        thisMonthEarning: month.earnings,
        thisMonthDelivery: month.count,
        totalEarning: total.earnings,
        totalDelivered: total.count
    };
};

export const DriverStatsService = {
    getDriverStats
};
