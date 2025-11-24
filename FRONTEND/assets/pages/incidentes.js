import { incidentesService } from '../js/api/incidentes.service.js';

let modalInstance = null;
let fincas = [];

function createIncidenteRow(incidente) {
    return `
    <tr>
      <td class="px-0">${incidente.descripcion}</td>
      <td class="px-0">
        <small>${new Date(incidente.fecha_hora).toLocaleString('es-ES')}</small>
      </td>
      <td class="px-0">
        <span class="">${incidente.nombre_finca || `Finca ${incidente.id_finca}`}</span>
      </td>
      <td class="px-0">
        <div class="form-check form-switch d-inline-block">
          <input class="form-check-input switch-status" type="checkbox" 
                 data-incidente-id="${incidente.id_incidente}"
                 ${incidente.esta_resuelta ? 'checked disabled' : ''}>
          <label class="form-check-label small ms-2">
            ${incidente.esta_resuelta ? 'Resuelto' : 'Pendiente'}
          </label>
        </div>
      </td>
      <td class="px-0 text-end">
        <div class="btn-group">
          ${!incidente.esta_resuelta ? `
            <button class="btn btn-sm btn-success btn-edit-incidente" data-incidente-id="${incidente.id_incidente}">
                <i class="fa-regular fa-pen-to-square"></i>
            </button>
          ` : ''}
          
          ${incidente.esta_resuelta ? `
            <button class="btn btn-sm btn-secondary btn-delete-incidente" data-incidente-id="${incidente.id_incidente}">
                <i class="fa-regular fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `;
}

// --- LÓGICA DE MODALES ---

async function openEditModal(id_incidente) {
    const modalElement = document.getElementById('edit-incidente-modal');
    if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalElement);
    }

    try {
        const incidente = await incidentesService.getIncidenteById(id_incidente);

        document.getElementById('edit-incidente-id').value = incidente.id_incidente;
        document.getElementById('edit-descripcion').value = incidente.descripcion;
        document.getElementById('edit-fecha_hora').value = new Date(incidente.fecha_hora).toISOString().slice(0, 16);

        // Cargar y seleccionar finca
        await loadLandsSelect('edit-id_finca', incidente.id_finca);

        modalInstance.show();
    } catch (error) {
        console.error('Error al obtener datos del incidente:', error);
        alert('No se pudieron cargar los datos del incidente.');
    }
}

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
    event.preventDefault();
    const incidenteId = document.getElementById('edit-incidente-id').value;
    const updatedData = {
        descripcion: document.getElementById('edit-descripcion').value,
        fecha_hora: document.getElementById('edit-fecha_hora').value,
        id_finca: document.getElementById('edit-id_finca').value,
    };

    try {
        await incidentesService.updateIncidente(incidenteId, updatedData);
        modalInstance.hide();
        init();
        Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Incidente actualizado correctamente",
            showConfirmButton: false,
            timer: 1500
        });
    } catch (error) {
        console.error('Error al actualizar el incidente:', error);
        alert('No se pudo actualizar el incidente.');
    }
}

async function handleTableClick(event) {
    // Manejador para el botón de editar
    const editButton = event.target.closest('.btn-edit-incidente');
    if (editButton) {
        const id_incidente = editButton.dataset.incidenteId;
        openEditModal(id_incidente);
        return;
    }

    // Manejador para el interruptor de estado
    const switchButton = event.target.closest('.switch-status');
    if (switchButton && !switchButton.disabled) {
        const id_incidente = switchButton.dataset.incidenteId;
        await handleStatusChange(id_incidente);
        return;
    }

    // Manejador para el botón de eliminar
    const deleteButton = event.target.closest('.btn-delete-incidente');
    if (deleteButton) {
        const id_incidente = deleteButton.dataset.incidenteId;
        await handleDeleteIncidente(id_incidente);
        return;
    }
}

async function handleStatusChange(incidenteId) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas marcar este incidente como resuelto?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiarlo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#198754'
    });

    if (confirmacion.isConfirmed) {
        try {
            await incidentesService.changeStatusIncidente(incidenteId);
            Swal.fire({
                position: "top-center",
                icon: "success",
                title: "Estado del incidente cambiado correctamente",
                showConfirmButton: false,
                timer: 1500
            });
            init();
        } catch (error) {
            console.error('Error al cambiar estado del incidente:', error);
            Swal.fire({
                position: "top-center",
                icon: "warning",
                title: "No se pudo cambiar el estado del incidente",
                showConfirmButton: false,
                timer: 1500
            });
        }
    }
}

