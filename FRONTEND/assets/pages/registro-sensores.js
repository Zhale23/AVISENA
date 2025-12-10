import { registroSensoresService } from '../js/api/registro-sensores.service.js';
import { sensorService } from '../js/api/sensor.service.js';

let currentPage = 1;
const pageSize = 10;
let allRegistros = [];
let allSensors = [];
let chartInstance = null;
let filteredRegistros = [];
let isFilterActive = false;

// FUNCIÓN ORIGINAL createRegistroRow (sin cambios de color)
function createRegistroRow(registro) {
    return `
    <tr>
      <td class="px-0">
        <span class="">${registro.nombre_sensor || `Sensor ${registro.id_sensor}`}</span>
      </td>
      <td class="px-0">${registro.dato_sensor}</td>
      <td class="px-0">
        <span class="badge bg-secondary">${registro.u_medida}</span>
      </td>
      <td class="px-0">
        <small>${formatDateTime(registro.fecha_hora)}</small>
      </td>
      <td class="px-0 text-end">
        <button class="btn btn-sm btn-outline-success btn-view-registro" data-registro-id="${registro.id_registro}">
          <i class="fa-regular fa-eye"></i>
        </button>
      </td>
    </tr>
  `;
}

// Función auxiliar para formatear fecha
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('es-ES');
}

// --- CONFIGURACIÓN DE PAGINACIÓN ---
function renderPagination(total_pages, currentPageNum = 1) {
    const container = document.querySelector("#pagination");
    if (!container) return;

    container.innerHTML = "";

    // Botón Anterior
    const prevItem = document.createElement("li");
    prevItem.classList.add('page-item');
    if (currentPageNum === 1) prevItem.classList.add('disabled');

    const prevLink = document.createElement("a");
    prevLink.classList.add('page-link', 'text-success');
    prevLink.href = "#";
    prevLink.innerHTML = "&lt;";
    prevLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPageNum > 1) {
            loadRegistrosPage(currentPageNum - 1);
        }
    });

    prevItem.appendChild(prevLink);
    container.appendChild(prevItem);

    // Números de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Primera página
    if (startPage > 1) {
        const firstPageItem = document.createElement("li");
        firstPageItem.classList.add('page-item');
        const firstPageLink = document.createElement("a");
        firstPageLink.classList.add('page-link', 'text-success');
        firstPageLink.href = "#";
        firstPageLink.textContent = "1";
        firstPageLink.addEventListener("click", (e) => {
            e.preventDefault();
            loadRegistrosPage(1);
        });
        firstPageItem.appendChild(firstPageLink);
        container.appendChild(firstPageItem);

        if (startPage > 2) {
            const dotsItem = document.createElement("li");
            dotsItem.classList.add('page-item', 'disabled');
            const dotsLink = document.createElement("a");
            dotsLink.classList.add('page-link');
            dotsLink.textContent = "...";
            dotsItem.appendChild(dotsLink);
            container.appendChild(dotsItem);
        }
    }

    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement("li");
        pageItem.classList.add('page-item');

        const pageLink = document.createElement("a");

        if (i === currentPageNum) {
            pageLink.classList.add('page-link', 'bg-success', 'border-success', 'text-white');
            pageItem.classList.add('active');
        } else {
            pageLink.classList.add('page-link', 'text-success');
        }

        pageLink.href = "#";
        pageLink.textContent = i;
        pageLink.addEventListener("click", (e) => {
            e.preventDefault();
            loadRegistrosPage(i);
        });

        pageItem.appendChild(pageLink);
        container.appendChild(pageItem);
    }

    // Última página
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
            const dotsItem = document.createElement("li");
            dotsItem.classList.add('page-item', 'disabled');
            const dotsLink = document.createElement("a");
            dotsLink.classList.add('page-link');
            dotsLink.textContent = "...";
            dotsItem.appendChild(dotsLink);
            container.appendChild(dotsItem);
        }

        const lastPageItem = document.createElement("li");
        lastPageItem.classList.add('page-item');
        const lastPageLink = document.createElement("a");
        lastPageLink.classList.add('page-link', 'text-success');
        lastPageLink.href = "#";
        lastPageLink.textContent = total_pages;
        lastPageLink.addEventListener("click", (e) => {
            e.preventDefault();
            loadRegistrosPage(total_pages);
        });
        lastPageItem.appendChild(lastPageLink);
        container.appendChild(lastPageItem);
    }

    // Botón Siguiente
    const nextItem = document.createElement("li");
    nextItem.classList.add('page-item');
    if (currentPageNum === total_pages) nextItem.classList.add('disabled');

    const nextLink = document.createElement("a");
    nextLink.classList.add('page-link', 'text-success');
    nextLink.href = "#";
    nextLink.innerHTML = "&gt;";
    nextLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPageNum < total_pages) {
            loadRegistrosPage(currentPageNum + 1);
        }
    });

    nextItem.appendChild(nextLink);
    container.appendChild(nextItem);
}

