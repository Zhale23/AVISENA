import { alimentoService } from '../js/alimentos.service.js';
import { init as initConsumo_alimento } from './consumo_alimentos.js';

let modalInstance = null;
let activeFechaInicio = "";
let activeFechaFin = "";

//______________________boton consumo alimentos__________________________
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#consumo_alimento');
  if (!btn) return;  

  try {
    const response = await fetch('pages/consumo_alimentos.html');
    if (!response.ok) throw new Error('Error al cargar el HTML');
    
    const html = await response.text();
    document.getElementById('main-content').innerHTML = html;

    setTimeout(async () => {
      try {
        await initConsumo_alimento();
      } catch (error) {
        console.error(" Error al inicializar consumos:", error);
      }
    }, 100);
    
  } catch (error) {
    console.error(' Error al cargar los consumos de alimento:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar la página de consumos',
      confirmButtonColor: '#d33'
    });
  }
});


// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---

function createAlimentosRow(alimento) {
  const alimentoId = alimento.id_alimento;
  const [year, month, day] = alimento.fecha_ingreso.split('-');
  const fecha = new Date(year, month - 1, day);

  const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(fecha);

  return `
    <tr>
      <td class="px-0">${alimento.nombre}</td>
      <td class="px-0">${alimento.cantidad}</td> 
      <td class="px-0">${fechaFormateada}</td>
      <td class="text-end justify-content-end gap-2">
          <button class="btn btn-sm btn-success btn-edit-alimento" data-alimento-id="${alimentoId}" aria-label="Editar"><i class="fa-regular fa-pen-to-square me-0"></i></button>
      </td>
    </tr>
  `;
}

//______________________________paginación para todos los datos y filtrados_____________

async function fetchAlimentos(page = 1, page_size = 10, fechaInicio = "", fechaFin = "") {
  try {
    let response;

    if (fechaInicio && fechaFin) {
      response = await alimentoService.getAlimentoAllDate(fechaInicio, fechaFin, page, page_size);
    } else {
      response = await alimentoService.getAlimentoAllPag(page, page_size);
    }

    // Validamos que la respuesta tenga datos
    if (!response || !response.alimento) {
      return {
        page: page,
        page_size: page_size,
        total_alimento: 0,
        total_pages: 1,
        alimento: []
      };
    }

    return response;

  } catch (error) {
    console.error("Error en fetchAlimentos:", error);
    return {
      page: page,
      page_size: page_size,
      total_alimento: 0,
      total_pages: 1,
      alimento: []
    };
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
function inicializarFiltroFechas() {
  const btnApplyFilter = document.getElementById("btn-apply-date-filter");
  const btnClear = document.getElementById('btn_clear_filters');
  
  if (btnApplyFilter) {
    // Remover listeners anteriores
    btnApplyFilter.replaceWith(btnApplyFilter.cloneNode(true));
    const nuevoBtn = document.getElementById("btn-apply-date-filter");
    
    nuevoBtn.addEventListener("click", () => {
      const fechaInicio = document.getElementById("fecha-inicio").value;
      const fechaFin = document.getElementById("fecha-fin").value;
      filtrarAlimentos(fechaInicio, fechaFin);
    });
  }
  
  if (btnClear) {
    btnClear.replaceWith(btnClear.cloneNode(true));
    const nuevoBtnClear = document.getElementById('btn_clear_filters');
    
    nuevoBtnClear.addEventListener('click', limpiarFiltros);
  }
}

function filtrarAlimentos(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    Swal.fire({
      icon: 'info',
      title: 'Error',
      text: 'Debe seleccionar ambas fechas',
      confirmButtonColor: 'rgba(51, 136, 221, 1)'
    });
    return;
  }

  // Guardar fechas para usar en fetchAlimentos
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  // Recargar la tabla desde la página 1 con el filtro
  init(1, 10);
}

//___________para abrir el modal de edit_________________________________________
async function openEditModal(id_alimento) {
  const modalElement = document.getElementById('edit-alimento-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const alimento = await alimentoService.getAlimentoById(id_alimento);

    // Guardar el ID oculto
    document.getElementById('edit-alimento-id').value = alimento.id_alimento;

    // Poner los valores en los inputs
    document.getElementById('edit-nombre_alimento').value = alimento.nombre;
    document.getElementById('edit-cantidad_alimento').value = alimento.cantidad;

    modalInstance.show();
  } catch (error) {
    console.error("Error en openEditModal:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del alimento.',
      confirmButtonColor: '#d33'
    });
  }
}

async function handleTableClick(event) {
  // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-alimento');
  if (editButton) {
    const idAlimento = editButton.dataset.alimentoId;
    openEditModal(idAlimento);
    return;
  }
}

// --- MANEJADORES DE EVENTOS ---
async function handleUpdateSubmit(event) {
  event.preventDefault();

  const alimentosId = document.getElementById('edit-alimento-id').value;
  const updatedData = {
    nombre: document.getElementById('edit-nombre_alimento').value.trim(), // texto del input
    cantidad: parseFloat(document.getElementById('edit-cantidad_alimento').value) // número
  };

  try {
    await alimentoService.updateAlimento(alimentosId, updatedData);
    modalInstance.hide();
    init(); // recarga la tabla
    Swal.fire({
      icon: 'success',
      title: 'Actualizado',
      text: 'El alimento se actualizó correctamente',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error actualizando alimento:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el alimento.',
      confirmButtonColor: '#d33'
    });
  }
}

