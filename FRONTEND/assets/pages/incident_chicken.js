import { incident_chickenService } from '../js/incident_chicken.service.js';
import { isolationService } from '../js/isolations.service.js';
import { init as initIsolations } from '../pages/isolations.js';

let modalInstance = null;
let createModalInstance = null;
let cargarGalpones = null;
let activeFechaInicio = "";
let activeFechaFin = "";

let cacheGalponesInci = null;
let currentSelectedGalponInci = null;

// Variables para manejar todos los datos
let allIncidents = [];
let filteredIncidents = [];
let currentPage = 1;
let currentPageSize = 10;

// =======================
// FILTRO POR GALPÓN - VERSIÓN CON DEBUG
// =======================
async function cargarSelectFilterGalponesInci() {
    console.log("Iniciando cargarSelectFilterGalponesInci...");
    const select = document.getElementById("filter-galpon-inci");
    
    if (!select) {
        console.error("No se encontró el select con id 'filter-galpon-inci'");
        return;
    }
    
    console.log("Select encontrado:", select);

    try {
        if (!cacheGalponesInci) {
            console.log("Obteniendo galpones desde API...");
            cacheGalponesInci = await incident_chickenService.getGalponesAll();
            console.log("Galpones obtenidos:", cacheGalponesInci);
        }

        const galponesActivos = cacheGalponesInci.filter(g => g.estado === true);
        console.log("Galpones activos:", galponesActivos);

        const options = galponesActivos.map(g => 
            `<option value="${g.id_galpon}">${g.nombre}</option>`
        ).join("");
        
        select.innerHTML = `<option value="">Todos los galpones</option>${options}`;
        console.log("Opciones agregadas al select");

        // Remover listener anterior si existe
        select.removeEventListener("change", handleGalponChange);
        // Agregar nuevo listener
        select.addEventListener("change", handleGalponChange);
        console.log("vent listener agregado");

    } catch (e) {
        console.error("Error cargando filtro galpones:", e);
        select.innerHTML = `<option value="">Error al cargar</option>`;
    }
}

// Handler separado para el cambio de galpón
function handleGalponChange(e) {
    currentSelectedGalponInci = e.target.value || null;
    console.log("Galpón seleccionado:", currentSelectedGalponInci);
    currentPage = 1;
    aplicarFiltros();
}