async function handleDeleteIncidente(incidenteId) {
    const confirmacion = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#6c757d'
    });

    if (confirmacion.isConfirmed) {
        try {
            await incidentesService.deleteIncidente(incidenteId);
            Swal.fire({
                position: "top-center",
                icon: "success",
                title: "Incidente eliminado correctamente",
                showConfirmButton: false,
                timer: 1500
            });
            init();
        } catch (error) {
            console.error('Error al eliminar el incidente:', error);
            Swal.fire({
                position: "top-center",
                icon: "warning",
                title: "No se pudo eliminar el incidente",
                showConfirmButton: false,
                timer: 1500
            });
        }
    }
}

async function handleCreateSubmit(event) {
    event.preventDefault();

    const newIncidenteData = {
        descripcion: document.getElementById('create-descripcion').value,
        fecha_hora: document.getElementById('create-fecha_hora').value,
        id_finca: document.getElementById('create-id_finca').value,
        esta_resuelta: false
    };

    try {
        await incidentesService.createIncidente(newIncidenteData);
        const modal = bootstrap.Modal.getInstance(document.getElementById('create-incidente-modal'));
        if (modal) modal.hide();
        document.getElementById('create-incidente-form').reset();
        document.getElementById('create-fecha_hora').value = getCurrentDateTime();

        Swal.fire({
            position: "top-center",
            icon: "success",
            title: "Incidente creado correctamente",
            showConfirmButton: false,
            timer: 1500
        });
        init();
    } catch (error) {
        console.error('Error al crear el incidente:', error);
        alert('No se pudo crear el incidente.');
    }
}

async function loadLandsSelect(selectId, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando fincas...</option>';

    try {
        const lands = await incidentesService.getLandsActive();

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

async function loadLandsFilter() {
    const select = document.getElementById('filtro-finca');
    if (!select) return;
    select.innerHTML = '<option value="all">Todas las fincas</option>';
    try {
        const lands = await incidentesService.getLandsActive();
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

async function applyFilters() {
    const landFilter = document.getElementById('filtro-finca');
    const statusFilter = document.getElementById('filtro-estado');
    const tableBody = document.getElementById('incidentes-table-body');
    
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando incidentes...</td></tr>';

    try {
        let incidentes;
        const landValue = landFilter ? landFilter.value : 'all';
        const statusValue = statusFilter ? statusFilter.value : 'all';

        if (statusValue !== 'all') {
            const response = await incidentesService.getIncidentesByEstado(statusValue === 'true', 0, 1000);
            incidentes = response.incidentes;
        } else {
            const response = await incidentesService.getIncidentes(0, 1000);
            incidentes = response.incidentes;
        }

        if (landValue !== 'all') {
            incidentes = incidentes.filter(incidente => incidente.id_finca == landValue);
        }

        // Ordenar por fecha de creación (más reciente primero)
        incidentes.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

        if (incidentes && incidentes.length > 0) {
            tableBody.innerHTML = incidentes.map(createIncidenteRow).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron incidentes.</td></tr>';
        }
    } catch (error) {
        console.error('Error al filtrar incidentes:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar incidentes.</td></tr>`;
    }
}

function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().slice(0, 16);
}

async function init() {
    await loadLandsFilter();

    const landFilter = document.getElementById('filtro-finca');
    const statusFilter = document.getElementById('filtro-estado');

    if (landFilter) {
        landFilter.removeEventListener('change', applyFilters);
        landFilter.addEventListener('change', applyFilters);
    }

    if (statusFilter) {
        statusFilter.removeEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);
    }

    await applyFilters();

    const createModal = document.getElementById('create-incidente-modal');
    if (createModal) {
        createModal.addEventListener('show.bs.modal', () => {
            loadLandsSelect('create-id_finca');
            document.getElementById('create-fecha_hora').value = getCurrentDateTime();
        });
    }

    const editModal = document.getElementById('edit-incidente-modal');
    if (editModal) {
        editModal.addEventListener('show.bs.modal', () => {
            // La finca se carga cuando se abre el modal de edición específico
        });
    }

    const editForm = document.getElementById('edit-incidente-form');
    const createForm = document.getElementById('create-incidente-form');
    const tableBody = document.getElementById('incidentes-table-body');

    if (tableBody) {
        tableBody.removeEventListener('click', handleTableClick);
        tableBody.addEventListener('click', handleTableClick);
    }

    if (editForm) {
        editForm.removeEventListener('submit', handleUpdateSubmit);
        editForm.addEventListener('submit', handleUpdateSubmit);
    }

    if (createForm) {
        createForm.removeEventListener('submit', handleCreateSubmit);
        createForm.addEventListener('submit', handleCreateSubmit);
    }
}

export { init };
