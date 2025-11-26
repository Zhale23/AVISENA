import { isolationService } from '../js/isolations.service.js';

let modalInstance = null;
let createModalInstance = null;
let activeFechaInicio = "";
let activeFechaFin = "";

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
function createIsolationRow(isolation) {
  const isolationId = isolation.id_aislamiento;

  const fecha = new Date(isolation.fecha_hora);
  const fechaFormateada = fecha.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true
  });
  return `
    <tr>
      <td class="px-0">${isolation.id_incidente_gallina}</td>
      <td class="px-0">${fechaFormateada}</td>
      <td class="px-0">${isolation.nombre}</td>
      <td class="text-end justify-content-end gap-2">
          <button class="btn btn-sm btn-success btn-edit-isolation" data-isolation-id="${isolationId}" aria-label="Editar"><i class="fa-regular fa-pen-to-square me-0"></i></button>
      </td>
    </tr>
  `;
}

//____________________formato_para_exportar_por_fechas______________________________
function formatDateForAPI(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

//______________________________paginación para todos los datos y filtrados_____________

async function fetchIsolations(page = 1, page_size = 10, fechaInicio = "", fechaFin = "") {
  try {
    let response;
    if (fechaInicio && fechaFin) {
      response = await isolationService.getIsolationAllDate(fechaInicio, fechaFin, page, page_size);
    } else {
      response = await isolationService.getIsolationAll(page, page_size);
    }

    if (!response || response.length === 0) {
      return [];
    }

    return response;
  } catch (error) {
    if (error.message.includes("No hay asilamiento en ese rango de fechas") || error.response?.status === 404) {
      return [];
    }
    throw error;
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


//_____________selects para que cargen los nombres de la tabla galpon del create y edit_______________

async function loadGalponesSelectEdit(select, selectedId = null) {
    try {
        // Llamamos directamente al servicio
        const galpones = await isolationService.getGalponesAll();

        // Limpiar y agregar opción por defecto
        select.innerHTML = '<option value="">Selecciona un galpón</option>';

        // Llenar el select
        galpones.forEach(g => {
            const option = document.createElement('option');
            option.value = g.id_galpon;
            option.textContent = g.nombre;

            if (g.id_galpon === selectedId) option.selected = true;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error al cargar galpones:", error);
    }
}


//___________para abrir el modal de edit_________________________________________
async function openEditModal(id_aislamiento) {
  const modalElement = document.getElementById('edit-isolation-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const isolation = await isolationService.getIsolationById(id_aislamiento);

    document.getElementById('edit-isolation-id').value = isolation.id_aislamiento;
    document.getElementById('edit-idIncidentGallina').value = isolation.id_incidente_gallina;
    
    const selectGalpon = document.getElementById('edit_id_galpon');
    await loadGalponesSelectEdit(selectGalpon, isolation.id_galpon);
    
    modalInstance.show();
  } catch (error) {
      Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del aislamiento.',
      confirmButtonColor: '#d33'
    });
  };
};

async function handleTableClick(event) {
  // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-isolation');
  if (editButton) {
    const idAislamiento = editButton.dataset.isolationId;
    openEditModal(idAislamiento);
    return;
  }
}

// --- MANEJADORES DE EVENTOS ---
async function handleUpdateSubmit(event) {
  event.preventDefault();
  const isolationId = document.getElementById('edit-isolation-id').value;
  const updatedData = {
    id_incidente_gallina: document.getElementById('edit-idIncidentGallina').value,
    id_galpon: document.getElementById('edit_id_galpon').value,
  };


  try {
    await isolationService.updateIsolation(isolationId, updatedData);
    modalInstance.hide();
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar del aislamiento.',
      confirmButtonColor: '#d33'
    });
  }
}

//____________________________________buscador inteligente____________________________________
const BuscarAislamiento = document.getElementById('search-isolation');

if (BuscarAislamiento) {
  BuscarAislamiento.addEventListener('input', () => {
    const filter = BuscarAislamiento.value.toLowerCase();
    const tableBody = document.getElementById('isolations-table-body');
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const idCell = row.cells[0]?.textContent.toLowerCase() || '';
      const fechaCell = row.cells[1]?.textContent.toLowerCase() || '';
      const galponCell = row.cells[2]?.textContent.toLowerCase() || '';
      row.style.display = idCell.includes(filter) || fechaCell.includes(filter) || galponCell.includes(filter) ? '' : 'none';
    });
  });
}

//______________________________________________________________________________________________

//_______________________________ limpiador de filtros__________________________________________
function limpiarFiltros() {
  activeFechaInicio = "";
  activeFechaFin = "";
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  init(1, 10);
}

