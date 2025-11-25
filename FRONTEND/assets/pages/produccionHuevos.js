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
        <button class="btn btn-sm btn-success btn-edit-produccion" data-produccion-id="${produccion.id_produccion}">
          <i class="fa-solid fa-pen-to-square" style="color: black;"></i>
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
    await Swal.fire({
      icon: "success",
      title: "Producción registrada!",
      text: "La nueva producción fue guardada correctamente.",
      timer: 1500,
      showConfirmButton: false
    });

    // ✅ CERRAR EL MODAL LUEGO DEL SWEETALERT
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("create-produccion-modal")
    );
    modal.hide();

    // Limpiar el formulario y recargar
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


// Modificar la función init para que pase correctamente los filtros a la paginación
function renderPagination(total_pages, currentPage = 1) {
    const container = document.querySelector("#pagination");
    if (!container) return;

    container.innerHTML = "";

    // ---------- BOTÓN ANTERIOR ----------
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `
        <a class="page-link text-success" href="#" data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    prevLi.addEventListener("click", () => {
        if (currentPage !== 1) {
            const prevPage = currentPage - 1;
            init(prevPage, 10, activeFechaInicio, activeFechaFin);
        }
    });
    container.appendChild(prevLi);

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // ---------- PRIMERA PÁGINA + ... ----------
    if (startPage > 1) {
        container.appendChild(createPageLi(1, currentPage));
        if (startPage > 2) container.appendChild(createDotsLi());
    }

    // ---------- NÚMEROS DE PÁGINA ----------
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createPageLi(i, currentPage));
    }

    // ---------- ... + ÚLTIMA PÁGINA ----------
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) container.appendChild(createDotsLi());
        container.appendChild(createPageLi(total_pages, currentPage));
    }

    // ---------- BOTÓN SIGUIENTE ----------
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === total_pages ? "disabled" : ""}`;
    nextLi.innerHTML = `
        <a class="page-link text-success" href="#" data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    nextLi.addEventListener("click", () => {
        if (currentPage !== total_pages) {
            const nextPage = currentPage + 1;
            init(nextPage, 10, activeFechaInicio, activeFechaFin);
        }
    });
    container.appendChild(nextLi);
}

// ========== BOTÓN DE NÚMERO DE PÁGINA ==========
function createPageLi(page, currentPage) {
    const li = document.createElement("li");

    const isActive = page === currentPage;

    li.className = `page-item ${isActive ? 'active' : ''}`;
    li.innerHTML = `
        <a class="page-link ${isActive ? "bg-success border-success text-white" : "text-success"}"
           href="#" data-page="${page}">
           ${page}
        </a>
    `;

    li.addEventListener("click", () => {
        if (!isActive) {
            init(page, 10, activeFechaInicio, activeFechaFin);
        }
    });

    return li;
}

// ========== PUNTOS SUSPENSIVOS ==========
function createDotsLi() {
    const li = document.createElement("li");
    li.className = "page-item disabled";
    li.innerHTML = `<a class="page-link text-success">...</a>`;
    return li;
}

//______________________ para filtrar por fechas_______________________________________
function filtrarAislamientos(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    Swal.fire({
      icon: 'info',
      title: 'Error',
      text: 'Debe seleccionar ambas fechas',
      confirmButtonColor: 'rgba(51, 136, 221, 1)'
    });
    return;
  }

  // Guardar fechas para usar en fetchIsolations
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  // Recargar la tabla desde la página 1 con el filtro
  init(1, 10);
}

// Botón para aplicar filtro
document.getElementById("btn-apply-date-filter").addEventListener("click", () => {
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  filtrarAislamientos(fechaInicio, fechaFin);

});
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

    renderPagination();

  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `
      <tr><td colspan="6" class="text-danger text-center">Error al cargar datos.</td></tr>`;
  }

  document.getElementById('produccion-table-body').onclick = handleTableClick;
  document.getElementById('edit-produccion-form').onsubmit = handleUpdateSubmit;
  document.getElementById('create-produccion-form').onsubmit = handleCreateSubmit;
}

init();
 
