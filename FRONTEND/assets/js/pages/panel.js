// Panel de Control - Inicialización y lógica
console.log("panel.js cargado");

// Servicio de Dashboard integrado
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
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Datos recibidos exitosamente:", data);
      return data;
    } catch (error) {
      console.error("Error en getDashboardCompleto:", error);
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

  async getProduccionRango(dias = 7) {
    try {
      console.log(
        `[getProduccionRango] Solicitando datos para ${dias} días...`
      );
      const response = await fetch(
        `${API_BASE_URL}/dashboard/produccion-rango?dias=${dias}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      console.log(`[getProduccionRango] Status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[getProduccionRango] Error:`, errorText);
        throw new Error(`Error al obtener producción por rango: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[getProduccionRango] Datos recibidos:`, data);
      return data;
    } catch (error) {
      console.error("Error en getProduccionRango:", error);
      throw error;
    }
  }
}

const dashboardService = new DashboardService();

// Configuración de colores Chart.js
const chartColors = {
  primary: "#5b99ea",
  success: "#75c181",
  warning: "#f6c23e",
  danger: "#e74a3b",
  info: "#36b9cc",
  gray: "#a9b5c9",
  border: "#e7e9ed",
};

// Variables globales para los gráficos
let produccionChart = null;
let tipoGallinaChart = null;
let galponesChart = null;

// Función principal para cargar todos los datos del dashboard
async function cargarDatosDashboard() {
  try {
    // Mostrar indicadores de carga
    document.getElementById("total-gallinas").innerHTML =
      '<div class="spinner-border spinner-border-sm" role="status"></div>';
    document.getElementById("produccion-hoy").innerHTML =
      '<div class="spinner-border spinner-border-sm" role="status"></div>';
    document.getElementById("galpones-activos").innerHTML =
      '<div class="spinner-border spinner-border-sm" role="status"></div>';
    document.getElementById("alertas-activas").innerHTML =
      '<div class="spinner-border spinner-border-sm" role="status"></div>';

    // Cargar datos completos del dashboard
    const data = await dashboardService.getDashboardCompleto();

    console.log("Datos recibidos del dashboard:", data);

    // Actualizar métricas principales
    actualizarMetricas(data.metricas);

    // Cargar gráfico de producción con rango inicial (7 días)
    await cargarGraficoProduccion(7);

    // Cargar otros gráficos
    cargarGraficoTipoGallina(data.distribucion_tipos);
    cargarGraficoGalpones(data.ocupacion_galpones);

    // Cargar incidentes
    cargarIncidentes(data.incidentes_recientes);

    // Actualizar sensores
    actualizarSensoresData(data.sensores);

    // Cargar actividad reciente
    cargarActividadReciente(data.actividad_reciente);

    // Actualizar sensores cada 30 segundos
    setInterval(async () => {
      try {
        const sensores = await dashboardService.getSensores();
        actualizarSensoresData(sensores);
      } catch (error) {
        console.error("Error actualizando sensores:", error);
      }
    }, 30000);

    // Actualizar actividad reciente cada 60 segundos para refrescar tiempos
    setInterval(async () => {
      try {
        const actividades = await dashboardService.getActividadReciente();
        cargarActividadReciente(actividades);
      } catch (error) {
        console.error("Error actualizando actividad reciente:", error);
      }
    }, 60000);
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);

    // Mostrar el error específico
    let mensajeError = "Error al cargar los datos. ";

    if (error.message.includes("401")) {
      mensajeError +=
        "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 3000);
    } else if (error.message.includes("500")) {
      mensajeError +=
        "Error en el servidor. Por favor, contacta al administrador.";
    } else if (error.message.includes("404")) {
      mensajeError +=
        "No se encontró el endpoint. Verifica la configuración del servidor.";
    } else {
      mensajeError += "Verifica tu conexión o recarga la página.";
    }

    mostrarError(mensajeError);

    // Restaurar el texto de los indicadores
    document.getElementById("total-gallinas").textContent = "---";
    document.getElementById("produccion-hoy").textContent = "---";
    document.getElementById("galpones-activos").textContent = "---";
    document.getElementById("alertas-activas").textContent = "---";
  }
}

// Actualizar métricas principales
function actualizarMetricas(metricas) {
  document.getElementById("total-gallinas").textContent =
    metricas.total_gallinas.toLocaleString();
  document.getElementById("produccion-hoy").textContent =
    metricas.produccion_hoy.toLocaleString();
  document.getElementById("galpones-activos").textContent =
    metricas.galpones_activos;
  document.getElementById("alertas-activas").textContent =
    metricas.alertas_activas;
  document.getElementById("gallinas-trend").textContent =
    metricas.gallinas_trend;
  document.getElementById("produccion-trend").textContent =
    metricas.produccion_trend;
}

// Cargar Gráfica de Producción
async function cargarGraficoProduccion(dias = 7) {
  try {
    console.log(
      `[cargarGraficoProduccion] Iniciando carga para ${dias} días...`
    );
    const data = await dashboardService.getProduccionRango(dias);
    console.log(`[cargarGraficoProduccion] Datos recibidos:`, data);

    const ctx = document.getElementById("produccionChart");

    if (!ctx) {
      console.error("Canvas produccionChart no encontrado");
      return;
    }

    // Validar que los datos existan
    if (!data || !data.labels || !data.data) {
      console.error("Datos inválidos recibidos:", data);
      return;
    }

    // Destruir gráfica anterior si existe
    if (produccionChart) {
      produccionChart.destroy();
    }

    // Actualizar estadísticas
    const total = data.total || 0;
    const promedio = data.promedio || 0;
    const maximo =
      data.data && data.data.length > 0 ? Math.max(...data.data) : 0;

    console.log(
      `[cargarGraficoProduccion] Estadísticas - Total: ${total}, Promedio: ${promedio}, Máximo: ${maximo}`
    );

    document.getElementById("total-periodo").textContent =
      total.toLocaleString();
    document.getElementById("promedio-diario").textContent =
      promedio.toLocaleString();
    document.getElementById("maximo-dia").textContent = maximo.toLocaleString();

    // Crear nueva gráfica
    produccionChart = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Producción de Huevos",
            data: data.data,
            borderColor: chartColors.success,
            backgroundColor: function (context) {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 280);
              gradient.addColorStop(0, "rgba(117, 193, 129, 0.3)");
              gradient.addColorStop(1, "rgba(117, 193, 129, 0.01)");
              return gradient;
            },
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#fff",
            pointBorderColor: chartColors.success,
            pointBorderWidth: 2,
            pointHoverBackgroundColor: chartColors.success,
            pointHoverBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleColor: "#fff",
            titleFont: {
              size: 13,
              weight: "bold",
            },
            bodyColor: "#fff",
            bodyFont: {
              size: 13,
            },
            displayColors: false,
            callbacks: {
              label: function (context) {
                return `Producción: ${context.parsed.y.toLocaleString()} huevos`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString();
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error cargando gráfica de producción:", error);
  }
}

// Gráfico de Distribución por Tipo de Gallina
function cargarGraficoTipoGallina(data) {
  const ctx = document.getElementById("tipoGallinaChart");
  if (!ctx) {
    console.error("Canvas tipoGallinaChart no encontrado");
    return;
  }

  if (tipoGallinaChart) {
    tipoGallinaChart.destroy();
  }

  if (!data || data.length === 0) {
    console.warn("No hay datos de distribución de tipos");
    return;
  }

  const labels = data.map((item) => item.tipo);
  const valores = data.map((item) => item.cantidad);
  const colores = [
    chartColors.primary,
    chartColors.success,
    chartColors.warning,
    chartColors.info,
    chartColors.danger,
  ];

  tipoGallinaChart = new Chart(ctx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: valores,
          backgroundColor: colores.slice(0, valores.length),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
      },
    },
  });
}

// Gráfico de Ocupación de Galpones
function cargarGraficoGalpones(data) {
  const ctx = document.getElementById("galponesChart");
  if (!ctx) {
    console.error("Canvas galponesChart no encontrado");
    return;
  }

  if (galponesChart) {
    galponesChart.destroy();
  }

  if (!data || data.length === 0) {
    console.warn("No hay datos de ocupación de galpones");
    return;
  }

  const labels = data.map((item) => item.nombre);
  const valores = data.map((item) => item.ocupacion_porcentaje);
  const colores = valores.map((val) => {
    if (val >= 90) return chartColors.danger;
    if (val >= 75) return chartColors.warning;
    return chartColors.success;
  });

  galponesChart = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Ocupación (%)",
          data: valores,
          backgroundColor: colores,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
        },
      },
    },
  });
}

// Cargar incidentes recientes
function cargarIncidentes(incidentes) {
  const incidentesList = document.getElementById("incidentes-list");
  if (!incidentesList) {
    console.error("Elemento incidentes-list no encontrado");
    return;
  }

  if (!incidentes || incidentes.length === 0) {
    incidentesList.innerHTML =
      '<div class="text-center py-3 text-muted">No hay incidentes recientes</div>';
    return;
  }

  incidentesList.innerHTML = incidentes
    .map(
      (inc) => `
        <div class="list-group-item border-0 px-0">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <span class="badge bg-${inc.severidad} mb-1">${inc.tipo}</span>
                    <p class="mb-0 small">${inc.descripcion}</p>
                    <small class="text-muted">${inc.tiempo}</small>
                </div>
                <i class="fas fa-chevron-right text-muted"></i>
            </div>
        </div>
    `
    )
    .join("");
}

// Actualizar datos de sensores
function actualizarSensoresData(sensores) {
  const tempEl = document.getElementById("sensor-temp");
  const humEl = document.getElementById("sensor-hum");
  const co2El = document.getElementById("sensor-co2");
  const luzEl = document.getElementById("sensor-luz");

  if (tempEl) tempEl.textContent = sensores.temperatura.toFixed(1) + "°C";
  if (humEl) humEl.textContent = sensores.humedad.toFixed(0) + "%";
  if (co2El) co2El.textContent = sensores.co2 + " ppm";
  if (luzEl) luzEl.textContent = sensores.luminosidad + " lux";
}

// Cargar actividad reciente
function cargarActividadReciente(actividades) {
  const actividadContainer = document.getElementById("actividad-reciente");
  if (!actividadContainer) {
    console.error("Elemento actividad-reciente no encontrado");
    return;
  }

  if (!actividades || actividades.length === 0) {
    actividadContainer.innerHTML =
      '<div class="text-center py-3 text-muted">No hay actividad reciente</div>';
    return;
  }

  actividadContainer.innerHTML = actividades
    .map(
      (act) => `
        <div class="timeline-item">
            <div class="timeline-marker bg-${act.color}"></div>
            <div class="timeline-content">
                <small class="text-muted d-block">${act.tiempo}</small>
                <p class="mb-0">${act.descripcion}</p>
            </div>
        </div>
    `
    )
    .join("");
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
  console.error(mensaje);
  Swal.fire({
    icon: "error",
    title: "Error",
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
}

// Función de inicialización
export function init() {
  console.log("Inicializando panel de control...");

  // Cargar datos inmediatamente (el servicio ya está disponible)
  setTimeout(() => {
    cargarDatosDashboard();
  }, 100);

  // Event listeners para filtros de producción
  document
    .querySelectorAll('input[name="rangoProduccion"]')
    .forEach((radio) => {
      radio.addEventListener("change", async (e) => {
        const dias = parseInt(e.target.value);
        console.log(`Cambiando rango de producción a ${dias} días`);
        await cargarGraficoProduccion(dias);
      });
    });
}
