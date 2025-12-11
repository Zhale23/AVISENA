import { rolesService } from "../js/api/roles.service.js";

console.log("Roles JS cargado");

function createRolRow(rol) {
  return `
    <tr>
        <td data-label="Nombre Rol">${rol.nombre_rol}</td>
        <td data-label="Descripción">${rol.descripcion}</td>

        <td class="text-center" data-label="Estado" class="estado-cell">
          <div class="form-check form-switch">
            <input 
              class="form-check-input switch-estado" 
              type="checkbox"
              data-id="${rol.rol_id}"
              ${rol.estado == 1 ? "checked" : ""}
            >
          </div>
        </td>
    </tr>
  `;
}

async function handleSwitchChange(event) {
  if (!event.target.classList.contains("switch-estado")) return;

  const id = event.target.dataset.id;
  const nuevoEstado = event.target.checked;

  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Estás a punto de cambiar el estado de este rol.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d"
  });

  if (!result.isConfirmed) {
    event.target.checked = !nuevoEstado;
    return;
  }

  try {
    const rolCompleto = await rolesService.GetRolById(id);

    const updateRol = {
      nombre_rol: rolCompleto.nombre_rol,
      descripcion: rolCompleto.descripcion,
      estado: nuevoEstado
    };

    await rolesService.UpdateRolById(id, updateRol);

    Swal.fire({
      icon: "success",
      title: "Rol actualizado",
      text: "El rol se modificó correctamente.",
      confirmButtonColor: "#28a745"
    });

  } catch (error) {
    console.error(error);
    event.target.checked = !nuevoEstado;

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cambiar el estado."
    });
  }
}

// =============================
// CLICK EN BOTÓN EDITAR
// =============================
async function handleEditClick(event) {
  const btn = event.target.closest(".btn-edit");
  if (!btn) return;

  const id = btn.dataset.id;

  try {
    const rol = await rolesService.GetRolById(id);

    document.getElementById("edit-rol-id").value = rol.rol_id;
    document.getElementById("edit-nombre-rol").value = rol.nombre_rol;
    document.getElementById("edit-descripcion").value = rol.descripcion;

    const modal = new bootstrap.Modal(document.getElementById("edit-rol-modal"));
    modal.show();

  } catch (error) {
    console.error("Error al cargar el rol:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cargar la información del rol."
    });
  }
}

// =============================
// Actualizar Rol
// =============================
async function handleUpdateSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("edit-rol-id").value;

  const updatedRol = {
    nombre_rol: document.getElementById("edit-nombre-rol").value,
    descripcion: document.getElementById("edit-descripcion").value
  };

  try {
    await rolesService.UpdateRolById(id, updatedRol);

    Swal.fire({
      icon: "success",
      title: "Rol actualizado",
      text: "El rol se modificó correctamente.",
      confirmButtonColor: "#28a745"
    });

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("edit-rol-modal")
    );
    modal.hide();

    init();

  } catch (error) {
    console.error("Error al actualizar rol:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo actualizar el rol."
    });
  }
}

// =============================
// INIT
// =============================
export async function init() {
  const tbody = document.getElementById("roles-table-body");

  tbody.innerHTML = `
      <tr><td colspan="6" class="text-center">Cargando...</td></tr>
  `;

  try {
    const result = await rolesService.GetRoles();
    const backendRoles = result.roles || [];

    const roles = backendRoles.map(r => ({
      rol_id: r.id_rol,
      nombre_rol: r.nombre_rol,
      descripcion: r.descripcion,
      estado: r.estado ? 1 : 0
    }));

    tbody.innerHTML = roles.length
      ? roles.map(createRolRow).join("")
      : `<tr><td colspan="6" class="text-center">No hay registros.</td></tr>`;

  } catch (error) {
    console.error("Error al obtener roles:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error al cargar datos.</td></tr>`;
  }

  // EVENTOS
  tbody.addEventListener("change", handleSwitchChange);
  tbody.addEventListener("click", handleEditClick);
  document.getElementById("edit-rol-form").addEventListener("submit", handleUpdateSubmit);

  document.getElementById("create-rol-form").addEventListener("submit", handleCreateSubmit);
}

// =============================
// Crear Rol Nuevo
// =============================
async function handleCreateSubmit(event) {
  event.preventDefault();

  const newRol = {
    nombre_rol: document.getElementById("create-nombre-rol").value,
    descripcion: document.getElementById("create-descripcion").value,
    estado: true
  };

  try {
    await rolesService.CreateRol(newRol);

    Swal.fire({
      icon: "success",
      title: "Rol creado",
      text: "El rol se registró correctamente.",
      confirmButtonColor: "#28a745"
    });

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("create-rol-modal")
    );
    modal.hide();

    event.target.reset();
    init();

  } catch (error) {
    console.error("Error al crear rol:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo crear el rol."
    });
  }
}

// Ejecutar automáticamente
init();