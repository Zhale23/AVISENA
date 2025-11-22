import { request } from "./apiClient.js";

export const tipoSensorService = {
  /**
   * @returns {Promise<object>}
   */
  getTipoSensores: () => {
    const endpoint = `/sensor-types/tipo-sensor/all`;
    return request(endpoint);
  },

  /**
   * @returns {Promise<object>}
   */
  getTipoSensoresActivos: () => {
    const endpoint = `/sensors/tipo-sensor/activos`;
    return request(endpoint);
  },

  /**
   * @param {number} tipoSensorId
   * @returns {Promise<object>}
   */
  getTipoSensorById: (tipoSensorId) => {
    const endpoint = `/sensor-types/tipo-sensor/by-id/${tipoSensorId}`;
    return request(endpoint);
  },

  /**
   * @param {object} tipoSensorData
   * @returns {Promise<object>}
   */
  createTipoSensor: (tipoSensorData) => {
    return request(`/sensor-types/tipo-sensor/crear`, {
      method: "POST",
      body: JSON.stringify(tipoSensorData),
    });
  },

  /**
   * @param {number} tipoSensorId
   * @param {object} tipoSensorData
   * @returns {Promise<object>}
   */
  updateTipoSensor: (tipoSensorId, tipoSensorData) => {
    return request(`/sensor-types/tipo-sensor/by-id/${tipoSensorId}`, {
      method: "PUT",
      body: JSON.stringify(tipoSensorData),
    });
  },

  /**
   * @param {number} tipoSensorId
   * @param {boolean} newStatus
   * @returns {Promise<object>}
   */
  changeTipoSensorStatus: (tipoSensorId, newStatus) => {
    return request(
      `/sensor-types/tipo-sensor/cambiar-estado/${tipoSensorId}?nuevo_estado=${newStatus}`,
      {
        method: "PUT",
      }
    );
  },
};
