export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class GeoUtil {
  /**
   * Convert coordinates to PostGIS Point string
   */
  static toPostGISPoint(lat: number, lng: number): string {
    return `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
  }

  /**
   * Parse PostGIS point to coordinates
   */
  static parsePostGISPoint(point: string): Coordinates | null {
    // Point is in format: POINT(lng lat)
    const match = point.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (!match) return null;

    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