// --- CARGAR TODOS LOS REGISTROS ---
async function loadAllRegistros() {
    try {
        // Obtener todos los registros
        const response = await registroSensoresService.getRegistros(0, 1000);
        allRegistros = response.registros || [];
        filteredRegistros = [...allRegistros];
        isFilterActive = false;

        // Cargar sensores para el filtro
        await loadSensorsForFilter();

        // Actualizar tabla y análisis
        updateTable();
        updateAnalysis();

        return true;
    } catch (error) {
        console.error('Error al cargar registros:', error);
        const tableBody = document.getElementById('registros-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los registros.</td></tr>';
        }
        return false;
    }
}

// --- CARGAR SENSORES PARA FILTRO ---
async function loadSensorsForFilter() {
    try {
        const filterSelect = document.getElementById('filter-sensor');
        if (!filterSelect) return;

        // Mantener la opción "Todos"
        filterSelect.innerHTML = '<option value="all">Todos los Sensores</option>';

        // Agregar sensores únicos
        const uniqueSensors = [...new Set(allRegistros.map(r => r.nombre_sensor || `Sensor ${r.id_sensor}`))];
        uniqueSensors.forEach(sensorName => {
            if (sensorName) {
                filterSelect.innerHTML += `<option value="${sensorName}">${sensorName}</option>`;
            }
        });
    } catch (error) {
        console.error('Error al cargar sensores:', error);
    }
}

// --- ACTUALIZAR TABLA ---
function updateTable() {
    const tableBody = document.getElementById('registros-table-body');
    if (!tableBody) return;

    if (filteredRegistros.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron registros.</td></tr>';

        // Ocultar paginación
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            paginationContainer.classList.add('d-none');
        }
        return;
    }

    // Calcular páginas
    const total = filteredRegistros.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const pageRegistros = filteredRegistros.slice(startIndex, endIndex);

    // Renderizar la página actual
    tableBody.innerHTML = pageRegistros.map(createRegistroRow).join('');

    // Actualizar paginación
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        if (totalPages > 1) {
            paginationContainer.classList.remove('d-none');
            renderPagination(totalPages, currentPage);
        } else {
            paginationContainer.classList.add('d-none');
        }
    }
}

// --- ACTUALIZAR ANÁLISIS (gráfico, alertas, estadísticas) ---
function updateAnalysis() {
    // Calcular promedios por sensor
    const sensorAverages = calculateSensorAverages(filteredRegistros);

    // Generar gráfico
    generateChart(sensorAverages);

    // Generar alertas
    generateAlerts(filteredRegistros);

    // Mostrar estadísticas
    showStatistics(filteredRegistros);
}

