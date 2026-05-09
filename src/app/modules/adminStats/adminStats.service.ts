import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { Parcel } from '../parcel/parcel.model';
import { USER_ROLES } from '../../../enum/user';
import { PARCEL_STATUS } from '../../../enum/parcel';

const getAdminDashboardStats = async (year: number) => {
    // 1. Basic Stats (Top Cards)
    const totalRevenueResult = await Payment.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const totalUsers = await User.countDocuments({ role: USER_ROLES.SENDER });
    const totalDrivers = await User.countDocuments({ role: USER_ROLES.DRIVER });
    const totalDelivery = await Parcel.countDocuments({ status: PARCEL_STATUS.DELIVERED });

    // 2. Sales Analytics (Monthly Revenue)
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const monthlyRevenue = await Payment.aggregate([
        {
            $match: {
                dateTime: { $gte: startOfYear, $lte: endOfYear }
            }
        },
        {
            $group: {
                _id: { $month: '$dateTime' },
                revenue: { $sum: '$amount' }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    // Format monthly revenue to ensure all months are present
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesAnalytics = months.map((month, index) => {
        const found = monthlyRevenue.find(item => item._id === index + 1);
        return {
            month,
            revenue: found ? found.revenue : 0
        };
    });

    // 3. User Distribution (Pie Chart)
    const totalActiveUsers = totalUsers + totalDrivers;
    const userDistribution = {
        drivers: totalDrivers,
        users: totalUsers,
        driverPercentage: totalActiveUsers > 0 ? Math.round((totalDrivers / totalActiveUsers) * 100) : 0,
        userPercentage: totalActiveUsers > 0 ? Math.round((totalUsers / totalActiveUsers) * 100) : 0
    };

    return {
        overview: {
            totalRevenue,
            totalUsers,
            totalDrivers,
            totalDelivery
        },
        salesAnalytics,
        userDistribution
    };
};

export const AdminStatsService = {
    getAdminDashboardStats
};
