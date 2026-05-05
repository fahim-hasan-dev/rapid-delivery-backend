import axios from "axios";
import config from "../config";

export const getDistanceAndDuration = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationText: string } | null> => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key:config.googleMapsApiKey,
        },
      }
    );

    const data = response.data;

    if (data.status === "OK" && data.rows[0].elements[0].status === "OK") {
      const distanceMeters = data.rows[0].elements[0].distance.value;
      const durationText = data.rows[0].elements[0].duration.text;
      
      return {
        distanceKm: distanceMeters / 1000,
        durationText: durationText,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching distance from Google Maps:", error);
    return null;
  }
};
