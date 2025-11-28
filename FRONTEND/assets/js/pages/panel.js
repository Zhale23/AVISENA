// Panel de Control - Inicialización y lógica
console.log("panel.js cargado");
// Detectar rol del usuario para personalizar el panel
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
const currentRole = (currentUser?.nombre_rol || "").toLowerCase();

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
  // Configuración de widgets por rol (qué mostrar primero y qué ocultar)
  aplicarLayoutPorRol();
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

// Mostrar/ocultar widgets del panel según el rol
function aplicarLayoutPorRol() {
  const role = currentRole;
  // Elementos: secciones y tarjetas
  const el = {
    produccionCard: document
      .querySelector("#produccion-semanal-cards")
      ?.closest(".card"),
    distribucionCard: document
      .getElementById("tipoGallinaChart")
      ?.closest(".card"),
    galponesCard: document.getElementById("galponesChart")?.closest(".card"),
    incidentesCard: document
      .getElementById("incidentes-list")
      ?.closest(".card"),
    sensoresCard: document
      .getElementById("sensores-container")
      ?.closest(".card"),
    actividadCard: document
      .getElementById("actividad-reciente")
      ?.closest(".card"),
  };

  // Siempre mostrar métricas principales (producción hoy, gallinas, galpones, alertas)

  // Reordenar accesos directos según rol
  const shortcuts = document.getElementById("panel-shortcuts");
  if (shortcuts) {
    const orderByRole = {
      superadmin: [
        "produccion_huevos",
        "incidentes",
        "sensors",
        "ventas",
        "galpones",
        "chickens",
      ],
      administrador: [
        "produccion_huevos",
        "incidentes",
        "sensors",
        "ventas",
        "galpones",
        "chickens",
      ],
      supervisor: [
        "tareas",
        "incidentes",
        "chickens",
        "produccion_huevos",
        "galpones",
        "sensors",
      ],
      operario: [
        "tareas",
        "incidentes",
        "chickens",
        "produccion_huevos",
        "rescue",
        "sensors",
      ],
    };
    const desired = orderByRole[role] || orderByRole["administrador"];
    const links = Array.from(shortcuts.querySelectorAll(".shortcut-link"));

    // Mostrar/ocultar shortcuts según rol
    links.forEach((link) => {
      const page = link.dataset.page;
      if (role === "operario") {
        // Operario: solo mostrar tareas, incidentes, chickens, produccion_huevos, rescue, sensors
        if (["galpones", "ventas"].includes(page)) {
          link.style.display = "none";
        } else {
          link.style.display = "";
          link.classList.remove("d-none");
        }
      } else if (role === "supervisor") {
        // Supervisor: ocultar ventas
        if (page === "ventas") {
          link.style.display = "none";
        } else {
          link.style.display = "";
          link.classList.remove("d-none");
        }
      } else {
        // Admin/SuperAdmin: mostrar todo
        link.style.display = "";
        link.classList.remove("d-none");
      }
    });

    links.sort(
      (a, b) =>
        desired.indexOf(a.dataset.page) - desired.indexOf(b.dataset.page)
    );
    links.forEach((l) => shortcuts.appendChild(l));
  }

  // Visibilidad de widgets
  const hide = (node) => {
    if (node) {
      node.style.display = "none";
    }
  };
  const show = (node) => {
    if (node) {
      node.style.display = "";
    }
  };

  switch (role) {
    case "operario":
      // Operario: Reorganizar layout
      hide(el.produccionCard);
      hide(el.actividadCard);
      hide(el.incidentesCard);

      show(el.distribucionCard);
      show(el.galponesCard);
      show(el.sensoresCard);

      // Reorganizar DOM: Sensores al lado de accesos, gráficas abajo
      const sensoresCard = el.sensoresCard;
      const distribucionCard = el.distribucionCard;
      const galponesCard = el.galponesCard;
      const shortcutsCol = document.querySelector(
        ".row.g-3.mb-4 > .col-12.col-lg-4"
      );

      if (sensoresCard && distribucionCard && galponesCard && shortcutsCol) {
        const produccionRow = shortcutsCol.parentElement;

        // Ocultar producción
        const produccionCol = produccionRow.querySelector(".col-12.col-lg-8");
        if (produccionCol) produccionCol.style.display = "none";

        // 1. Mover sensores al lado de accesos directos
        const sensoresCol = sensoresCard.parentElement;
        sensoresCol.className = "col-12 col-lg-6";

        // Insertar sensores antes de accesos directos
        produccionRow.insertBefore(sensoresCol, shortcutsCol);

        // Ajustar accesos directos
        shortcutsCol.className = "col-12 col-lg-6";

        // 2. Crear nueva fila para distribución y galpones
        const nuevaFilaGraficas = document.createElement("div");
        nuevaFilaGraficas.className = "row g-3 mb-4";
        nuevaFilaGraficas.id = "operario-graficas-row";

        const distribucionCol = distribucionCard.parentElement;
        const galponesCol = galponesCard.parentElement;
        distribucionCol.className = "col-12 col-lg-6";
        galponesCol.className = "col-12 col-lg-6";

        nuevaFilaGraficas.appendChild(distribucionCol);
        nuevaFilaGraficas.appendChild(galponesCol);

        // Insertar después de la fila de sensores/accesos
        produccionRow.parentElement.insertBefore(
          nuevaFilaGraficas,
          produccionRow.nextSibling
        );
      }

      // Crear secciones destacadas para Tareas e Incidentes si es operario
      crearSeccionesOperario();
      break;
    case "supervisor":
      // Mostrar producción pero mantener enfoque operativo
      show(el.produccionCard);
      show(el.incidentesCard);
      show(el.galponesCard);
      show(el.sensoresCard);
      show(el.actividadCard);
      show(el.distribucionCard);
      break;
    case "administrador":
    case "superadmin":
    default:
      // Mostrar todo
      show(el.produccionCard);
      show(el.distribucionCard);
      show(el.galponesCard);
      show(el.incidentesCard);
      show(el.sensoresCard);
      show(el.actividadCard);
      break;
  }
}

