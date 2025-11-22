import { shedService } from '../js/api/shed.service.js';

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let originalId = null;
let createModalInstance = null; // Guardará la instancia del modal de creación

function createShedRow(shed) {
  const statusBadge = shed.estado 
    ? `<span class="badge bg-success">Activo</span>`
    : `<span class="badge bg-danger">Inactivo</span>`;

  const shedId = shed.id_galpon;

  return `
    <tr>
      <td class="px-0">
        <div class="d-flex align-items-center">
          <div class="ms-3">
            <h6 class="mb-0">${shed.nombre_finca}</h6>
          </div>
        </div>
      </td>
      <td class="px-0">${shed.nombre}</td>
      <td class="px-0">${shed.capacidad}</td>
      <td class="px-0">${shed.cant_actual}</td>
      <td class="px-0">
        <div class="form-check form-switch">
            <input class="form-check-input shed-status-switch" type="checkbox" role="switch" 
                   id="switch-${shedId}" data-shed-id="${shedId}" 
                   ${shed.estado ? 'checked' : ''}>
            <label class="form-check-label" for="switch-${shedId}">
              ${shed.estado ? 'Activo' : 'Inactivo'}
            </label>
        </div>
      </td>
      <td class="text-end">
          <button class="btn btn-sm btn-success btn-edit-shed" data-shed-id="${shed.id_galpon}"><i class="fa-regular fa-pen-to-square"></i></button>
      </td>
    </tr>
  `;
}

// --- LÓGICA DE MODAL ---

async function openEditModal(id_galpon) {
  const modalElement = document.getElementById('edit-shed-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const shed = await shedService.getShedById(id_galpon);
    originalId = shed.id_galpon;
    document.getElementById('edit-shed-id').value = shed.id_galpon;
    // Cargar opciones de fincas primero
    await loadLandsSelect('edit-nombre_finca'); 
    document.getElementById('edit-nombre_finca').value = shed.id_finca;
    document.getElementById('edit-nombre-galpon').value = shed.nombre;
    document.getElementById('edit-capacidad').value = shed.capacidad;
    document.getElementById('edit-cant-actual').value = shed.cant_actual;
    modalInstance.show();
  } catch (error) {
    console.error('Error al obtener datos del galpón ${shedId}: ', error);
    alert('No se pudieron cargar los datos del galpón.');
  }
}

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
  event.preventDefault();
  const shedId = document.getElementById('edit-shed-id').value;
  const updatedData = {
    id_finca: document.getElementById('edit-nombre_finca').value,
    nombre: document.getElementById('edit-nombre-galpon').value,
    capacidad: document.getElementById('edit-capacidad').value,
    cant_actual: document.getElementById('edit-cant-actual').value,
  };

  try {
    await shedService.updateShed(shedId, updatedData);
    modalInstance.hide();
    Swal.fire({
        position: "top-center",
        icon: "success",
        title: `Galpón actualizado con éxito.`,
        showConfirmButton: false,
        timer: 1500
    });
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    console.error('Error al actualizar el galpón ${shedId}:', error);
    alert('No se pudo actualizar el galpón.');
  }
}

async function handleTableClick(event) {
  // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-shed');
  if (editButton) {
    const id_galpon = editButton.dataset.shedId;
    console.log(id_galpon);
    openEditModal(id_galpon);
    return;
  }
}

