"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConnection = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../shared/logger");
const redisConfig = {
    host: config_1.default.redis.host,
    port: config_1.default.redis.port,
    password: config_1.default.redis.password,
    maxRetriesPerRequest: null,
};
exports.redisClient = new ioredis_1.default(redisConfig);
exports.redisClient.on('connect', () => {
    logger_1.logger.info('🔴 Redis client connected');
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.error('Redis client error:', err);
});
const getRedisConnection = () => ({
    host: config_1.default.redis.host,
    port: config_1.default.redis.port,
    password: config_1.default.redis.password,
    maxRetriesPerRequest: null,
});
exports.getRedisConnection = getRedisConnection;