// =======================
// APLICAR TODOS LOS FILTROS
// =======================
async function aplicarFiltros() {
    console.log("🔍 Aplicando filtros...");
    console.log("   - Galpón:", currentSelectedGalponInci);
    console.log("   - Fecha inicio:", activeFechaInicio);
    console.log("   - Fecha fin:", activeFechaFin);
    
    const tableBody = document.getElementById('incidente-gallina-table-body');
    if (!tableBody) {
        console.error("No se encontró incidente-gallina-table-body");
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando incidentes...</td></tr>';

    try {
        let data;
        if (activeFechaInicio && activeFechaFin) {
            console.log("Filtrando por fechas...");
            data = await incident_chickenService.getIsolationAllDate(
                activeFechaInicio, 
                activeFechaFin, 
                1, 
                1000
            );
        } else {
            console.log("Obteniendo todos los incidentes...");
            data = await incident_chickenService.getIsolationAll(1, 1000);
        }

        allIncidents = data.incidents || [];
        console.log("Total incidentes obtenidos:", allIncidents.length);

        if (currentSelectedGalponInci && currentSelectedGalponInci !== "") {
            filteredIncidents = allIncidents.filter(
                inc => String(inc.galpon_origen) === String(currentSelectedGalponInci)
            );
            console.log("Incidentes después del filtro por galpón:", filteredIncidents.length);
            console.log("   Filtrando por galpon_origen:", currentSelectedGalponInci);
        } else {
            filteredIncidents = [...allIncidents];
            console.log("ℹSin filtro de galpón, mostrando todos");
        }

        renderizarResultados();

    } catch (error) {
        console.error("❌ Error en aplicarFiltros:", error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos: ${error.message}</td></tr>`;
    }
}

// =======================
// RENDERIZAR RESULTADOS CON PAGINACIÓN LOCAL
// =======================
function renderizarResultados() {
    console.log("Renderizando resultados...");
    const tableBody = document.getElementById('incidente-gallina-table-body');
    if (!tableBody) return;

    if (filteredIncidents.length === 0) {
        let mensaje = '<tr><td colspan="7" class="text-center">';
        
        if (currentSelectedGalponInci && currentSelectedGalponInci !== "") {
            const galponNombre = cacheGalponesInci?.find(g => 
                String(g.id_galpon) === String(currentSelectedGalponInci)
            )?.nombre || "seleccionado";
            
            mensaje += `
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No se encontraron incidentes para el galpón: <strong>${galponNombre}</strong>
                </div>
            `;
        } else if (activeFechaInicio && activeFechaFin) {
            mensaje += `
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron incidentes en el rango de fechas:<br>
                    <strong>${activeFechaInicio} a ${activeFechaFin}</strong>
                </div>
            `;
        } else {
            mensaje += 'No se encontraron incidentes.';
        }
        
        mensaje += '</td></tr>';
        tableBody.innerHTML = mensaje;
        renderPagination(1, 1);
        return;
    }

    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);

    console.log(`Mostrando página ${currentPage}: ${paginatedIncidents.length} incidentes`);

    tableBody.innerHTML = paginatedIncidents.map(createIncidentRow).join('');

    const totalPages = Math.ceil(filteredIncidents.length / currentPageSize) || 1;
    renderPagination(totalPages, currentPage);
}

// --- FUNCIÓN UNIFICADA PARA TODOS LOS SELECTS ---
async function initializeSelects(selectType, selectedValue = null) {
  try {
    if (!cargarGalpones) {
      cargarGalpones = await incident_chickenService.getGalponesAll();
    }

    const galponesActivos = cargarGalpones.filter(g => g.estado === true);

    switch (selectType) {
      case 'galpones-create-modal':
        const selectCreate = document.getElementById('create_id_galpon');
        if (!selectCreate) return;

        selectCreate.innerHTML = '<option value="">Selecciona un galpón</option>' +
          galponesActivos.map(g => `<option value="${g.id_galpon}">${g.nombre}</option>`).join('');

        if (window.$ && $(selectCreate).select2) {
          $(selectCreate).select2({
            dropdownParent: $('#createIncidenteGallinaModal'),
            width: '100%',
            placeholder: 'Selecciona un galpón',
            allowClear: true
          });
        }
        break;

      case 'galpones-edit-modal':
        const selectEdit = document.getElementById('edit_id_galpon');
        if (!selectEdit) return;

        selectEdit.innerHTML = '<option value="">Selecciona un galpón</option>' +
          galponesActivos.map(g => 
            `<option value="${g.id_galpon}" ${g.id_galpon == selectedValue ? 'selected' : ''}>${g.nombre}</option>`
          ).join('');
        break;

      case 'tipos-incidente-create':
        const selectTipoCreate = document.getElementById('tipo_incidente_create');
        if (!selectTipoCreate) return;

        const tiposCreate = [
          "Enfermedad", "Herida", "Muerte", "Fuga", "Ataque Depredador",
          "Produccion", "Alimentacion", "Plaga", "Estres termico", "Otro"
        ];

        selectTipoCreate.innerHTML = '<option value="">Seleccione un tipo</option>' +
          tiposCreate.map(tipo => `<option value="${tipo}">${tipo}</option>`).join('');
        break;

      case 'tipos-incidente-edit':
        const selectTipoEdit = document.getElementById('edit-tipo_incidente');
        if (!selectTipoEdit) return;

        const tiposEdit = [
          "Enfermedad", "Herida", "Muerte", "Fuga", "Ataque Depredador",
          "Produccion", "Alimentacion", "Plaga", "Estres termico", "Otro"
        ];

        selectTipoEdit.innerHTML = '<option value="">Seleccione un tipo</option>' +
          tiposEdit.map(tipo => 
            `<option value="${tipo}" ${tipo === selectedValue ? 'selected' : ''}>${tipo}</option>`
          ).join('');
        break;

      default:
        console.warn('Tipo de select no reconocido:', selectType);
    }
  } catch (error) {
    console.error(`Error al inicializar select ${selectType}:`, error);
  }
}

function createIncidentRow(incident) {
  const incidentId = incident.id_inc_gallina;

  const fecha = new Date(incident.fecha_hora);
  const fechaFormateada = fecha.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true
  });

  return `
    <tr>
      <td class="px-0">${incident.nombre}</td>
      <td class="px-0">${incident.tipo_incidente}</td>
      <td class="px-0">${incident.cantidad}</td>
      <td class="px-0">${incident.descripcion}</td>
      <td class="px-0">
        <div class="form-check form-switch ms-2 d-inline-block">
          <input class="form-check-input incident-status-switch" type="checkbox" role="switch" 
                 id="switch-${incidentId}" data-incident-id="${incidentId}" 
                 ${incident.esta_resuelto ? 'checked' : ''}>
          <label class="form-check-label" for="switch-${incidentId}">
            ${incident.esta_resuelto ? 'Resuelto' : 'Pendiente'}
          </label>
        </div>
      </td>
      <td class="px-0">${fechaFormateada}</td>
      <td class="text-end justify-content-end gap-2">
        <button class="btn btn-sm btn-success btn-edit-incident" data-incident-id="${incidentId}" aria-label="Editar">
          <i class="fa-regular fa-pen-to-square me-0"></i>
        </button>
        <button class="btn btn-sm btn-success btn-aislar" data-id-inc-gallina="${incidentId}" data-id-galpon="${incident.galpon_origen}" aria-label="Aislar">
          <i class="fa-solid fa-kit-medical me-0"></i>
        </button>
      </td>
    </tr>
  `;
}


//___________________________________ función isolations________________________________
async function renderIncidentes() {
    try {
        const [incidentes, isolations] = await Promise.all([
            incident_chickenService.getChickenIncidents(),
            isolationService.getIsolations()
        ]);

        const aislados = new Set(isolations.map(i => i.id_incidente_gallina));

        incidentes.forEach(inc => {
            const btn = document.querySelector(`[data-id-inc-gallina="${inc.id_inc_gallina}"]`);
            if (!btn) return;

            if (aislados.has(inc.id_inc_gallina)) {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        });
    } catch (error) {
        console.error("Error al renderizar incidentes:", error);
    }
}

const observer = new MutationObserver(() => {
  const botones = document.querySelectorAll('.btn-aislar');
  if (botones.length > 0) {
    renderIncidentes();
  }
});

observer.observe(document.getElementById('main-content'), {
  childList: true,
  subtree: true
});

function obtenerFecha() {
  const fechaLocal = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())} ${pad(fechaLocal.getHours())}:${pad(fechaLocal.getMinutes())}:${pad(fechaLocal.getSeconds())}`;
  return fechaPC;
}

// --- Escuchar clicks en la tabla ---
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-aislar');
  if (!btn) return;

  const id_inc_gallina = btn.dataset.idIncGallina;
  const id_galpon = btn.dataset.idGalpon;

  if (!id_inc_gallina || !id_galpon) return;

  aislarGallina(id_inc_gallina, id_galpon, btn);
});

async function aislarGallina(id_incidente_gallina, galpon_origen, btn) { 
  try {
    const newIsolationData = {
      id_incidente_gallina: id_incidente_gallina,
      id_galpon: galpon_origen,
      fecha_hora: obtenerFecha()
    };

    await isolationService.createIsolation(newIsolationData);
    btn.disabled = true;

    Swal.fire({
      icon: 'success',
      title: '¡Gallina enviada a aislamiento!',
      text: 'El aislamiento se registró correctamente.',
      confirmButtonColor: '#28a745'
    });
    initIsolations(); 
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al registrar el aislamiento.',
      confirmButtonColor: '#d33'
    });
  }
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#isolations');
  if (!btn) return;  
  
  try {
    const response = await fetch('pages/aislamientos.html');
    const html = await response.text();
    document.getElementById('main-content').innerHTML = html;
    initIsolations();
  } catch (error) {
    console.error('Error al cargar aislamientos:', error);
  }
});

