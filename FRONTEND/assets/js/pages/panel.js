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

    // Cargar gráficos
    cargarGraficoProduccion(data.produccion_semanal);
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

// Cargar Producción Semanal como tarjetas
function cargarGraficoProduccion(data) {
  const container = document.getElementById("produccion-semanal-cards");
  if (!container) {
    console.error("Contenedor produccion-semanal-cards no encontrado");
    return;
  }

  // Calcular totales
  const totalActual = data.data_actual.reduce((sum, val) => sum + val, 0);
  const promedioDiario = Math.round(totalActual / 7);

  // Actualizar totales
  document.getElementById("total-semana-actual").textContent =
    totalActual.toLocaleString();
  document.getElementById("promedio-diario").textContent =
    promedioDiario.toLocaleString();

  // Crear tarjetas para cada día
  container.innerHTML = data.labels
    .map((dia, index) => {
      const valorActual = data.data_actual[index];
      const valorAnterior = data.data_anterior[index];
      const diferencia = valorActual - valorAnterior;
      const porcentaje =
        valorAnterior > 0 ? ((diferencia / valorAnterior) * 100).toFixed(1) : 0;
      const tendencia = diferencia >= 0 ? "up" : "down";
      const colorTendencia = diferencia >= 0 ? "success" : "danger";
      const iconoTendencia = diferencia >= 0 ? "arrow-up" : "arrow-down";

      return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="card border-0 bg-light h-100">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <small class="text-muted fw-bold">${dia}</small>
              ${
                valorActual > 0
                  ? `<i class="fas fa-${iconoTendencia} text-${colorTendencia} small"></i>`
                  : ""
              }
            </div>
            <h4 class="mb-1">${valorActual.toLocaleString()}</h4>
            <small class="text-muted">vs ${valorAnterior.toLocaleString()}</small>
            ${
              Math.abs(diferencia) > 0
                ? `<div class="mt-1"><span class="badge bg-${colorTendencia}-subtle text-${colorTendencia} small">${
                    diferencia >= 0 ? "+" : ""
                  }${diferencia}</span></div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");
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
}