// Crear secciones destacadas para operarios: Tareas e Incidentes principales
async function crearSeccionesOperario() {
  // Buscar el contenedor principal después de las métricas
  const mainContent = document.querySelector("#main-content");
  if (!mainContent) return;

  // Verificar si ya existen las secciones
  if (document.getElementById("operario-tareas-destacadas")) return;

  // Crear HTML para secciones destacadas
  const seccionesHTML = `
    <div class="row g-3 mb-4" id="operario-secciones-destacadas">
      <!-- Tareas Pendientes Destacadas -->
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100 border-start border-warning border-4">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="card-title mb-0"><i class="fas fa-tasks text-warning me-2"></i>Mis Tareas Pendientes</h5>
              <a href="#" class="btn btn-sm btn-warning shortcut-link" data-page="tareas">Ver Todas</a>
            </div>
            <div id="operario-tareas-destacadas" class="list-group list-group-flush">
              <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
                <p class="text-muted small mt-2">Cargando tareas...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Incidentes Activos Destacados -->
      <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100 border-start border-danger border-4">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="card-title mb-0"><i class="fas fa-exclamation-triangle text-danger me-2"></i>Incidentes Activos</h5>
              <a href="#" class="btn btn-sm btn-danger shortcut-link" data-page="incidentes">Ver Todos</a>
            </div>
            <div id="operario-incidentes-destacados" class="list-group list-group-flush">
              <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
                <p class="text-muted small mt-2">Cargando incidentes...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insertar después de las métricas principales
  const metricasRow = document.querySelector(".row.g-3.mb-4");
  if (metricasRow) {
    metricasRow.insertAdjacentHTML("afterend", seccionesHTML);

    // Cargar datos de tareas e incidentes
    cargarTareasOperario();
    cargarIncidentesOperario();
  }
}

// Cargar tareas pendientes del operario
async function cargarTareasOperario() {
  const container = document.getElementById("operario-tareas-destacadas");
  if (!container) return;

  try {
    const idUsuario =
      currentUser?.id_usuario || currentUser?.id || currentUser?.idUsuario;
    if (!idUsuario) throw new Error("Usuario no identificado");

    // Backend expone GET /tareas/usuario/{id_usuario}
    const response = await fetch(
      `${API_BASE_URL}/tareas/usuario/${idUsuario}`,
      {
        headers: dashboardService.getHeaders(),
      }
    );

    if (!response.ok) throw new Error("Error al cargar tareas");

    let tareas = await response.json();
    // Tomar solo las primeras 5 para la vista del panel
    if (Array.isArray(tareas)) {
      tareas = tareas.slice(0, 5);
    }

    if (!tareas || tareas.length === 0) {
      container.innerHTML =
        '<div class="text-center py-3 text-muted small">No hay tareas pendientes</div>';
      return;
    }

    container.innerHTML = tareas
      .map(
        (tarea) => `
      <div class="list-group-item border-0 px-0 py-2">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <p class="mb-1">${tarea.descripcion || "Sin descripción"}</p>
            <div class="d-flex gap-2 align-items-center">
              <span class="badge bg-${
                tarea.estado === "activo" || tarea.estado === "pendiente"
                  ? "warning"
                  : tarea.estado === "completado" ||
                    tarea.estado === "finalizado"
                  ? "success"
                  : "secondary"
              }">${tarea.estado || "Sin estado"}</span>
              <small class="text-muted"><i class="far fa-calendar me-1"></i>${
                tarea.fecha_hora_init || tarea.fecha || "Sin fecha"
              }</small>
            </div>
          </div>
          <i class="fas fa-chevron-right text-muted"></i>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error cargando tareas operario:", error);
    container.innerHTML =
      '<div class="text-center py-3 text-danger small">Error al cargar tareas</div>';
  }
}