function renderPagination(total_pages, currentPageNum = 1) {
    const container = document.querySelector("#pagination");
    if (!container) return;

    container.innerHTML = "";

    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPageNum === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link text-success" href="#"><i class="fas fa-chevron-left"></i></a>`;
    prevLi.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPageNum !== 1) {
            currentPage = currentPageNum - 1;
            renderizarResultados();
        }
    });
    container.appendChild(prevLi);

    const maxVisible = 5;
    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        container.appendChild(createPageLi(1, currentPageNum));
        if (startPage > 2) container.appendChild(createDotsLi());
    }

    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createPageLi(i, currentPageNum));
    }

    if (endPage < total_pages) {
        if (endPage < total_pages - 1) container.appendChild(createDotsLi());
        container.appendChild(createPageLi(total_pages, currentPageNum));
    }

    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPageNum === total_pages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link text-success" href="#"><i class="fas fa-chevron-right"></i></a>`;
    nextLi.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPageNum !== total_pages) {
            currentPage = currentPageNum + 1;
            renderizarResultados();
        }
    });
    container.appendChild(nextLi);
}

function createPageLi(page, currentPageNum) {
    const li = document.createElement("li");
    const isActive = page === currentPageNum;

    li.className = `page-item ${isActive ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link ${isActive ? "bg-success border-success text-white" : "text-success"}" href="#">${page}</a>`;

    li.addEventListener("click", (e) => {
        e.preventDefault();
        if (!isActive) {
            currentPage = page;
            renderizarResultados();
        }
    });

    return li;
}

