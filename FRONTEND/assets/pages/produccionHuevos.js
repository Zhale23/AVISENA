import { produccionHuevosService } from '../js/api/produccionHuevos.service.js';

let modalInstance = null;
let originalFecha = null;

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
let limit = 10;
let fechaInicioGlobal = null;
let fechaFinGlobal = null;

// --- FUNCIONES AUXILIARES ---
function createProduccionRow(produccion) {
  const idRol = JSON.parse(localStorage.getItem('user'))?.id_rol;

  return `
    <tr>
      <td>${produccion.nombre_galpon}</td>
      <td>${produccion.cantidad || 'Sin Cantidad'}</td>
      <td>${produccion.fecha}</td>
      <td>${produccion.tamaño}</td>
      <td class="text-end">
         <button class="btn btn-sm btn-success btn-edit-produccion" 
          data-produccion-id="${produccion.id_produccion}">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        ${idRol === 1 || idRol === 2 ? `
          <button class="btn btn-sm btn-secondary btn-eliminar-produccion" 
            data-produccion-id="${produccion.id_produccion}">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      ` : ''}
      </td>
    </tr>
  `;
}

// --- MODAL DE EDICIÓN ---
async function openEditModal(produccionId) {
  const modalElement = document.getElementById('edit-produccion-modal');
  if (!modalInstance) modalInstance = new bootstrap.Modal(modalElement);

  try {
    const produccion = await produccionHuevosService.GetProduccionHuevosById(produccionId);

    originalFecha = produccion.fecha;

    const inputFecha = document.getElementById('edit-fecha');
    inputFecha.value = produccion.fecha;
    inputFecha.max = produccion.fecha;

    document.getElementById('edit-produccion-id').value = produccion.id_produccion;
    document.getElementById('edit-produccion-nombre').value = produccion.nombre_galpon;
    document.getElementById('edit-cantidad').value = produccion.cantidad;
    document.getElementById('edit-tamaño').value = produccion.tamaño;

    modalInstance.show();

  } catch (error) {
    console.error("Error:", error);

    Swal.fire({
      icon: "error",
      title: "Error al cargar datos",
      text: "No se pudieron cargar los datos de la producción.",
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
  }
}

// --- ACTUALIZAR PRODUCCIÓN ---
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
    init();

    // 🔵 SWEETALERT DE ÉXITO
    Swal.fire({
      icon: "success",
      title: "Producción actualizada",
      text: "Los datos se han guardado correctamente.",
      timer: 1500,
      showConfirmButton: false
    });

  } catch (error) {
    console.error("Error:", error);

    // 🔴 SWEETALERT DE ERROR
    Swal.fire({
      icon: "error",
      title: "Error al actualizar",
      text: "No se pudo actualizar la producción.",
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
  }
}


// --- CREAR ---
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

    // 🔵 SWEETALERT DE ÉXITO
    Swal.fire({
      icon: "success",
      title: "Producción registrada!",
      text: "La nueva producción fue guardada correctamente.",
      timer: 1500,
      showConfirmButton: false
    });

    event.target.reset();
    init();

  } catch (error) {
    console.error("Error:", error);

    // 🔴 SWEETALERT DE ERROR
    Swal.fire({
      icon: "error",
      title: "Error al registrar",
      text: "No se pudo crear la producción.",
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
  }
}


// --- TABLA CLICK ---
async function handleTableClick(event) {
  const editButton = event.target.closest('.btn-edit-produccion');
  if (editButton) {
    openEditModal(editButton.dataset.produccionId);
    return;
  }

  const deleteButton = event.target.closest('.btn-eliminar-produccion');
  if (deleteButton) {
    eliminarProduccion(deleteButton.dataset.produccionId);
    return;
  }
}

// --- ELIMINAR ---
async function eliminarProduccion(produccionId) {
  try {
    // 🔵 SWEETALERT DE CONFIRMACIÓN
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta producción será eliminada permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-danger",
        cancelButton: "btn btn-secondary"
      },
      buttonsStyling: false
    });

    // ❌ Si cancela, no eliminamos
    if (!result.isConfirmed) return;

    // 🗑️ Ejecutar eliminación
    await produccionHuevosService.DeleteProduccionHuevos(produccionId);

    // 🟢 SWEETALERT DE ÉXITO
    Swal.fire({
      icon: "success",
      title: "Producción eliminada",
      text: "La producción fue eliminada correctamente.",
      timer: 1500,
      showConfirmButton: false
    });

    init(currentPage); // recargar tabla

  } catch (error) {
    console.error("Error:", error);

    // 🔴 SWEETALERT DE ERROR
    Swal.fire({
      icon: "error",
      title: "Error al eliminar",
      text: "No se pudo eliminar la producción.",
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
  }
}


// --- PAGINACIÓN BONITA ---
function renderPaginationControls(totalPages = 99) {
  const pagination = document.getElementById("pagination-controls");
  if (!pagination) return;

  pagination.innerHTML = "";

  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `
    <a class="page-link text-success" href="#" data-page="${currentPage - 1}">
      <i class="fas fa-chevron-left"></i>
    </a>`;
  pagination.appendChild(prevLi);

  const pageLi = document.createElement("li");
  pageLi.className = "page-item active";
  pageLi.innerHTML = `
    <span class="page-link bg-success border-success text-white">${currentPage}</span>`;
  pagination.appendChild(pageLi);

  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextLi.innerHTML = `
    <a class="page-link text-success" href="#" data-page="${currentPage + 1}">
      <i class="fas fa-chevron-right"></i>
    </a>`;
  pagination.appendChild(nextLi);

  pagination.onclick = (e) => {
    const btn = e.target.closest("a[data-page]");
    if (!btn) return;

    const page = parseInt(btn.dataset.page);
    if (page > 0) init(page);
  };
}

// --- FILTRO POR FECHA ---
function setupFilterListeners() {
  const btn = document.getElementById('btn-filtrar');
  const fi = document.getElementById('filtro-fecha-inicio');
  const ff = document.getElementById('filtro-fecha-fin');

  if (!btn || !fi || !ff) return;

  btn.onclick = () => {
    fechaInicioGlobal = fi.value || null;
    fechaFinGlobal = ff.value || null;
    init(1);
  };
}

// --- INIT ---
export async function init(page = 1) {
  currentPage = page;

  const tableBody = document.getElementById('produccion-table-body');
  tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Cargando...</td></tr>`;

  try {
    const producciones = await produccionHuevosService.GetProduccionHuevosAll({
      page,
      limit,
      fecha_inicio: fechaInicioGlobal,
      fecha_fin: fechaFinGlobal
    });

    if (!producciones || producciones.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center">No hay registros.</td></tr>`;
    } else {
      tableBody.innerHTML = producciones.map(createProduccionRow).join('');
    }

    renderPaginationControls();

  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `
      <tr><td colspan="6" class="text-danger text-center">Error al cargar datos.</td></tr>`;
  }

  document.getElementById('produccion-table-body').onclick = handleTableClick;
  document.getElementById('edit-produccion-form').onsubmit = handleUpdateSubmit;
  document.getElementById('create-produccion-form').onsubmit = handleCreateSubmit;
}

setupFilterListeners();
init();
 
