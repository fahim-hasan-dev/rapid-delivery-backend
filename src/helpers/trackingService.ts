import { redisClient } from './redis';
import { logger } from '../shared/logger';
import { getIO } from './socketManager';

const DRIVER_LOCATIONS_KEY = 'drivers:online_locations';

const updateDriverLocation = async (
    parcelId: string,
    driverId: string,
    coords: [number, number]
) => {
    const key = `tracking:${parcelId}`;

    const locationData = {
        lng: coords[0].toString(),
        lat: coords[1].toString(),
        timestamp: Date.now().toString(),
    };

    await redisClient.hset(key, locationData);
    await redisClient.persist(key); 
};

const getDriverLocation = async (parcelId: string) => {
    const data = await redisClient.hgetall(`tracking:${parcelId}`);
    if (!data || Object.keys(data).length === 0) return null;

    return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        timestamp: parseInt(data.timestamp),
    };
};

const removeDriverTracking = async (parcelId: string, driverId: string) => {
    const key = `tracking:${parcelId}`;
    await redisClient.del(key);
    await redisClient.zrem('driver:locations', driverId);
    logger.info(`Cleanup: Removed tracking data from Redis for parcel ${parcelId}`);
};

const updateDriverLiveLocation = async (
    driverId: string,
    coords: [number, number]
) => {
    // GeoJSON format uses [longitude, latitude]
    await redisClient.geoadd(DRIVER_LOCATIONS_KEY, coords[0], coords[1], driverId);
};

const removeDriverLiveLocation = async (driverId: string) => {
    await redisClient.zrem(DRIVER_LOCATIONS_KEY, driverId);
};

const getNearbyDrivers = async (
    coords: [number, number],
    radiusKm: number = 50
): Promise<Array<{ driverId: string; distanceKm: number }>> => {
    try {
        const results = (await redisClient.geosearch(
            DRIVER_LOCATIONS_KEY,
            'FROMLONLAT',
            coords[0],
            coords[1],
            'BYRADIUS',
            radiusKm,
            'km',
            'WITHDIST'
        )) as [string, string][] | null;

        if (!results || results.length === 0) {
            return [];
        }

        return results.map(([driverId, dist]) => ({
            driverId,
            distanceKm: parseFloat(dist),
        }));
    } catch (error) {
        logger.error('Error finding nearby drivers:', error);
        return [];
    }
};

const notifyNearbyDrivers = async (parcel: any, radiusKm: number = 50) => {
    if (!parcel?.pickupLocation?.coordinates) {
        return;
    }

    // Ignore parcels scheduled beyond one hour
    if (parcel.deliveryDate) {
        const oneHourFromNow = new Date();
        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
        if (new Date(parcel.deliveryDate) > oneHourFromNow) {
            return;
        }
    }

    const nearbyDrivers = await getNearbyDrivers(parcel.pickupLocation.coordinates, radiusKm);
    if (nearbyDrivers.length === 0) {
        return;
    }

    const baseParcelData = {
        _id: parcel._id,
        name: parcel.name,
        vehicleType: parcel.vehicleType,
        pickupLocation: parcel.pickupLocation,
        dropLocation: parcel.dropLocation,
        deliveryDate: parcel.deliveryDate,
        deliveryTime: parcel.deliveryTime,
        distance: parcel.distance,
        duration: parcel.duration,
        totalDeliveryFee: parcel.totalDeliveryFee,
        driverShare: parcel.driverShare,
        status: parcel.status,
        sender: parcel.sender,
        createdAt: parcel.createdAt,
    };

    try {
        const io = getIO();
        // Send to drivers within matching radius only
        for (const driver of nearbyDrivers) {
            const payload = {
                ...baseParcelData,
                distanceFromDriver: Math.round(driver.distanceKm * 1000),
            };

            io.of('/notifications').to(`user:${driver.driverId}`).emit('nearby:new-parcel', payload);
            io.of('/tracking').to(`user:${driver.driverId}`).emit('nearby:new-parcel', payload);
        }
    } catch {
        logger.warn('Socket.io not initialized, skipping nearby parcel emit');
    }
};

const notifyParcelAccepted = async (
    parcelId: string,
    pickupCoords: [number, number],
    radiusKm: number = 50
) => {
    if (!pickupCoords) {
        return;
    }

    const nearbyDrivers = await getNearbyDrivers(pickupCoords, radiusKm);
    if (nearbyDrivers.length === 0) {
        return;
    }

    try {
        const io = getIO();
        for (const driver of nearbyDrivers) {
            io.of('/notifications').to(`user:${driver.driverId}`).emit('nearby:parcel-accepted', { parcelId: parcelId.toString() });
            io.of('/tracking').to(`user:${driver.driverId}`).emit('nearby:parcel-accepted', { parcelId: parcelId.toString() });
        }
    } catch {
        logger.warn('Socket.io not initialized, skipping parcel accepted emit');
    }
};

export const trackingService = {
    updateDriverLocation,
    getDriverLocation,
    removeDriverTracking,
    updateDriverLiveLocation,
    removeDriverLiveLocation,
    getNearbyDrivers,
    notifyNearbyDrivers,
    notifyParcelAccepted,
};