function createDotsLi() {
    const li = document.createElement("li");
    li.className = "page-item disabled";
    li.innerHTML = `<a class="page-link text-success">...</a>`;
    return li;
}

function filtrarIncidentes(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    Swal.fire({
      icon: 'info',
      title: 'Error',
      text: 'Debe seleccionar ambas fechas',
      confirmButtonColor: 'rgba(51, 136, 221, 1)'
    });
    return;
  }

  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;
  currentPage = 1;
  aplicarFiltros();
}

async function openEditModal(id_incidente_gallina) {
  const modalElement = document.getElementById('editIncidenteGallinaModal');
  modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);

  try {
    const incident = await incident_chickenService.getChickenIncidentById(id_incidente_gallina);
    
    document.getElementById('edit-id_inc_gallina').value = incident.id_inc_gallina;
    document.getElementById('edit-cantidad').value = incident.cantidad;
    document.getElementById('edit-descripcion').value = incident.descripcion;
    
    await initializeSelects('galpones-edit-modal', incident.galpon_origen);
    await initializeSelects('tipos-incidente-edit', incident.tipo_incidente);
    
    modalInstance.show();
    
  } catch (error) {
    console.error("Error al abrir modal:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del incidente: ' + error.message,
      confirmButtonColor: '#d33'
    });
  }
}

async function handleTableClick(event) {
  const editButton = event.target.closest('.btn-edit-incident');
  if (editButton) {
    const idIncidente = editButton.dataset.incidentId;
    await openEditModal(idIncidente);
    return;
  }
}

async function handleUpdateSubmit(event) {
  event.preventDefault();
  
  const incidentId = document.getElementById('edit-id_inc_gallina').value;
  const updatedData = {
    galpon_origen: parseInt(document.getElementById('edit_id_galpon').value),
    tipo_incidente: document.getElementById('edit-tipo_incidente').value,
    cantidad: parseInt(document.getElementById('edit-cantidad').value),
    descripcion: document.getElementById('edit-descripcion').value
  };

  try {
    await incident_chickenService.updateChickenIncident(incidentId, updatedData);
    modalInstance.hide();
    aplicarFiltros();
    
    Swal.fire({
      icon: 'success',
      title: '¡Actualizado!',
      text: 'Incidente actualizado correctamente.',
      confirmButtonColor: '#28a745'
    });
    
  } catch (error) {
    console.error("Error al actualizar:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el incidente: ' + (error.message || 'Error desconocido'),
      confirmButtonColor: '#d33'
    });
  }
}

