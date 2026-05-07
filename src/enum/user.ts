export enum USER_ROLES {
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
    SENDER = "sender",
    DRIVER = "driver"
}

export enum USER_STATUS {
    ACTIVE = 'active',
    RESTRICTED = 'restricted',
    DELETED = 'deleted',
}

export enum PROFILE_VERIFICATION_STATUS {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    RESUBMITTED = 'resubmitted',
}
