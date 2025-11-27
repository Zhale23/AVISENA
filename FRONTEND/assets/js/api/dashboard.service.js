const API_BASE_URL = "https://api.avisena.store";

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

  async getProduccionRango(dias = 7) {
    try {
      const url = `${API_BASE_URL}/dashboard/produccion-rango?dias=${dias}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });
      if (response.status === 404 && dias === 7) {
        // Fallback a semanal si el endpoint nuevo no existe en prod
        return await this.getProduccionSemanal();
      }
      if (!response.ok) {
        throw new Error(`Error al obtener producción por rango (${dias})`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error en getProduccionRango:", error);
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
    // Reimplementado para no usar /dashboard/completo (evita CORS/500)
    try {
      const headers = this.getHeaders();
      const fetchJson = (url) =>
        fetch(url, { headers }).then((r) => {
          if (!r.ok) throw new Error(`${url} ${r.status}`);
          return r.json();
        });

      const [
        metricas,
        produccion,
        distribucion,
        ocupacion,
        incidentes,
        sensores,
        actividad,
      ] = await Promise.all([
        fetchJson(`${API_BASE_URL}/dashboard/metricas`).catch(() => null),
        fetchJson(`${API_BASE_URL}/dashboard/produccion-semanal`).catch(
          () => null
        ),
        fetchJson(`${API_BASE_URL}/dashboard/distribucion-tipos`).catch(
          () => []
        ),
        fetchJson(`${API_BASE_URL}/dashboard/ocupacion-galpones`).catch(
          () => []
        ),
        fetchJson(`${API_BASE_URL}/dashboard/incidentes-recientes`).catch(
          () => []
        ),
        fetchJson(`${API_BASE_URL}/dashboard/sensores`).catch(() => ({
          temperatura: 25,
          humedad: 60,
          co2: 450,
          luminosidad: 750,
        })),
        fetchJson(`${API_BASE_URL}/dashboard/actividad-reciente`).catch(
          () => []
        ),
      ]);

      return {
        metricas: metricas || {
          total_gallinas: 0,
          produccion_hoy: 0,
          galpones_activos: 0,
          alertas_activas: 0,
          gallinas_trend: "+0.0%",
          produccion_trend: "+0.0%",
        },
        produccion_semanal: produccion || {
          labels: [],
          data_actual: [],
          data_anterior: [],
        },
        distribucion_tipos: distribucion,
        ocupacion_galpones: ocupacion,
        incidentes_recientes: incidentes,
        sensores: sensores,
        actividad_reciente: actividad,
      };
    } catch (error) {
      console.error("Error en getDashboardCompleto (reimplementado):", error);
      throw error;
    }
  }
}

// Exportar instancia del servicio como variable global
const dashboardService = new DashboardService();
window.dashboardService = dashboardService;
