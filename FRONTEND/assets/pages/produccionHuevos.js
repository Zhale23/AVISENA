import { produccionHuevosService } from '../api/produccionHuevos.service.js';

let modalInstance = null; // Guardará la instancia del modal
let originalFecha = null;

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
let limit = 10;
let fechaInicioGlobal = null;
let fechaFinGlobal = null;


// --- FUNCIONES AUXILIARES ---

function createProduccionRow(produccion) {
  const idRol = JSON.parse(localStorage.getItem('user'))?.id_rol;
  
  const tabla = `
    <tr>
      <td>${produccion.id_produccion}</td>
      <td>${produccion.nombre_galpon}</td>
      <td>${produccion.cantidad || 'Sin Cantidad'}</td>
      <td>${produccion.fecha}</td>
      <td>${produccion.tamaño}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-info btn-edit-produccion" data-produccion-id="${produccion.id_produccion}">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        ${idRol === 1 || idRol === 2 ? `
          <button class="btn btn-sm btn-danger btn-eliminar-produccion" data-produccion-id="${produccion.id_produccion}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        ` : ''}
      </td>
    </tr>
  `;
  
  return tabla;
}

// --- MODAL DE EDICIÓN ---

async function openEditModal(produccionId) {
  const modalElement = document.getElementById('edit-produccion-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const produccion = await produccionHuevosService.GetProduccionHuevosById(produccionId);

    originalFecha = produccion.fecha; // Guardamos la fecha original

    const inputFecha = document.getElementById('edit-fecha');

    document.getElementById('edit-produccion-id').value = produccion.id_produccion;
    document.getElementById('edit-produccion-nombre').value = produccion.nombre_galpon;
    document.getElementById('edit-cantidad').value = produccion.cantidad;
    document.getElementById('edit-tamaño').value = produccion.tamaño;

    // --- VALIDACIÓN DE FECHA ---
    inputFecha.value = produccion.fecha;
    inputFecha.max = produccion.fecha; // No permite fechas anteriores

    // Opcional: mostrar alerta si se intenta cambiar por debajo del mínimo
    inputFecha.addEventListener('input', () => {
      if (inputFecha.value > inputFecha.max) {
        inputFecha.value = inputFecha.max;
      }
    });

    modalInstance.show();
  } catch (error) {
    console.error(`Error al obtener datos de la producción ${produccionId}:`, error);
    alert('No se pudieron cargar los datos de la producción.');
  }
}


// --- ENVÍO DEL FORMULARIO DE ACTUALIZACIÓN ---

async function handleUpdateSubmit(event) {
  event.preventDefault();

  const produccionId = document.getElementById('edit-produccion-id').value;
  const updatedData = {
    fecha: document.getElementById('edit-fecha').value,
    cantidad: parseInt(document.getElementById('edit-cantidad').value),
    id_tipo: document.getElementById('edit-tamaño').value,
    galpon: document.getElementById('edit-produccion-nombre').value
  };

  try {
    await produccionHuevosService.UpdateProduccionHuevos(produccionId, updatedData);
    modalInstance.hide();
    init(); // recarga la tabla
  } catch (error) {
    console.error(`Error al actualizar la producción ${produccionId}:`, error);
    alert('No se pudo actualizar la producción.');
  }
}

// --- CREAR NUEVA PRODUCCIÓN ---
async function handleCreateSubmit(event) {
  event.preventDefault();

  const newData = {
    id_galpon: parseInt(document.getElementById('create-id-galpon').value),
    cantidad: parseInt(document.getElementById('create-cantidad').value),
    fecha: document.getElementById('create-fecha').value,
    id_tipo_huevo: parseInt(document.getElementById('create-id-tipo-huevo').value)
  };

  try {
    await produccionHuevosService.CreateProduccionHuevos(newData);
    alert('Producción registrada correctamente.');
    event.target.reset(); // limpia el formulario
    init(); // recarga tabla
  } catch (error) {
    console.error('Error al crear la producción:', error);
    alert('No se pudo registrar la producción.');
  }
}

// --- CLICK EN LA TABLA (para editar) ---

async function handleTableClick(event) {
  const editButton = event.target.closest('.btn-edit-produccion');
  if (editButton) {
    const produccionId = editButton.dataset.produccionId;
    openEditModal(produccionId);
  }

   const deleteButton = event.target.closest('.btn-eliminar-produccion');
  if (deleteButton) {
    const produccionId = deleteButton.dataset.produccionId;
    eliminarProduccion(produccionId); // ← AQUÍ SE CONECTA
    return;
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---

async function init(page = 1) {
  currentPage = page;

  const tableBody = document.getElementById('produccion-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando producciones...</td></tr>';

  try {
    const producciones = await produccionHuevosService.GetProduccionHuevosAll({
      page: currentPage,
      limit,
      fecha_inicio: fechaInicioGlobal,
      fecha_fin: fechaFinGlobal
    });

    if (producciones && producciones.length > 0) {
      tableBody.innerHTML = producciones.map(createProduccionRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron registros.</td></tr>';
    }

    renderPaginationControls();

  } catch (error) {
    console.error('Error al obtener producciones:', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar datos.</td></tr>`;
  }

  // Listeners
  const editForm = document.getElementById('edit-produccion-form');
  tableBody.removeEventListener('click', handleTableClick);
  tableBody.addEventListener('click', handleTableClick);
  editForm.removeEventListener('submit', handleUpdateSubmit);
  editForm.addEventListener('submit', handleUpdateSubmit);
  const createForm = document.getElementById('create-produccion-form');
  createForm.removeEventListener('submit', handleCreateSubmit);
  createForm.addEventListener('submit', handleCreateSubmit);
}

function renderPaginationControls() {
  const paginationDiv = document.getElementById("pagination-controls");
  if (!paginationDiv) return;

  paginationDiv.innerHTML = `
    <button id="btn-prev" class="btn btn-secondary me-2">Anterior</button>
    <span>Página ${currentPage}</span>
    <button id="btn-next" class="btn btn-secondary ms-2">Siguiente</button>
  `;

  document.getElementById("btn-prev").onclick = () => {
    if (currentPage > 1) init(currentPage - 1);
  };

  document.getElementById("btn-next").onclick = () => {
    init(currentPage + 1);
  };
}

// --- FILTRADO POR FECHA ---

function setupFilterListeners() {
  const btnFiltrar = document.getElementById('btn-filtrar');
  const inputFechaInicio = document.getElementById('filtro-fecha-inicio');
  const inputFechaFin = document.getElementById('filtro-fecha-fin');

  if (!btnFiltrar || !inputFechaInicio || !inputFechaFin) return;

  btnFiltrar.addEventListener('click', () => {
    // Tomar valores o null si están vacíos
    fechaInicioGlobal = inputFechaInicio.value || null;
    fechaFinGlobal = inputFechaFin.value || null;

    // Reiniciar a la primera página al filtrar
    init(1);
  });
}

async function eliminarProduccion(produccionId) {
  try {
    if (!confirm('¿Estás seguro de que quieres eliminar esta producción?')) return;
    
    await produccionHuevosService.DeleteProduccionHuevos(produccionId);
    alert('Producción eliminada correctamente');
    init(currentPage);
  } catch (error) {
    console.error('Error al eliminar producción:', error);
    alert('Error: ' + error.message);
  }
}

setupFilterListeners();

export { init };

