import { registroSensoresService } from '../js/api/registro-sensores.service.js';

let currentPage = 1; // Cambio: ahora empieza en 1
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
        <button class="btn btn-sm btn-outline-success btn-view-registro" data-registro-id="${registro.id_registro}">
          <i class="fa-regular fa-eye"></i>
        </button>
      </td>
    </tr>
  `;
}

// --- CONFIGURACIÓN DE PAGINACIÓN MEJORADA ---
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
    for (let i = 1; i <= total_pages; i++) {
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

// Cargar registros con paginación mejorada
async function loadRegistrosPage(page = 1) {
    currentPage = page;
    const tableBody = document.getElementById('registros-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando registros...</td></tr>';

    try {
        // Calcular skip basado en página (empieza en 1)
        const skip = (page - 1) * pageSize;
        const response = await registroSensoresService.getRegistros(skip, pageSize);

        if (response.registros && response.registros.length > 0) {
            tableBody.innerHTML = response.registros.map(createRegistroRow).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron registros.</td></tr>';
        }

        // Calcular total de páginas
        const totalPages = Math.ceil(response.total / pageSize);
        
        // Mostrar/ocultar contenedor de paginación
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) {
            if (totalPages > 1) {
                paginationContainer.classList.remove('d-none');
                renderPagination(totalPages, page);
            } else {
                paginationContainer.classList.add('d-none');
            }
        }

    } catch (error) {
        console.error('Error al obtener los registros:', error);
        // Si hay error, intentar sin paginación como fallback
        try {
            const response = await registroSensoresService.getRegistros(0, 1000);
            if (response.registros && response.registros.length > 0) {
                tableBody.innerHTML = response.registros.map(createRegistroRow).join('');
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron registros.</td></tr>';
            }
            // Ocultar paginación si estamos en modo fallback
            const paginationContainer = document.getElementById('pagination-container');
            if (paginationContainer) {
                paginationContainer.classList.add('d-none');
            }
        } catch (fallbackError) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los registros.</td></tr>';
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
                confirmButtonText: 'Cerrar',
                customClass:{
                    confirmButton:'btn btn-secondary'
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

// Hacer loadRegistrosPage global para el botón de actualizar
window.loadRegistrosPage = loadRegistrosPage;

// Inicialización
async function init() {
    await loadRegistrosPage(1);

    const tableBody = document.getElementById('registros-table-body');

    // Aplicamos el patrón remove/add para evitar listeners duplicados
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
}

export { init };