// --- APLICAR FILTROS ---
async function applyFilters() {
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;
    const sensorFilter = document.getElementById('filter-sensor')?.value;

    // Resetear a página 1
    currentPage = 1;

    // Filtrar registros
    filteredRegistros = [...allRegistros];

    // Filtrar por fecha
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filteredRegistros = filteredRegistros.filter(reg => {
            const regDate = new Date(reg.fecha_hora);
            regDate.setHours(0, 0, 0, 0);
            return regDate >= fromDate;
        });
    }

    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredRegistros = filteredRegistros.filter(reg => {
            const regDate = new Date(reg.fecha_hora);
            return regDate <= toDate;
        });
    }

    // Filtrar por sensor
    if (sensorFilter && sensorFilter !== 'all') {
        filteredRegistros = filteredRegistros.filter(reg =>
            reg.nombre_sensor === sensorFilter || `Sensor ${reg.id_sensor}` === sensorFilter
        );
    }

    // Actualizar estado del filtro
    isFilterActive = !!(dateFrom || dateTo || (sensorFilter && sensorFilter !== 'all'));

    // Actualizar tabla y análisis
    updateTable();
    updateAnalysis();
}

// --- CALCULAR PROMEDIOS POR SENSOR ---
function calculateSensorAverages(registros) {
    const sensorGroups = {};

    registros.forEach(registro => {
        const sensorName = registro.nombre_sensor || `Sensor ${registro.id_sensor}`;
        const value = parseFloat(registro.dato_sensor);

        if (!isNaN(value)) {
            if (!sensorGroups[sensorName]) {
                sensorGroups[sensorName] = {
                    sum: 0,
                    count: 0,
                    unit: registro.u_medida,
                    values: []
                };
            }

            sensorGroups[sensorName].sum += value;
            sensorGroups[sensorName].count++;
            sensorGroups[sensorName].values.push(value);
        }
    });

    // Calcular promedio para cada sensor
    const averages = [];
    for (const [sensorName, data] of Object.entries(sensorGroups)) {
        averages.push({
            sensor: sensorName,
            average: data.sum / data.count,
            unit: data.unit,
            count: data.count,
            values: data.values
        });
    }

    // Ordenar por promedio descendente
    return averages.sort((a, b) => b.average - a.average);
}