const btnClear = document.getElementById('btn_clear_filters');
btnClear.addEventListener('click', limpiarFiltros);
//_____________________________________________________________________________________________

async function init(page = 1, page_size = 10, fechaInicio = activeFechaInicio, fechaFin = activeFechaFin) {
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  const tableBody = document.getElementById('isolations-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando aislamientos...</td></tr>';

  try {
    const data = await fetchIsolations(page, page_size, activeFechaInicio, activeFechaFin);
    const aislamientos = data.isolation || [];

    if (aislamientos.length > 0) {
      tableBody.innerHTML = aislamientos.map(createIsolationRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron aislamientos.</td></tr>';
    
      if (activeFechaInicio && activeFechaFin) {
            tableBody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center">
                  <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron aislamientos en el rango de fechas:<br>
                    <strong>${activeFechaInicio} a ${activeFechaFin}</strong>
                  </div>
                </td>
              </tr>
            `;
      } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron aislamientos.</td></tr>';
        }
      }

    renderPagination(data.total_pages || 1, page);

    const editForm = document.getElementById('edit-isolation-form');
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    editForm.removeEventListener('submit', handleUpdateSubmit);
    editForm.addEventListener('submit', handleUpdateSubmit);

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
  }
}

//_____________________para exportar archivos excel, CSV, pdf_______________________________________
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

async function exportToPDF(data, filename = "aislamientos.pdf") {
  const sanitizedData = data.map(row => ({
    id_aislamiento: row.id_aislamiento || "",
    fecha_hora: row.fecha_hora || "",
    id_incidente_gallina: row.id_incidente_gallina || "",
    id_galpon: row.id_galpon || "",
  }));

  if (!window.jspdf) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
  // Cargar autoTable desde jsDelivr
  if (!window.jspdfAutoTable) {
    await loadScript("https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Verificar que autoTable exista
  if (typeof doc.autoTable !== "function") {
    console.error("autoTable no se cargó correctamente");
    return;
  }

  doc.setFontSize(16);
  doc.text("Reporte de Aislamientos", 14, 15);

  const columns = [
    { header: "Id", dataKey: "id_aislamiento" },
    { header: "Fecha y hora", dataKey: "fecha_hora" },
    { header: "Incidente N.", dataKey: "id_incidente_gallina" },
    { header: "Galpón", dataKey: "id_galpon" },
  ];

  doc.autoTable({ columns, body: sanitizedData, startY: 25, styles: { fontSize: 9 } });
  doc.save(filename);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(`Error cargando script: ${src}`);
    document.body.appendChild(script);
  });
}

function exportToCSV(data, filename = "aislamientos.csv") {
  const columns = [
    { header: "ID", key: "id_aislamiento" },
    { header: "Fecha y hora", key: "fecha_hora" },
    { header: "Incidente N.", key: "id_incidente_gallina" },
    { header: "id galpon", key: "id_galpon" },
    // { header: "Latitud", key: "latitud" },
  ];
  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "aislamientos.xlsx") {
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
    "Id aislamiento": r.id_aislamiento,
    "Fecha y hora": r.fecha_hora,
    "Id incidente gallina": r.id_incidente_gallina,
    "Id galpón origen": r.id_galpon,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Asilamiento");

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

async function handleExportClick(event) {

  const item = event.target.closest(".export-format");
  if (!item) return;

  event.preventDefault();

  const fmt = item.dataset.format;
  const dateTag = new Date().toISOString().slice(0, 10);

  let response;

  // 👉 Si NO hay filtros, llamar API normal
  if (!activeFechaInicio || !activeFechaFin) {
    response = await fetchIsolations(1, 1000);
  } 
  // 👉 Si hay filtros, enviarlos formateados
  else {
    const fechaInicio = formatDateForAPI(activeFechaInicio);
    const fechaFin = formatDateForAPI(activeFechaFin);
    response = await fetchIsolations(1, 1000, fechaInicio, fechaFin);
  }

  const data = response?.isolation || [];

  if (data.length === 0) {
    Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
    return;
  }

  if (fmt === "csv") {
    exportToCSV(data, `aislamientos_${dateTag}.csv`);
  } else if (fmt === "excel") {
    exportToExcel(data, `aislamientos_${dateTag}.xlsx`);
  } else if (fmt === "pdf") {
    exportToPDF(data, `aislamientos_${dateTag}.pdf`);
  }
}


document.addEventListener("click", (e) => {
  const item = e.target.closest(".export-format");
  if (!item) return;
  handleExportClick(e);
});


init(1, 10);

export { init };
