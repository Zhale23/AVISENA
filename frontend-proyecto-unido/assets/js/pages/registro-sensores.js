import { registroSensoresService } from '../api/registro-sensores.service.js';

let currentPage = 0;
const pageSize = 10;

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
        <small>${new Date(registro.fecha_hora).toLocaleString('es-ES')}</small>
      </td>
      <td class="px-0 text-end">
        <button class="btn btn-sm btn-outline-info btn-view-registro" data-registro-id="${registro.id_registro}">
          <i class="fa-regular fa-eye"></i>
        </button>
      </td>
    </tr>
  `;
}

// --- CONFIGURACIÓN DE PAGINACIÓN ---

function setupPagination(total, limit) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(total / limit);

    // Si solo hay una página, no mostrar paginación
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = `
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center">
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Anterior</a>
        </li>
  `;

    for (let i = 0; i < totalPages; i++) {
        paginationHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" onclick="changePage(${i})">${i + 1}</a>
      </li>
    `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Siguiente</a>
        </li>
      </ul>
    </nav>
  `;

    paginationContainer.innerHTML = paginationHTML;
}

// Función global para cambiar página
window.changePage = function (page) {
    currentPage = page;
    loadRegistrosPage();
};

// Cargar registros con paginación
async function loadRegistrosPage() {
    const tableBody = document.getElementById('registros-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando registros...</td></tr>';

    try {
        const skip = currentPage * pageSize;
        const response = await registroSensoresService.getRegistros(skip, pageSize);

        if (response.registros && response.registros.length > 0) {
            tableBody.innerHTML = response.registros.map(createRegistroRow).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron registros.</td></tr>';
        }

        setupPagination(response.total, pageSize);

    } catch (error) {
        console.error('Error al obtener los registros:', error);
        // Si hay error, intentar sin paginación como fallback
        try {
            const response = await registroSensoresService.getRegistros(0, 1000);
            if (response.registros && response.registros.length > 0) {
                tableBody.innerHTML = response.registros.map(createRegistroRow).join('');
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron registros.</td></tr>';
            }
            // Ocultar paginación si estamos en modo fallback
            const paginationContainer = document.getElementById('pagination-container');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
        } catch (fallbackError) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los registros.</td></tr>';
        }
    }
}

// --- MANEJADORES DE EVENTOS ---

async function handleTableClick(event) {
    // Manejador para el botón de ver detalles
    const viewButton = event.target.closest('.btn-view-registro');
    if (viewButton) {
        const registroId = viewButton.dataset.registroId;
        await viewRegistroDetails(registroId);
        return;
    }
}

async function viewRegistroDetails(registroId) {
    try {
        // Obtener todos los registros para buscar el específico
        const response = await registroSensoresService.getRegistros(0, 1000);
        const registro = response.registros.find(r => r.id_registro == registroId);

        if (registro) {
            Swal.fire({
                title: `Registro #${registro.id_registro}`,
                html: `
          <div class="text-start">
            <p><strong>Sensor:</strong> ${registro.nombre_sensor || `Sensor ${registro.id_sensor}`}</p>
            <p><strong>Dato:</strong> ${registro.dato_sensor} ${registro.u_medida}</p>
            <p><strong>Fecha y Hora:</strong> ${new Date(registro.fecha_hora).toLocaleString('es-ES')}</p>
            <p><strong>ID Sensor:</strong> ${registro.id_sensor}</p>
          </div>
        `,
                icon: 'info',
                confirmButtonText: 'Cerrar'
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

// Inicialización
async function init() {
    await loadRegistrosPage();

    const tableBody = document.getElementById('registros-table-body');

    // Aplicamos el patrón remove/add para evitar listeners duplicados
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
}

export { init };