async function handleCreateSubmit(event) {
  event.preventDefault();

  const fechaLocal = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())} ${pad(fechaLocal.getHours())}:${pad(fechaLocal.getMinutes())}:${pad(fechaLocal.getSeconds())}`;

  // Si hay un filtro activo, usar ese galpón (aunque esté disabled, no se envía en el form)
  let galponSeleccionado;
  if (currentSelectedGalponInci && currentSelectedGalponInci !== "") {
    galponSeleccionado = parseInt(currentSelectedGalponInci);
  } else {
    galponSeleccionado = parseInt(document.getElementById('create_id_galpon').value);
  }

  const newIncidentData = {
    galpon_origen: galponSeleccionado,
    tipo_incidente: document.getElementById('tipo_incidente_create').value,
    cantidad: parseInt(document.getElementById('cantidad').value),
    descripcion: document.getElementById('description').value,
    fecha_hora: fechaPC,
    esta_resuelto: false
  };

  if (!newIncidentData.galpon_origen || newIncidentData.galpon_origen <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'Debe seleccionar un galpón válido',
      confirmButtonColor: '#d33'
    });
    return;
  }

  if (!newIncidentData.tipo_incidente) {
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'Debe seleccionar un tipo de incidente',
      confirmButtonColor: '#d33'
    });
    return;
  }

  if (!newIncidentData.cantidad || newIncidentData.cantidad < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'La cantidad debe ser un número positivo',
      confirmButtonColor: '#d33'
    });
    return;
  }

  try {
    await incident_chickenService.createChickenIncident(newIncidentData);

    const createIncidenteModalEl = document.getElementById('createIncidenteGallinaModal');
    const createIncidenteModalInstance = bootstrap.Modal.getInstance(createIncidenteModalEl);
    createIncidenteModalInstance.hide();

    createIncidenteModalEl.addEventListener('hidden.bs.modal', function handler() {
      createIncidenteModalEl.removeEventListener('hidden.bs.modal', handler);
      document.getElementById('create-incidente-gallina-form').reset();

      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Incidente creado correctamente.',
        confirmButtonColor: '#28a745'
      });

      aplicarFiltros();
    });

  } catch (error) {
    console.error("Error al crear incidente:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al crear el incidente: ' + (error.message || 'Error desconocido'),
      confirmButtonColor: '#d33'
    });
  }
}

async function handleStatusSwitch(event) {
  const switchElement = event.target;

  if (!switchElement.classList.contains('incident-status-switch')) return;

  const incidentId = switchElement.dataset.incidentId;
  const newStatus = switchElement.checked;
  const actionText = newStatus ? 'resuelto' : 'pendiente';

  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: `¿Deseas cambiar a ${actionText} este incidente?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await incident_chickenService.changeChickenStatus(incidentId, newStatus);

      const label = switchElement.nextElementSibling;
      if (label) label.textContent = newStatus ? 'Resuelto' : 'Pendiente';

      await Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Se cambio exitosamente.',
        confirmButtonColor: '#28a745'
      });

    } catch (error) {
      console.error("Error:", error);
      switchElement.checked = !newStatus;
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el estado del incidente: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  } else {
    switchElement.checked = !newStatus;
  }
}

function limpiarFiltros() {
  activeFechaInicio = "";
  activeFechaFin = "";
  currentSelectedGalponInci = null;
  currentPage = 1;
  
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  document.getElementById("search-incidente-gallina").value = "";
  
  const galponSelect = document.getElementById('filter-galpon-inci');
  if (galponSelect) {
    galponSelect.value = "";
  }
  
  aplicarFiltros();
}

document.addEventListener('DOMContentLoaded', function() {
  const BuscarIncidente = document.getElementById('search-incidente-gallina');
  if (BuscarIncidente) {
    BuscarIncidente.addEventListener('input', () => {
      const filter = BuscarIncidente.value.toLowerCase();
      const tableBody = document.getElementById('incidente-gallina-table-body');
      if (!tableBody) return;
      
      const rows = tableBody.querySelectorAll('tr');

      rows.forEach(row => {
        const galponCell = row.cells[0]?.textContent.toLowerCase() || '';
        const tipoCell = row.cells[1]?.textContent.toLowerCase() || '';
        const cantidadCell = row.cells[2]?.textContent.toLowerCase() || '';
        const descripcionCell = row.cells[3]?.textContent.toLowerCase() || '';
        const estadoCell = row.cells[4]?.textContent.toLowerCase() || '';
        const fechaCell = row.cells[5]?.textContent.toLowerCase() || '';

        const match = galponCell.includes(filter) || 
                      tipoCell.includes(filter) || 
                      cantidadCell.includes(filter) || 
                      descripcionCell.includes(filter) || 
                      estadoCell.includes(filter) || 
                      fechaCell.includes(filter);
        row.style.display = match ? '' : 'none';
      });
    });
  }
});