// Cargar incidentes activos para el operario
async function cargarIncidentesOperario() {
  const container = document.getElementById("operario-incidentes-destacados");
  if (!container) return;

  try {
    // Backend expone GET /incidentes_generales/by-estado/{esta_resuelta}?skip&limit
    // Para mostrar incidentes activos usamos esta_resuelta=false
    const response = await fetch(
      `${API_BASE_URL}/incidentes_generales/by-estado/false?skip=0&limit=5`,
      { headers: dashboardService.getHeaders() }
    );

    if (!response.ok) throw new Error("Error al cargar incidentes");

    let incidentes = await response.json();

    // Adaptar según forma de respuesta (array directo o paginado)
    if (Array.isArray(incidentes)) {
      incidentes = incidentes.slice(0, 5);
    } else if (incidentes && Array.isArray(incidentes.items)) {
      incidentes = incidentes.items.slice(0, 5);
    } else if (incidentes && Array.isArray(incidentes.results)) {
      incidentes = incidentes.results.slice(0, 5);
    } else if (incidentes && Array.isArray(incidentes.data)) {
      incidentes = incidentes.data.slice(0, 5);
    } else if (incidentes && Array.isArray(incidentes.incidentes)) {
      incidentes = incidentes.incidentes.slice(0, 5);
    } else {
      incidentes = [];
    }

    if (!incidentes || incidentes.length === 0) {
      container.innerHTML =
        '<div class="text-center py-3 text-muted small">No hay incidentes activos</div>';
      return;
    }

    // Mostrar solo el primer incidente y un resumen del resto
    const primero = incidentes[0];
    const restantes = incidentes.length - 1;

    const itemHTML = `
      <div class="list-group-item border-0 px-0 py-2">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex gap-2 align-items-center mb-1">
              <span class="badge bg-${
                (primero.estado || "pendiente").toLowerCase() === "pendiente"
                  ? "warning"
                  : "success"
              }">${(primero.estado || "pendiente").toUpperCase()}</span>
              <small class="text-muted">${primero.fecha || "Hoy"}</small>
            </div>
            <p class="mb-0 small">${
              primero.descripcion || "Sin descripción"
            }</p>
            <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${
              primero.galpon || primero.ubicacion || "No especificado"
            }</small>
          </div>
        </div>
      </div>`;

    const resumenHTML =
      restantes > 0
        ? `<div class="px-0 py-2 small text-muted">+ ${restantes} incidentes pendientes más</div>`
        : "";

    container.innerHTML = itemHTML + resumenHTML;
  } catch (error) {
    console.error("Error cargando incidentes operario:", error);
    container.innerHTML =
      '<div class="text-center py-3 text-danger small">Error al cargar incidentes</div>';
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

  // Ajustar aspectRatio según rol
  const aspectRatioValue = currentRole === "operario" ? 2 : 1.4;

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
      aspectRatio: aspectRatioValue,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
      },
      layout: { padding: 0 },
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

  // Ajustar aspectRatio según rol
  const aspectRatioValue = currentRole === "operario" ? 2 : 1.4;

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
      aspectRatio: aspectRatioValue,
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
