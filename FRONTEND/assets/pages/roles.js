import { rolesService } from "../js/api/roles.service.js";

console.log("Roles JS cargado");

// ----------------------------
// Crear fila de la tabla
// ----------------------------
function createRolRow(rol) {
  return `
    <tr>
        <td>${rol.nombre_rol}</td>
        <td>${rol.descripcion}</td>

        <td class="text-center">
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

// ----------------------------
// Cambiar estado (Switch)
// ----------------------------
async function handleSwitchChange(event) {
  if (!event.target.classList.contains("switch-estado")) return;

  const id = event.target.dataset.id;
  const nuevoEstado = event.target.checked;

  // SweetAlert de confirmación
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Estás a punto de cambiar el estado de este rol.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cambiar!",
    cancelButtonText: "No, cancelar!",
    reverseButtons: true,
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: false
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

    // SweetAlert de éxito con botón verde
    Swal.fire({
      icon: "success",
      title: "Estado actualizado",
      text: "El estado del rol se ha cambiado correctamente.",
      confirmButtonText: "Aceptar",
      customClass: {
        confirmButton: "btn btn-success"
      },
      buttonsStyling: false
    });

  } catch (error) {
    console.error("Error al cambiar estado:", error);

    event.target.checked = !nuevoEstado;

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo cambiar el estado."
    });
  }
}



// ----------------------------
// Crear Nuevo Rol
// ----------------------------
async function handleCreateSubmit(event) {
  event.preventDefault();

  const newRol = {
    nombre_rol: document.getElementById("create-nombre-rol").value,
    descripcion: document.getElementById("create-descripcion").value,
    estado: true
  };

  try {
    await rolesService.CreateRol(newRol);
    alert("Rol creado correctamente");
    event.target.reset();
    init();
  } catch (error) {
    console.error("Error al crear rol:", error);
    alert("No se pudo registrar el rol.");
  }
}

// ----------------------------
// INIT - Principal
// ----------------------------
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

    if (roles.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros.</td></tr>`;
    } else {
      tbody.innerHTML = roles.map(createRolRow).join("");
    }

  } catch (error) {
    console.error("Error al obtener roles:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error al cargar datos.</td></tr>`;
  }

  // Listener del switch
  tbody.onchange = handleSwitchChange;

  // Crear nuevo rol
  document
    .getElementById("create-rol-form")
    .addEventListener("submit", handleCreateSubmit);
}

// Ejecutar automáticamente
init();


