"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_VERIFICATION_STATUS = exports.USER_STATUS = exports.USER_ROLES = void 0;
var USER_ROLES;
(function (USER_ROLES) {
    USER_ROLES["ADMIN"] = "admin";
    USER_ROLES["SUPER_ADMIN"] = "super_admin";
    USER_ROLES["SENDER"] = "sender";
    USER_ROLES["DRIVER"] = "driver";
})(USER_ROLES || (exports.USER_ROLES = USER_ROLES = {}));
var USER_STATUS;
(function (USER_STATUS) {
    USER_STATUS["ACTIVE"] = "active";
    USER_STATUS["RESTRICTED"] = "restricted";
    USER_STATUS["DELETED"] = "deleted";
})(USER_STATUS || (exports.USER_STATUS = USER_STATUS = {}));
var PROFILE_VERIFICATION_STATUS;
(function (PROFILE_VERIFICATION_STATUS) {
    PROFILE_VERIFICATION_STATUS["PENDING"] = "pending";
    PROFILE_VERIFICATION_STATUS["APPROVED"] = "approved";
    PROFILE_VERIFICATION_STATUS["REJECTED"] = "rejected";
    PROFILE_VERIFICATION_STATUS["RESUBMITTED"] = "resubmitted";
})(PROFILE_VERIFICATION_STATUS || (exports.PROFILE_VERIFICATION_STATUS = PROFILE_VERIFICATION_STATUS = {}));
