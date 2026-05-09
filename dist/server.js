"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUsers = void 0;
const colors_1 = __importDefault(require("colors"));
const mongoose_1 = __importDefault(require("mongoose"));
const node_dns_1 = __importDefault(require("node:dns"));
node_dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./shared/logger");
const socketHelper_1 = require("./helpers/socketHelper");
const socketManager_1 = require("./helpers/socketManager");
const redis_1 = require("./helpers/redis");
const seed_1 = require("./DB/seed");
const workers_1 = require("./workers");
process.on('uncaughtException', error => {
    logger_1.errorLogger.error('UnhandledException Detected', error);
    process.exit(1);
});
exports.onlineUsers = new Map();
let server;
async function main() {
    try {
        await mongoose_1.default.connect(config_1.default.database_url);
        logger_1.logger.info(colors_1.default.green('🚀 Database connected successfully'));
        await (0, seed_1.seedSuperAdmin)();
        const port = typeof config_1.default.port === 'number' ? config_1.default.port : Number(config_1.default.port);
        server = app_1.default.listen(port, config_1.default.ip_address, () => {
            logger_1.logger.info(colors_1.default.yellow(`♻️  Application listening on port:${config_1.default.port}`));
        });
        const io = new socket_io_1.Server(server, {
            pingTimeout: 60000,
            cors: {
                origin: '*',
            },
        });
        const pubClient = redis_1.redisClient.duplicate();
        const subClient = redis_1.redisClient.duplicate();
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        (0, socketManager_1.setIO)(io);
        socketHelper_1.socketHelper.socket(io);
        (0, workers_1.initWorkers)();
        logger_1.logger.info(colors_1.default.green('🍁 Server connected successfully'));
    }
    catch (error) {
        logger_1.errorLogger.error(colors_1.default.red('Server Failed to connect Database'));
        config_1.default.node_env === 'development' && console.log(error);
    }
    process.on('unhandledRejection', error => {
        if (server) {
            server.close(() => {
                logger_1.errorLogger.error('UnhandledRejection Detected', error);
                process.exit(1);
            });
        }
        else {
            process.exit(1);
        }
    });
}
main();
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM IS RECEIVE');
    if (server) {
        server.close();
    }
});