async function handleStatusSwitch(event) {
  const switchElement = event.target;
  if (!switchElement.classList.contains('shed-status-switch')) return;

  const confirmacion = await Swal.fire({
    title: '¿Estás seguro?',
    text: `¿Deseas ${switchElement.checked ? 'activar' : 'desactivar'} este galpón?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-secondary'
    }
  });

  const shedId = switchElement.dataset.shedId;
  const newStatus = switchElement.checked;
  const actionText = newStatus ? 'activar' : 'desactivar';

  if (confirmacion.isConfirmed) {
    try {
      await shedService.deleteShed(shedId, newStatus);
      Swal.fire({
        position: "top-center",
        icon: "success",
        title: `El galpón ha sido ${newStatus ? 'activado' : 'desactivado'} exitosamente.`,
        showConfirmButton: false,
        timer: 1500
      });
      init(); // Recargamos la tabla
    } catch (error) {
      console.error(`Error al ${actionText} el galpón ${shedId}:`, error);
      Swal.fire({
        position: "top-center",
        icon: "warning",
        title: `No se pudo ${actionText} el galpón.`,
        showConfirmButton: false,
        timer: 1500
      });
      switchElement.checked = !newStatus; // revertimos el cambio visual
    }
  } else {
    switchElement.checked = !newStatus;
  }
}

// manejador de formulario crear usuarios
async function handleCreateSubmit(event) {
  event.preventDefault();
  
  // // Obtenemos los datos del usuario logueado para el galpon
  // const currentUser = JSON.parse(localStorage.getItem('user'));
  const newShedData = {
    id_finca: document.getElementById('create-nombre_finca').value,
    nombre: document.getElementById('create-nombre-galpon').value,
    capacidad: document.getElementById('create-capacidad').value,
    cant_actual: document.getElementById('create-cant-actual').value,
    estado: true // Por defecto, los galpones se crean activos
  };

  try {
    await shedService.createShed(newShedData);
    const modal = bootstrap.Modal.getInstance(document.getElementById('create-shed-modal'));
    if (modal) modal.hide();
    document.getElementById('create-shed-form').reset();
    Swal.fire({
        position: "top-center",
        icon: "success",
        title: `Galpón creado con éxito.`,
        showConfirmButton: false,
        timer: 1500
      });
    init(); // Recargamos la tabla para ver el nuevo usuario
  } catch (error) {

    console.error('Error al crear el galpón:', error);
    Swal.fire({
        position: "top-center",
        icon: "danger",
        title: `No se pudo crear el galpón.`,
        showConfirmButton: false,
        timer: 1500
      });
  }
}

async function loadLandsSelect(selectId, selectedValue = '') {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Cargando fincas...</option>';

  try {
    const lands = await shedService.getLandsActive();

    select.innerHTML = '<option value="">Seleccione una finca</option>';

    lands.forEach(land => {
      const option = document.createElement('option');
      option.value = land.id_finca;
      option.textContent = land.nombre;

      if (String(land.id_finca) === String(selectedValue)) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error al cargar las fincas activas:', error);
    select.innerHTML = '<option value="">Error al cargar fincas</option>';
    if (window.Swal) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las fincas.',
        confirmButtonText: 'Aceptar'
      });
    }
  }
}

// Cargar todos los galpones
async function loadAllSheds() {
  try {
    const sheds = await shedService.getSheds();
    renderShedsTable(sheds);
  } catch (error) {
    console.error("Error cargando todos los galpones:", error);
  }
}

// Cargar galpones por finca seleccionada
async function loadShedsByLand(landId) {
  try {
    const sheds = await shedService.getShedsByLand(landId);
    renderShedsTable(sheds);
  } catch (error) {
    console.error("Error filtrando galpones:", error);
  }
}

// Cargar fincas activas en el filtro de galpones
async function loadLandsFilter() {
  const select = document.getElementById('filtro-finca');
  if (!select) return;
  select.innerHTML = '<option value="all">Todas las fincas</option>';
  try {
    const lands = await shedService.getLandsActive();
    lands.forEach(land => {
      const option = document.createElement('option');
      option.value = land.id_finca;
      option.textContent = land.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar fincas en filtro:', error);
    select.innerHTML = '<option value="all">Todas las fincas</option>';
  }
}

// Manejador para el filtro de finca
async function handleLandFilterChange() {
  const select = document.getElementById('filtro-finca');
  const value = select ? select.value : 'all';
  const tableBody = document.getElementById('sheds-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando galpones ... </td></tr>';
  try {
    let sheds;
    if (value === 'all') {
      sheds = await shedService.getSheds();
    } else {
      sheds = await shedService.getShedsByLand(value);
    }
    if (sheds && sheds.length > 0) {
      tableBody.innerHTML = sheds.map(createShedRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron galpones.</td></tr>';
    }
  } catch (error) {
    console.error('Error al filtrar galpones:', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">No tienes permiso para ver este modulo.</td></tr>`;
  }
}

// Modificar init para cargar filtro y listeners
async function init() {
  await loadLandsFilter();
  const landFilter = document.getElementById('filtro-finca');
  if (landFilter) {
    landFilter.removeEventListener('change', handleLandFilterChange);
    landFilter.addEventListener('change', handleLandFilterChange);
  }
  // Al iniciar, mostrar todos los galpones
  await handleLandFilterChange();

  const tableBody = document.getElementById('sheds-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando galpones ... </td></tr>';

  try {
    const sheds = (await shedService.getSheds());
    if (sheds && sheds.length > 0) {
        tableBody.innerHTML = sheds.map(createShedRow).join('');
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron galpones.</td></tr>';
    }
  } catch (error) {
    console.error('Error al obtener los galpones:', error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">No tienes permiso para ver este modulo.</td></tr>`;
  }

  const createModal = document.getElementById('create-shed-modal');
  if (createModal) {
    createModal.addEventListener('show.bs.modal', () => {
      loadLandsSelect('create-nombre_finca');
    });
  }

  // Aplicamos el patrón remove/add para evitar listeners duplicados
  const editForm = document.getElementById('edit-shed-form');
  const createForm = document.getElementById('create-shed-form');
  tableBody.removeEventListener('click', handleTableClick);
  tableBody.addEventListener('click', handleTableClick);
  tableBody.removeEventListener('change', handleStatusSwitch);
  tableBody.addEventListener('change', handleStatusSwitch);
  editForm.removeEventListener('submit', handleUpdateSubmit);
  editForm.addEventListener('submit', handleUpdateSubmit);
  createForm.removeEventListener('submit', handleCreateSubmit);
  createForm.addEventListener('submit', handleCreateSubmit);

}

export { init };