// --- GENERAR GRÁFICO ---
function generateChart(sensorAverages) {
    const ctx = document.getElementById('sensorChart');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Si no hay datos, mostrar mensaje
    if (sensorAverages.length === 0) {
        const canvas = document.getElementById('sensorChart');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#6c757d';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '14px Arial';
        context.fillText('No hay datos para mostrar', canvas.width / 2, canvas.height / 2);
        return;
    }

    const sensorNames = sensorAverages.map(item => item.sensor);
    const averages = sensorAverages.map(item => item.average);
    const units = sensorAverages.map(item => item.unit);

    // Color fijo para todas las barras (verde)
    const backgroundColor = 'rgba(25, 135, 84, 0.7)';

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sensorNames,
            datasets: [{
                label: 'Promedio de Valores',
                data: averages,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor.replace('0.7', '1'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const unit = units[index];
                            return `Promedio: ${context.parsed.y.toFixed(2)} ${unit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor Promedio'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Sensores'
                    }
                }
            }
        }
    });
}

// --- GENERAR ALERTAS ---
function generateAlerts(registros) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    // Limpiar alertas anteriores
    alertsContainer.innerHTML = '';

    if (registros.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fa-solid fa-exclamation-triangle"></i>
                No hay datos para mostrar en el rango seleccionado.
            </div>
        `;
        return;
    }

    // Buscar valores anómalos (solo temperatura para alertas)
    const temperatureAlerts = [];

    registros.forEach(registro => {
        const value = parseFloat(registro.dato_sensor);
        const unit = registro.u_medida || '';

        if (!isNaN(value)) {
            // Detectar temperaturas peligrosas (solo si es temperatura)
            if (unit.toLowerCase().includes('c') || unit.toLowerCase().includes('°')) {
                if (value > 35) {
                    temperatureAlerts.push({
                        sensor: registro.nombre_sensor || `Sensor ${registro.id_sensor}`,
                        value: value,
                        type: 'danger',
                        message: `Temperatura ALTA: ${value}${unit}`,
                        date: registro.fecha_hora
                    });
                } else if (value < 15) {
                    temperatureAlerts.push({
                        sensor: registro.nombre_sensor || `Sensor ${registro.id_sensor}`,
                        value: value,
                        type: 'warning',
                        message: `Temperatura BAJA: ${value}${unit}`,
                        date: registro.fecha_hora
                    });
                }
            }
        }
    });

    // Mostrar alertas de temperatura
    if (temperatureAlerts.length > 0) {
        const criticalAlerts = temperatureAlerts.filter(a => a.type === 'danger');
        const warningAlerts = temperatureAlerts.filter(a => a.type === 'warning');

        if (criticalAlerts.length > 0) {
            alertsContainer.innerHTML += `
                <div class="alert alert-danger">
                    <i class="fa-solid fa-temperature-full"></i>
                    <strong>ALERTA CRÍTICA:</strong> ${criticalAlerts.length} temperatura(s) muy alta(s) detectada(s) (>35°C)
                </div>
            `;
        }

        if (warningAlerts.length > 0) {
            alertsContainer.innerHTML += `
                <div class="alert alert-warning">
                    <i class="fa-solid fa-temperature-low"></i>
                    <strong>ADVERTENCIA:</strong> ${warningAlerts.length} temperatura(s) muy baja(s) detectada(s) (<15°C)
                </div>
            `;
        }
    } else {
        // Verificar si hay datos de temperatura
        const hasTemperatureData = registros.some(reg => {
            const unit = reg.u_medida || '';
            return unit.toLowerCase().includes('c') || unit.toLowerCase().includes('°');
        });

        if (hasTemperatureData) {
            alertsContainer.innerHTML += `
                <div class="alert alert-success">
                    <i class="fa-solid fa-check-circle"></i>
                    Todas las temperaturas están en rangos normales (15°C - 35°C).
                </div>
            `;
        } else {
            alertsContainer.innerHTML += `
                <div class="alert alert-secondary">
                    <i class="fa-solid fa-info-circle"></i>
                    No se detectaron datos de temperatura en el rango seleccionado.
                </div>
            `;
        }
    }
}

// --- MOSTRAR ESTADÍSTICAS ---
function showStatistics(registros) {
    document.getElementById('total-records').textContent = registros.length;

    // Contar sensores únicos
    const uniqueSensors = new Set(registros.map(r => r.id_sensor));
    document.getElementById('active-sensors').textContent = uniqueSensors.size;

    // Encontrar valor máximo y mínimo
    let maxValue = -Infinity;
    let minValue = Infinity;
    let maxSensor = '';
    let minSensor = '';

    registros.forEach(registro => {
        const value = parseFloat(registro.dato_sensor);
        if (!isNaN(value)) {
            if (value > maxValue) {
                maxValue = value;
                maxSensor = registro.nombre_sensor || `Sensor ${registro.id_sensor}`;
            }
            if (value < minValue) {
                minValue = value;
                minSensor = registro.nombre_sensor || `Sensor ${registro.id_sensor}`;
            }
        }
    });

    document.getElementById('max-value').textContent =
        maxValue !== -Infinity ? `${maxValue.toFixed(2)} (${maxSensor})` : 'N/A';
    document.getElementById('min-value').textContent =
        minValue !== Infinity ? `${minValue.toFixed(2)} (${minSensor})` : 'N/A';
}

// --- CARGAR PÁGINA DE REGISTROS ---
async function loadRegistrosPage(page = 1) {
    currentPage = page;
    updateTable();
}

// --- MANEJADORES DE EVENTOS ---
async function handleTableClick(event) {
    const viewButton = event.target.closest('.btn-view-registro');
    if (viewButton) {
        const registroId = viewButton.dataset.registroId;
        await viewRegistroDetails(registroId);
        return;
    }
}

async function viewRegistroDetails(registroId) {
    try {
        const registro = allRegistros.find(r => r.id_registro == registroId);

        if (registro) {
            Swal.fire({
                title: `Registro #${registro.id_registro}`,
                html: `
          <div class="text-start">
            <p><strong>Sensor:</strong> ${registro.nombre_sensor || `Sensor ${registro.id_sensor}`}</p>
            <p><strong>Dato:</strong> ${registro.dato_sensor} ${registro.u_medida}</p>
            <p><strong>Fecha y Hora:</strong> ${formatDateTime(registro.fecha_hora)}</p>
            <p><strong>ID Sensor:</strong> ${registro.id_sensor}</p>
          </div>
        `,
                icon: 'info',
                confirmButtonText: 'Cerrar',
                customClass: {
                    confirmButton: 'btn btn-secondary'
                }
            });
        }
    } catch (error) {
        console.error('Error al obtener detalles del registro:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los detalles del registro',
            icon: 'error'
        });
    }
}

// --- INICIALIZAR FECHAS ---
function initializeDateFilters() {
    const today = new Date();
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');

    if (dateFrom) {
        // Establecer fecha mínima (hace 30 días)
        const minDate = new Date();
        minDate.setDate(today.getDate() - 30);
        dateFrom.min = minDate.toISOString().split('T')[0];

        // Establecer fecha máxima (hoy)
        dateFrom.max = today.toISOString().split('T')[0];

        // Si hay registros, usar la fecha más antigua
        if (allRegistros.length > 0) {
            const oldestDate = new Date(Math.min(...allRegistros.map(r => new Date(r.fecha_hora))));
            dateFrom.value = oldestDate.toISOString().split('T')[0];
        } else {
            // Sino, hace 7 días
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(today.getDate() - 7);
            dateFrom.value = oneWeekAgo.toISOString().split('T')[0];
        }
    }

    if (dateTo) {
        // Establecer fecha máxima (hoy)
        dateTo.max = today.toISOString().split('T')[0];
        dateTo.value = today.toISOString().split('T')[0];
    }
}

// --- LIMPIAR FILTROS ---
function clearFilters() {
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-sensor').value = 'all';

    // Resetear a todos los registros
    filteredRegistros = [...allRegistros];
    isFilterActive = false;
    currentPage = 1;

    // Actualizar tabla y análisis
    updateTable();
    updateAnalysis();
}

// --- ACTUALIZAR DESDE EL SERVIDOR ---
async function refreshFromServer() {
    // Mostrar indicador de carga
    const tableBody = document.getElementById('registros-table-body');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Actualizando datos...</td></tr>';
    }

    // Limpiar filtros primero
    clearFilters();

    // Recargar todos los datos
    await loadAllRegistros();

    // Mostrar mensaje de éxito
    Swal.fire({
        icon: 'success',
        title: 'Datos actualizados',
        text: 'Los registros se han actualizado correctamente.',
        timer: 2000,
        showConfirmButton: false
    });
}

// Hacer funciones globales
window.loadRegistrosPage = loadRegistrosPage;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.refreshRegistros = refreshFromServer;

// Inicialización
async function init() {
    try {
        // Inicializar filtros de fecha (vacío por ahora)
        const dateFrom = document.getElementById('filter-date-from');
        const dateTo = document.getElementById('filter-date-to');
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';

        // Cargar todos los registros
        await loadAllRegistros();

        // Inicializar filtros de fecha con valores por defecto
        initializeDateFilters();

        // Configurar evento click en la tabla
        const tableBody = document.getElementById('registros-table-body');
        if (tableBody) {
            tableBody.removeEventListener('click', handleTableClick);
            tableBody.addEventListener('click', handleTableClick);
        }

    } catch (error) {
        console.error('Error en inicialización:', error);
    }
}

export { init };
