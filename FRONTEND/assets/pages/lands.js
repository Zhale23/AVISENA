import { landService } from "../js/api/land.service.js";

// No usamos paginación: cargamos todas las fincas en memoria
let allLands = [];
let filteredLands = [];
let currentFilter = "all";

let createModalInstance = null;
let editModalInstance = null;

function createLandRow(land) {
  const statusBadge = land.estado
    ? `<span class="badge bg-success">Activo</span>`
    : `<span class="badge bg-danger">Inactivo</span>`;

  return `
        <tr>
            <td class="cell">${land.nombre}</td>
            <td class="cell">${land.longitud}</td>
            <td class="cell">${land.latitud}</td>
            <td class="cell">
                <div class="form-check form-switch d-inline-block">
                    <input class="form-check-input land-status-switch" type="checkbox" role="switch"
                           id="switch-${land.id_finca}" data-land-id="${land.id_finca}" ${land.estado ? "checked" : ""}> 
                           ${land.estado ? "Activa" : "Inactiva"}
                </div>
            </td>
            <td class="cell text-end">
                <button class="btn btn-sm btn-success btn-edit-land" data-land-id="${land.id_finca}">
    
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
            </td>
        </tr>
    `;
}

async function loadLands() {
  const tableBody = document.getElementById("sensors-table-body");
  if (!tableBody) return;

  tableBody.innerHTML =
    '<tr><td colspan="6" class="text-center">Cargando fincas...</td></tr>';

  try {
    const response = await landService.getLands();

    // getLands devuelve un array normalizado por el servicio
    allLands = Array.isArray(response) ? response : [];

    applyFilters();
  } catch (error) {
    console.error("Error al obtener las fincas:", error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
  }
}

function applyFilters() {
  const tableBody = document.getElementById("sensors-table-body");

  filteredLands = allLands.filter((land) => {
    if (currentFilter === "active") return land.estado === true;
    if (currentFilter === "inactive") return land.estado === false;
    return true;
  });

  if (filteredLands.length > 0) {
    tableBody.innerHTML = filteredLands.map(createLandRow).join("");
  } else {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">No se encontraron fincas.</td></tr>';
  }
}

async function handleStatusSwitch(event) {
  const switchElement = event.target;
  if (!switchElement.classList.contains("land-status-switch")) return;

  const landId = parseInt(switchElement.dataset.landId);
  const newStatus = switchElement.checked;
  const actionText = newStatus ? "activar" : "desactivar";
  // Usar SweetAlert para confirmar la acción y esperar la respuesta del usuario
  const result = await Swal.fire({
    title: `¿Estás seguro de que deseas ${actionText} esta finca?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, estoy seguro",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) {
    // El usuario canceló: revertir el switch y no hacer nada
    switchElement.checked = !newStatus;
    return;
  }

  // El usuario confirmó: intentamos cambiar el estado en el backend
  try {
    await landService.changeLandStatus(landId, newStatus);
    await Swal.fire({
      title: `La finca ha sido ${newStatus ? "activada" : "desactivada"
        } exitosamente.`,
      icon: "success",
    });
    await init();
  } catch (error) {
    console.error(`Error al ${actionText} la finca ${landId}:`, error);
    await Swal.fire({
      title: `No se pudo ${actionText} la finca.`,
      text: error?.message || String(error),
      icon: "error",
    });
    // Revertir el switch si la petición falla
    switchElement.checked = !newStatus;
  }
}

async function handleEditClick(event) {
  const editButton = event.target.closest(".btn-edit-land");
  if (!editButton) return;

  const landId = parseInt(editButton.dataset.landId);
  await openEditModal(landId);
}

async function openEditModal(landId) {
  const modalElement = document.getElementById("edit-sensor-modal");
  if (!editModalInstance) {
    editModalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    // buscar en la lista en memoria primero
    let land = allLands.find((l) => Number(l.id_finca) === Number(landId));
    if (!land) {
      // fallback: intentar obtener por id si el endpoint existe
      land = await landService.getLandById(landId);
    }

    document.getElementById("edit-sensor-id").value = land.id_finca;
    document.getElementById("edit-nombre").value = land.nombre;
    document.getElementById("edit-longitud").value = land.longitud;
    document.getElementById("edit-latitud").value = land.latitud;

    editModalInstance.show();
  } catch (error) {
    console.error(`Error al obtener datos de la finca ${landId}:`, error);
    Swal.fire({
      title: "Hubo un error al obtener los datos de la finca.",
      icon: "error",
    });
  }
}

async function handleUpdateSubmit(event) {
  event.preventDefault();
  const landId = parseInt(document.getElementById("edit-sensor-id").value);
  const updatedData = {
    nombre: document.getElementById("edit-nombre").value,
    longitud: parseFloat(document.getElementById("edit-longitud").value),
    latitud: parseFloat(document.getElementById("edit-latitud").value),
  };

  try {
    await landService.updateLand(landId, updatedData);
    if (editModalInstance) editModalInstance.hide();
    await init();
  } catch (error) {
    console.error(`Error al actualizar la finca ${landId}:`, error);
    Swal.fire({
      title: "Hubo un error al actualizar la finca",
      icon: "error",
    });
  }
}

async function handleCreateSubmit(event) {
  event.preventDefault();

  const newLandData = {
    nombre: document.getElementById("create-nombre").value,
    longitud: parseFloat(document.getElementById("create-longitud").value),
    latitud: parseFloat(document.getElementById("create-latitud").value),
    id_usuario: 1, // ajuste por defecto; cambiar según contexto/selección de usuario
    estado: true,
  };

  try {
    await landService.createLand(newLandData);
    const createModalEl = document.getElementById("create-sensor-modal");
    if (createModalEl) {
      if (!createModalInstance)
        createModalInstance = new bootstrap.Modal(createModalEl);
      createModalInstance.hide();
    }
    const createForm = document.getElementById("create-sensor-form");
    if (createForm) createForm.reset();
    Swal.fire({
      title: "Finca creada exitosamente",
      icon: "success",
    });
    await init();
  } catch (error) {
    console.error("Error al crear la finca:", error);
    alert("No se pudo crear la finca.");
  }
}

function handleFilterChange(event) {
  currentFilter = event.target.value;
  applyFilters();
}

async function init() {
  const createModalElement = document.getElementById("create-sensor-modal");
  if (createModalElement) {
    createModalInstance = new bootstrap.Modal(createModalElement);
  }

  await loadLands();

  const tableBody = document.getElementById("sensors-table-body");
  const filterEstado = document.getElementById("filter-estado");
  const createForm = document.getElementById("create-sensor-form");
  const editForm = document.getElementById("edit-sensor-form");

  if (!tableBody) return;

  // Aplicamos patrón remove/add para evitar listeners duplicados (como en users.js)
  tableBody.removeEventListener("click", handleEditClick);
  tableBody.addEventListener("click", handleEditClick);
  tableBody.removeEventListener("change", handleStatusSwitch);
  tableBody.addEventListener("change", handleStatusSwitch);

  if (filterEstado) {
    filterEstado.removeEventListener("change", handleFilterChange);
    filterEstado.addEventListener("change", handleFilterChange);
  }

  if (createForm) {
    createForm.removeEventListener("submit", handleCreateSubmit);
    createForm.addEventListener("submit", handleCreateSubmit);
  }

  if (editForm) {
    editForm.removeEventListener("submit", handleUpdateSubmit);
    editForm.addEventListener("submit", handleUpdateSubmit);
  }

  // Export: manejar clicks en el dropdown (CSV / Excel)
  const pageUtilities = document.querySelector(".page-utilities");
  if (pageUtilities) {
    pageUtilities.removeEventListener("click", handleExportClick);
    pageUtilities.addEventListener("click", handleExportClick);
  }
}

function convertToCSV(rows, columns) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    // Escape quotes
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = typeof c.key === "function" ? c.key(row) : row[c.key];
          return escapeCell(v);
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportToCSV(data, filename = "fincas.csv") {
  const columns = [
    { header: "ID", key: "id_finca" },
    { header: "Nombre", key: "nombre" },
    { header: "Longitud", key: "longitud" },
    { header: "Latitud", key: "latitud" },
    { header: "Estado", key: (r) => (r.estado ? "Activo" : "Inactivo") },
  ];
  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "fincas.xlsx") {
  // Intentar usar SheetJS (XLSX) para crear un .xlsx real en el navegador.
  // Si no está cargado, lo cargamos dinámicamente desde CDN.
  const loadSheetJS = () =>
    new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const script = document.createElement("script");
      script.src =
        "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.onload = () => resolve(window.XLSX);
      script.onerror = (e) => reject(new Error("No se pudo cargar SheetJS"));
      document.head.appendChild(script);
    });

  try {
    await loadSheetJS();
  } catch (err) {
    console.warn(
      "SheetJS no disponible, se usará exportación CSV en su lugar",
      err
    );
    // Fallback al CSV con extensión xlsx si falla la carga
    exportToCSV(data, filename.replace(/\.xlsx?$/, ".csv"));
    return;
  }

  // Mapear datos a objetos planos para json_to_sheet
  const rows = data.map((r) => ({
    ID: r.id_finca,
    Nombre: r.nombre,
    Longitud: r.longitud,
    Latitud: r.latitud,
    Estado: r.estado ? "Activo" : "Inactivo",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fincas");

  try {
    XLSX.writeFile(wb, filename);
  } catch (e) {
    // Algunos navegadores / entornos pueden requerir otra ruta: crear blob desde write
    try {
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("No se pudo generar el archivo .xlsx:", err);
      Swal.fire({
        title: "Error al generar .xlsx",
        text: err.message || String(err),
        icon: "error",
      });
    }
  }
}

function handleExportClick(event) {
  const item = event.target.closest(".export-format");
  if (!item) return;
  event.preventDefault();
  const fmt = item.dataset.format;
  const dateTag = new Date().toISOString().slice(0, 10);
  const data = filteredLands && filteredLands.length ? filteredLands : allLands;
  if (!data || data.length === 0) {
    Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
    return;
  }

  if (fmt === "csv") {
    exportToCSV(data, `fincas_${dateTag}.csv`);
  } else if (fmt === "excel") {
    exportToExcel(data, `fincas_${dateTag}.xls`);
  }
}

export { init };
