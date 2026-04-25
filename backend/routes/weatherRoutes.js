const express = require('express');

const createWeatherRoutes = ({ authenticateToken, fetchWeatherPayload }) => {
    const router = express.Router();

    router.get('/get-weather', authenticateToken, async (req, res) => {
        try {
            const { latitude, longitude, city = '', state = '' } = req.query;
            const hasCoordinateParams =
                latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;

            const fallbackLatitude = req.user?.location?.coordinates?.latitude;
            const fallbackLongitude = req.user?.location?.coordinates?.longitude;

            const weatherPayload = await fetchWeatherPayload({
                latitude: latitude ?? fallbackLatitude,
                longitude: longitude ?? fallbackLongitude,
                city: city || (hasCoordinateParams ? '' : req.user?.location?.city || 'Pune'),
                state: state || (hasCoordinateParams ? '' : req.user?.location?.state || 'Maharashtra'),
            });

            res.json({
                success: true,
                data: weatherPayload,
            });
        } catch (error) {
            console.error('Get weather error:', error);
            res.status(500).json({ message: 'Failed to fetch weather data', error: error.message });
        }
    });

    router.get('/my-locations', authenticateToken, async (req, res) => {
        try {
            const latitude = req.user?.location?.coordinates?.latitude;
            const longitude = req.user?.location?.coordinates?.longitude;

            const primaryLabel = [req.user?.location?.city, req.user?.location?.state]
                .filter(Boolean)
                .join(', ') || 'Current Location';

            res.json({
                success: true,
                data: [
                    {
                        id: 'primary',
                        label: primaryLabel,
                        latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
                        longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
                        isFavorite: true,
                    },
                ],
            });
        } catch (error) {
            console.error('Get weather locations error:', error);
            res.status(500).json({ message: 'Failed to fetch weather locations', error: error.message });
        }
    });

    router.get('/location/:weatherId', authenticateToken, async (req, res) => {
        try {
            if (req.params.weatherId !== 'primary') {
                return res.status(404).json({ message: 'Weather location not found' });
            }

            const latitude = req.user?.location?.coordinates?.latitude;
            const longitude = req.user?.location?.coordinates?.longitude;

            const weatherPayload = await fetchWeatherPayload({
                latitude,
                longitude,
                city: req.user?.location?.city || 'Pune',
                state: req.user?.location?.state || 'Maharashtra',
            });

            res.json({
                success: true,
                data: weatherPayload,
            });
        } catch (error) {
            console.error('Get weather location details error:', error);
            res
                .status(500)
                .json({ message: 'Failed to fetch weather location details', error: error.message });
        }
    });

    router.put('/favorite/:weatherId', authenticateToken, async (req, res) => {
        try {
            res.json({
                success: true,
                message: `Weather location ${req.params.weatherId} marked as favorite`,
            });
        } catch (error) {
            console.error('Set weather favorite error:', error);
            res.status(500).json({ message: 'Failed to update weather favorite', error: error.message });
        }
    });

    return router;
};

module.exports = { createWeatherRoutes };
