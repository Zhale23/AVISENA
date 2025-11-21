const API_BASE_URL = "https://avisena-back.onrender.com";

class DashboardService {
  constructor() {
    this.token = localStorage.getItem("access_token");
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
  }

  async getMetricas() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/metricas`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener métricas");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getMetricas:", error);
      throw error;
    }
  }

  async getProduccionSemanal() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/produccion-semanal`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener producción semanal");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getProduccionSemanal:", error);
      throw error;
    }
  }

  async getDistribucionTipos() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/distribucion-tipos`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener distribución de tipos");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getDistribucionTipos:", error);
      throw error;
    }
  }

  async getOcupacionGalpones() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/ocupacion-galpones`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener ocupación de galpones");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getOcupacionGalpones:", error);
      throw error;
    }
  }

  async getIncidentesRecientes() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/incidentes-recientes`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener incidentes recientes");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getIncidentesRecientes:", error);
      throw error;
    }
  }

  async getSensores() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/sensores`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al obtener datos de sensores");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getSensores:", error);
      throw error;
    }
  }

  async getActividadReciente() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/actividad-reciente`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener actividad reciente");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en getActividadReciente:", error);
      throw error;
    }
  }

  async getDashboardCompleto() {
    try {
      console.log("Solicitando datos completos del dashboard...");
      console.log("URL:", `${API_BASE_URL}/dashboard/completo`);
      console.log("Token:", this.token ? "Token presente" : "Sin token");

      const response = await fetch(`${API_BASE_URL}/dashboard/completo`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      console.log(
        "Respuesta del servidor:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error del servidor:", errorText);
        throw new Error(
          `Error al obtener datos completos del dashboard: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Datos recibidos exitosamente:", data);
      return data;
    } catch (error) {
      console.error("Error en getDashboardCompleto:", error);
      throw error;
    }
  }
}

// Exportar instancia del servicio como variable global
const dashboardService = new DashboardService();
window.dashboardService = dashboardService;