async function init(page = 1, page_size = 10, fechaInicio = activeFechaInicio, fechaFin = activeFechaFin) {
  console.log("Inicializando módulo de incidentes de gallinas...");
  
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;
  currentPage = page;
  currentPageSize = page_size;

  const tableBody = document.getElementById('incidente-gallina-table-body');
  if (!tableBody) {
    console.error("No se encontró incidente-gallina-table-body");
    return;
  }

  await cargarSelectFilterGalponesInci();
  await aplicarFiltros();

  const editForm = document.getElementById('edit-incidente-gallina-form');
  const createForm = document.getElementById('create-incidente-gallina-form');
  
  if (tableBody) {
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.removeEventListener('change', handleStatusSwitch);
    tableBody.addEventListener('click', handleTableClick);
    tableBody.addEventListener('change', handleStatusSwitch);
  }
  
  if (editForm) {
    editForm.removeEventListener('submit', handleUpdateSubmit);
    editForm.addEventListener('submit', handleUpdateSubmit);
  }
  
  if (createForm) {
    createForm.removeEventListener('submit', handleCreateSubmit);
    createForm.addEventListener('submit', handleCreateSubmit);
  }

  // Configurar evento para abrir modal de crear
  setupCreateModalHandler();
  
  console.log("Inicialización completada");
}

// Nueva función para manejar la apertura del modal de crear
function setupCreateModalHandler() {
  const createModalElement = document.getElementById('createIncidenteGallinaModal');
  if (!createModalElement) {
    console.warn("No se encontró el modal de crear incidente");
    return;
  }

  // Evento cuando se muestra el modal
  createModalElement.addEventListener('show.bs.modal', async function() {
    console.log("Cargando selects del modal de crear...");
    await initializeSelects('galpones-create-modal');
    await initializeSelects('tipos-incidente-create');
    
    // Si hay un galpón filtrado, pre-seleccionarlo y bloquearlo
    if (currentSelectedGalponInci && currentSelectedGalponInci !== "") {
      const selectCreate = document.getElementById('create_id_galpon');
      if (selectCreate) {
        selectCreate.value = currentSelectedGalponInci;
        
        // Deshabilitar el select para que no se pueda cambiar
        selectCreate.disabled = true;
        
        // Si está usando Select2, actualizar y deshabilitar también
        if (window.$ && $(selectCreate).data('select2')) {
          $(selectCreate).val(currentSelectedGalponInci).trigger('change');
          $(selectCreate).prop('disabled', true);
        }
        
        const galponNombre = cacheGalponesInci?.find(g => 
          String(g.id_galpon) === String(currentSelectedGalponInci)
        )?.nombre || "";
        
        console.log(`Galpón bloqueado: ${galponNombre} (ID: ${currentSelectedGalponInci})`);
      }
    } else {
      // Si NO hay filtro, asegurarse de que el select esté habilitado
      const selectCreate = document.getElementById('create_id_galpon');
      if (selectCreate) {
        selectCreate.disabled = false;
        if (window.$ && $(selectCreate).data('select2')) {
          $(selectCreate).prop('disabled', false);
        }
      }
    }
    
    console.log("Selects cargados en modal de crear");
  });
  
  // Evento cuando se cierra el modal - limpiar el formulario
  createModalElement.addEventListener('hidden.bs.modal', function() {
    const createForm = document.getElementById('create-incidente-gallina-form');
    if (createForm) {
      createForm.reset();
      
      // Habilitar el select de nuevo si estaba deshabilitado
      const selectCreate = document.getElementById('create_id_galpon');
      if (selectCreate) {
        selectCreate.disabled = false;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM cargado - inicializando incidentes gallina");
    
    const btnApplyFilter = document.getElementById("btn-apply-date-filter");
    if (btnApplyFilter) {
        btnApplyFilter.addEventListener("click", () => {
            const fechaInicio = document.getElementById("fecha-inicio").value;
            const fechaFin = document.getElementById("fecha-fin").value;
            filtrarIncidentes(fechaInicio, fechaFin);
        });
    }

    const btnClear = document.getElementById('btn_clear_filters');
    if (btnClear) {
        btnClear.addEventListener('click', limpiarFiltros);
    }

    init(1, 10);
});

export { init };
