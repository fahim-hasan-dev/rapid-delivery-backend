import { USER_ROLES } from "../enum/user";
import { User } from "../app/modules/user/user.model";
import config from "../config";
import { logger } from "../shared/logger";

export const seedSuperAdmin = async () => {
    try {
        // const isSuperAdminExist = await User.findOne({ role: USER_ROLES.SUPER_ADMIN });

        // if (!isSuperAdminExist) {
        //     await User.create({
        //         fullName: config.super_admin.name || "Super Admin",
        //         email: config.super_admin.email,
        //         password: config.super_admin.password,
        //         role: USER_ROLES.SUPER_ADMIN,
        //         isEmailVerified: true,
        //         isPhoneVerified: true,
        //         status: "active"
        //     });
        //     logger.info("Super Admin seeded successfully.");
        // }

        await User.create({
            fullName: config.super_admin.name || "Super Admin",
            email: config.super_admin.email,
            password: config.super_admin.password,
            role: USER_ROLES.SUPER_ADMIN,
            isEmailVerified: true,
            isPhoneVerified: true,
            status: "active"
        });
    } catch (error) {
        logger.error("Error seeding Super Admin:", error);
    }
};