async function handleCreateSubmit(event) {
  event.preventDefault();

  const fechaLocal = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())}`;

  const newAlimentoData = {
    nombre: document.getElementById('create-nombre_alimento').value,
    cantidad: parseInt(document.getElementById('create-cantidad_alimento').value),
    fecha_ingreso: fechaPC,
  };

  try {
  await alimentoService.createAlimento(newAlimentoData);

  const createAlimento_modal = document.getElementById('create-alimento-modal');
  let createAlimentoModalInstance = bootstrap.Modal.getInstance(createAlimento_modal);
  if (!createAlimentoModalInstance) {
    createAlimentoModalInstance = new bootstrap.Modal(createAlimento_modal);
  }
  createAlimentoModalInstance.hide();

  createAlimento_modal.addEventListener('hidden.bs.modal', function handler() {
    createAlimento_modal.removeEventListener('hidden.bs.modal', handler);
    document.getElementById('create-alimento-form').reset();

    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'Alimento creado correctamente.',
      confirmButtonColor: '#28a745'
    });

    // 🔹 Recargar la tabla para que aparezca el nuevo alimento
    init(1, 10, activeFechaInicio, activeFechaFin);
  });

  } catch (error) {
    console.error("Error al crear alimento:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al crear el alimento: ' + (error.message || 'Error desconocido'),
      confirmButtonColor: '#d33'
    });
  }
}
//____________________________________buscador inteligente____________________________________
function inicializarBuscador() {
  const BuscarAimento = document.getElementById('search-alimentos');

  if (BuscarAimento) {
    // Remover event listener anterior si existe
    BuscarAimento.replaceWith(BuscarAimento.cloneNode(true));
    const nuevoInput = document.getElementById('search-alimentos');
    
    nuevoInput.addEventListener('input', () => {
      const filter = nuevoInput.value.toLowerCase();
      const tableBody = document.getElementById('alimentos-table-body');
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
}

//_______________________________ limpiador de filtros__________________________________________
function limpiarFiltros() {
  activeFechaInicio = "";
  activeFechaFin = "";
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  const searchInput = document.getElementById('search-alimentos');
  if (searchInput) searchInput.value = "";
  init(1, 10);
}
//_____________________________________________________________________________________________

async function init(page = 1, page_size = 10, fechaInicio = activeFechaInicio, fechaFin = activeFechaFin) {
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  const tableBody = document.getElementById('alimentos-table-body');
  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando alimentos...</td></tr>';

  try {
    const data = await fetchAlimentos(page, page_size, activeFechaInicio, activeFechaFin);
    const alimentos = data.alimento || [];

    if (alimentos.length > 0) {
      tableBody.innerHTML = alimentos.map(createAlimentosRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron alimentos.</td></tr>';
    
      if (activeFechaInicio && activeFechaFin) {
            tableBody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center">
                  <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron alimentos en el rango de fechas:<br>
                    <strong>${activeFechaInicio} a ${activeFechaFin}</strong>
                  </div>
                </td>
              </tr>
            `;
      } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron alimentos.</td></tr>';
        }
      }

    renderPagination(data.total_pages || 1, page);

    // Inicializar event listeners de la tabla
    const editForm = document.getElementById('edit-alimento-form');
    const createForm = document.getElementById('create-alimento-form');
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    editForm.removeEventListener('submit', handleUpdateSubmit);
    editForm.addEventListener('submit', handleUpdateSubmit);
    tableBody.addEventListener('click', handleTableClick);
    createForm.removeEventListener('submit', handleCreateSubmit);
    createForm.addEventListener('submit', handleCreateSubmit);

    inicializarBuscador();
    inicializarFiltroFechas();

  } catch (error) {
    console.error("Error al cargar alimentos:", error);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
  }
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

async function exportToPDF(data, filename = "alimentos.pdf") { 
  const sanitizedData = data.map(row => ({
    id_alimento: row.id_alimento || "",
    nombre: row.nombre || "",
    cantidad: row.cantidad || "",
    fecha_ingreso: row.fecha_ingreso || "",
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
  doc.text("Reporte de Alimentos", 14, 15);

  const columns = [
    { header: "Id", dataKey: "id_alimento" },
    { header: "Nombre alimento", dataKey: "nombre" },
    { header: "Cantidad (Kg)", dataKey: "cantidad" },
    { header: "Fecha ingreso", dataKey: "fecha_ingreso" },
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

function exportToCSV(data, filename = "alimentos.csv") {
  console.log("DATA QUE LLEGA AL CSV:", data);

  const columns = [
    { header: "Id", key: "id_alimento" },
    { header: "Nombre alimento", key: "nombre" },
    { header: "Cantidad (Kg)", key: "cantidad" },
    { header: "Fecha ingreso", key: "fecha_ingreso" },
  ];
  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "alimentos.xlsx") {
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
    "Id": r.id_alimento,
    "Nombre alimento": r.nombre ,
    "Cantidad (Kg)": r.cantidad ,
    "Fecha ingreso": r.fecha_ingreso,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alimentos");

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

  if (!activeFechaInicio || !activeFechaFin) {
    response = await fetchAlimentos(1, 10);
  } 

  else {
    const fechaInicio = formatDateForAPI(activeFechaInicio);
    const fechaFin = formatDateForAPI(activeFechaFin);
    response = await fetchAlimentos(1, 10, fechaInicio, fechaFin);
  }

  const data = response?.alimento || [];

  if (data.length === 0) {
    Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
    return;
  }

  if (fmt === "csv") {
    exportToCSV(data, `alimentos_${dateTag}.csv`);
  } else if (fmt === "excel") {
    exportToExcel(data, `alimentos_${dateTag}.xlsx`);
  } else if (fmt === "pdf") {
    exportToPDF(data, `alimentos_${dateTag}.pdf`);
  }
}

function inicializarExportacion() {
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".export-format");
    if (!item) return;
    handleExportClick(e);
  });
}

inicializarExportacion();

init(1, 10);

export { init };
