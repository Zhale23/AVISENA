// Panel de Control - Inicialización y lógica
console.log("panel.js cargado");

// Servicio de Dashboard integrado
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
    const url = `${API_BASE_URL}/dashboard/metricas`;
    const res = await fetch(url, { method: "GET", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Metricas ${res.status}`);
    return res.json();
  }

  async getProduccionSemanal() {
    const url = `${API_BASE_URL}/dashboard/produccion-semanal`;
    const res = await fetch(url, { method: "GET", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`ProduccionSemanal ${res.status}`);
    return res.json();
  }

  async getDistribucionTipos() {
    const url = `${API_BASE_URL}/dashboard/distribucion-tipos`;
    const res = await fetch(url, { method: "GET", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`DistribucionTipos ${res.status}`);
    return res.json();
  }

  async getProduccionRango(dias = 7) {
    const url = `${API_BASE_URL}/dashboard/produccion-rango?dias=${dias}`;
    const res = await fetch(url, { method: "GET", headers: this.getHeaders() });
    if (res.status === 404 && dias === 7) {
      // Fallback a semanal si el endpoint nuevo no existe
      return this.getProduccionSemanal();
    }
    if (!res.ok) throw new Error(`ProduccionRango ${dias} -> ${res.status}`);
    return res.json();
  }

  async getOcupacionGalpones() {
    const url = `${API_BASE_URL}/dashboard/ocupacion-galpones`;
    const res = await fetch(url, { method: "GET", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`OcupacionGalpones ${res.status}`);
    return res.json();
  }

  async getIncidentesRecientes() {
    const url = `${API_BASE_URL}/dashboard/incidentes-recientes`;
    const res = await fetch(url, { method: "GET", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`IncidentesRecientes ${res.status}`);
    return res.json();
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
  // Mostrar indicadores de carga básicos
  const setSpinner = (id) =>
    (document.getElementById(id).innerHTML =
      '<div class="spinner-border spinner-border-sm" role="status"></div>');
  [
    "total-gallinas",
    "produccion-hoy",
    "galpones-activos",
    "alertas-activas",
  ].forEach(setSpinner);

  // 1) Métricas principales (independiente)
  try {
    const metricas = await dashboardService.getMetricas();
    actualizarMetricas(metricas);
  } catch (e) {
    console.warn("No se pudieron cargar métricas:", e);
  }

  // 2) Producción con filtros (por defecto 7 días)
  try {
    await cargarGraficoProduccionRango(7);
  } catch (e) {
    console.error("No se pudo cargar producción semanal:", e);
    // Fallback local: 7 días con ceros para que no quede en blanco
    const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const fallback = {
      labels: dias,
      data_actual: [0, 0, 0, 0, 0, 0, 0],
      data_anterior: [0, 0, 0, 0, 0, 0, 0],
    };
    try {
      const cache = localStorage.getItem("produccion_semanal_cache");
      if (cache) {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed.labels) && Array.isArray(parsed.data_actual)) {
          cargarGraficoProduccion(parsed);
          return;
        }
      }
    } catch {}
    cargarGraficoProduccion(fallback);
  }

  // 3) Gráficos secundarios (best-effort)
  try {
    const dist = await dashboardService.getDistribucionTipos();
    cargarGraficoTipoGallina(dist);
  } catch (e) {
    console.warn("Distribución tipos no disponible:", e);
  }

  try {
    const galpones = await dashboardService.getOcupacionGalpones();
    cargarGraficoGalpones(galpones);
  } catch (e) {
    console.warn("Ocupación de galpones no disponible:", e);
  }

  try {
    const inc = await dashboardService.getIncidentesRecientes();
    cargarIncidentes(inc);
  } catch (e) {
    console.warn("Incidentes recientes no disponibles:", e);
  }

  // 4) Sensores y Actividad en intervalos (si fallan, continúan)
  try {
    const sensores = await dashboardService.getSensores();
    actualizarSensoresData(sensores);
  } catch (e) {
    console.warn("Sensores no disponibles por ahora:", e);
  }

  try {
    const actividades = await dashboardService.getActividadReciente();
    cargarActividadReciente(actividades);
  } catch (e) {
    console.warn("Actividad reciente no disponible:", e);
  }

  setInterval(async () => {
    try {
      const sensores = await dashboardService.getSensores();
      actualizarSensoresData(sensores);
    } catch (error) {
      console.error("Error actualizando sensores:", error);
    }
  }, 30000);

  setInterval(async () => {
    try {
      const actividades = await dashboardService.getActividadReciente();
      cargarActividadReciente(actividades);
    } catch (error) {
      console.error("Error actualizando actividad reciente:", error);
    }
  }, 60000);
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

// Cargar Producción Semanal como gráfica (con fallback a tarjetas)
function cargarGraficoProduccion(data) {
  const container = document.getElementById("produccion-semanal-cards");
  if (!container) {
    console.error("Contenedor produccion-semanal-cards no encontrado");
    return;
  }

  // Aceptar tanto estructura nueva {labels,data} como antigua {labels,data_actual,data_anterior}
  const labels = data.labels || [];
  const datasetActual = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.data_actual)
    ? data.data_actual
    : [];
  const datasetAnterior = Array.isArray(data.data_anterior)
    ? data.data_anterior
    : new Array(datasetActual.length).fill(0);

  // Totales
  const totalActual = datasetActual.reduce((s, v) => s + (v || 0), 0);
  const promedioDiario = Math.round(totalActual / (datasetActual.length || 1));
  const totalEl = document.getElementById("total-semana-actual");
  const promEl = document.getElementById("promedio-diario");
  const maxEl = document.getElementById("maximo-dia");
  if (totalEl) totalEl.textContent = totalActual.toLocaleString();
  if (promEl) promEl.textContent = promedioDiario.toLocaleString();
  const maximo = datasetActual.length ? Math.max(...datasetActual) : 0;
  if (maxEl) maxEl.textContent = maximo.toLocaleString();

  // Crear contenedor canvas
  container.innerHTML =
    '<div style="height:300px"><canvas id="produccionChart"></canvas></div>';
  const canvas = document.getElementById("produccionChart");
  if (!canvas) return;

  // Destruir gráfica previa
  if (produccionChart) {
    produccionChart.destroy();
  }

  // Crear gráfica (mejor calidad visual y gradient)
  const ctx2d = canvas.getContext("2d");
  const gradient = ctx2d.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(117,193,129,0.35)");
  gradient.addColorStop(1, "rgba(117,193,129,0.02)");
  const manyPoints = labels.length > 31;

  produccionChart = new Chart(ctx2d, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Semana actual",
          data: datasetActual,
          borderColor: chartColors.success,
          backgroundColor: gradient,
          fill: true,
          borderWidth: 3,
          tension: 0.35,
          pointRadius: manyPoints ? 0 : 3,
          pointHoverRadius: manyPoints ? 2 : 5,
        },
        {
          label: "Semana anterior",
          data: datasetAnterior,
          borderColor: chartColors.gray,
          backgroundColor: "rgba(169,181,201,0.1)",
          fill: false,
          borderDash: [6, 4],
          tension: 0.35,
          borderWidth: 2,
          pointRadius: manyPoints ? 0 : 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2,
      plugins: {
        legend: { display: true, position: "bottom" },
        tooltip: {
          intersect: false,
          mode: "index",
          callbacks: {
            label: (ctx) =>
              ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} huevos`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => Number(value).toLocaleString(),
          },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: { grid: { display: false } },
      },
    },
  });

  // Guardar cache local por si el backend falla luego
  try {
    const cachePayload = {
      labels,
      data_actual: datasetActual,
      data_anterior: datasetAnterior,
    };
    localStorage.setItem(
      "produccion_semanal_cache",
      JSON.stringify(cachePayload)
    );
  } catch {}
}

// Cargar por rango (7, 30, 90, 180)
async function cargarGraficoProduccionRango(dias = 7) {
  try {
    const data = await dashboardService.getProduccionRango(dias);
    // Normalizar estructura del backend nuevo/antiguo
    if (Array.isArray(data.data)) {
      // Nuevo endpoint
      cargarGraficoProduccion({
        labels: data.labels,
        data: data.data,
        data_anterior: new Array(data.data.length).fill(0),
      });
    } else {
      // Antiguo semanal
      cargarGraficoProduccion(data);
    }
  } catch (err) {
    console.error("Fallo al cargar rango de producción", dias, err);
    if (dias === 7) {
      // intentar semanal
      try {
        const sem = await dashboardService.getProduccionSemanal();
        cargarGraficoProduccion(sem);
        return;
      } catch {}
    }
    // Fallback vacío
    cargarGraficoProduccion({ labels: [], data: [] });
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

  // Filtros de producción
  const radios = document.querySelectorAll('input[name="rangoProduccion"]');
  radios.forEach((r) => {
    r.addEventListener("change", async (e) => {
      const dias = parseInt(e.target.value, 10) || 7;
      await cargarGraficoProduccionRango(dias);
    });
  });
}
