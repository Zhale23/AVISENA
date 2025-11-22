import { request } from './apiClient.js';

export const sensorService = {
    /**
     * @returns {Promise<object>}
    */
    getSensors: () => {
        const endpoint = `/sensors/sensor/all`;
        return request(endpoint);
    },

    /**
     * @param {number} sensorId
     * @returns {Promise<object>}
     */
    getSensorById: (sensorId) => {
        const endpoint = `/sensors/sensor/by-id/${sensorId}`;
        return request(endpoint);
    },


    /**
     * @param {number} sensorId
     * @param {object} sensorData
     * @returns {Promise<object>}
     */
    updateSensor: (sensorId, sensorData) => {
        return request(`/sensors/sensor/by-id/${sensorId}`, {
            method: 'PUT',
            body: JSON.stringify(sensorData),
        });
    },

    /**
     * @param {number} sensorId
     * @param {boolean} newStatus
     * @returns {Promise<object>}
     */
    changeSensorStatus: (sensorId, newStatus) => {
        return request(`/sensors/sensor/cambiar-estado/${sensorId}?nuevo_estado=${newStatus}`, {
            method: 'PUT',
        });
    },

    /**
     * @param {number} galponId
     * @returns {Promise<object>}
     */
    getSensorsByGalpon: (galponId) => {
        const endpoint = `/sensors/sensor/by-galpon/${galponId}`;
        return request(endpoint);
    },

    getSensorsByTipo: (idTipo) => {
        return request(`/sensors/sensor/by-tipo/${idTipo}`);
    },

    /**
     * @param {object} sensorData
     * @returns {Promise<object>}
     */
    createSensor: (sensorData) => {
        return request(`/sensors/sensor/crear`, {
            method: 'POST',
            body: JSON.stringify(sensorData),
        });
    },
    getGalponesActivos: () => {
        const endpoint = `/sensors/galpon/activos`;
        return request(endpoint);
    },
};
