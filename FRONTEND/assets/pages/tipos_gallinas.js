import { typeChickenService } from '../js/type_chickens.service.js';

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let createModalInstance = null;
let allTypeChickens = [];

function createTypeChickenRow(typeChicken) {
  return `
    <tr>
      <td class="px-0">${typeChicken.id_tipo_gallinas}</td>
      <td class="px-0">${typeChicken.raza}</td>
      <td class="px-0">${typeChicken.descripcion}</td>
      <td class="px-0 text-end">
          <button class="btn btn-success btn-sm btn-edit-tipo-gallina" aria-label="Editar" title="Editar" data-tipo-gallina-id="${typeChicken.id_tipo_gallinas}">
            <i class="fa-regular fa-pen-to-square me-0"></i>
          </button>
      </td>
    </tr>
  `;
}

// --- LÓGICA DE MODAL ---

async function openEditModal(id) {
  const modalElement = document.getElementById('edit-tipo-gallina-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }
  try {
    const typeChicken = await typeChickenService.getTypeChickenById(id);
    document.getElementById('edit-tipo-gallina-id').value = typeChicken.id_tipo_gallinas;
    document.getElementById('edit-raza').value = typeChicken.raza;
    document.getElementById('edit-descripcion').value = typeChicken.descripcion;
    modalInstance.show();
  } catch (error) {
    console.error(`Error al obtener datos del tipo de gallina ${id}:`, error);
    await Swal.fire({
      icon: "error",
      text: "No se pudieron cargar los datos del tipo de gallina.",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "btn btn-success"
      },
      buttonsStyling: false
    });
  }
}

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
  event.preventDefault();
  const typeChickenId = document.getElementById('edit-tipo-gallina-id').value;
  const updatedData = {
    raza: document.getElementById('edit-raza').value,
    descripcion: document.getElementById('edit-descripcion').value
  };

  try {
    await typeChickenService.updateTypeChicken(typeChickenId, updatedData);
    console.log(updatedData);
    modalInstance.hide();
    await Swal.fire({
      icon: "success",
      text: "Tipo de gallina actualizado exitosamente.",
      confirmButtonText: "OK",
      customClass: {
        confirmButton: "btn btn-success"
      },
      buttonsStyling: false
    });
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    console.error(`Error al actualizar el tipo de gallina ${typeChickenId}:`, error);
    if (error.message === "El tipo de gallina con esa raza y descripción ya existe.") {
      await Swal.fire({
        icon: "error",
        text: "El tipo de gallina con esa raza y descripción ya existe.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "btn btn-success"
        },
        buttonsStyling: false

      });
    } else {
      await Swal.fire({
        icon: "error",
        text: "Error al actualizar tipo de gallina.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "btn btn-success"
        },
        buttonsStyling: false
      });
    }
  }
}

async function handleTableClick(event) {
    // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-tipo-gallina');
  if (editButton) {
    const id = editButton.dataset.tipoGallinaId;
    console.log(`Edit type chiken with id: ${id}`);
    openEditModal(id);
    return;
  }
}
  

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---

// manejador de formulario crear tipos
async function handleCreateSubmit(event) {
  event.preventDefault();

  const newtypeChikenData = {
    raza: document.getElementById('create-raza').value,
    descripcion: document.getElementById('create-descripcion').value
  };

  try {
    await typeChickenService.createTypeChicken(newtypeChikenData);
    if(createModalInstance) createModalInstance.hide();
    document.getElementById('create-tipo-gallina-form').reset(); // Limpiamos el formulario
    await Swal.fire({
      icon: "success",
      text: "Tipo de gallina creado exitosamente.",
      confirmButtonText: "OK",
        customClass: {
          confirmButton: "btn btn-success"
        },
        buttonsStyling: false

    });
    init(); // Recargamos la tabla para ver el nuevo tipo
  } catch (error) {
    console.error('Error al crear tipo de gallina:', error);
    if (error.message === "El tipo de gallina con esa raza y descripción ya existe.") {
      await Swal.fire({
        icon: "error",
        text: "El tipo de gallina con esa raza y descripción ya existe.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "btn btn-success"
        },
        buttonsStyling: false
      });
    } else {
      await Swal.fire({
        icon: "error",
        text: "Error al crear tipo de gallina.",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "btn btn-success"
        },
        buttonsStyling: false
      });
    }
  }
}

//EXPORTACION
document.addEventListener("click", function(event) {
    const exportBtn = event.target.closest(".export-format");
    if (!exportBtn) return;
    event.preventDefault();
    handleExportClick(event);
});

function handleExportClick(event) {
    const item = event.target.closest(".export-format");
    if (!item) return;
    event.preventDefault();

    const fmt = item.dataset.format;
    const dateTag = new Date().toISOString().slice(0, 10);
    const data = allTypeChickens;
    if (!data || data.length === 0) {
        Swal.fire({ 
          title: "No hay datos para exportar.", 
          icon: "info",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "btn btn-success"
          },
          buttonsStyling: false 
        });
        return;
    }

    if (fmt === "csv") {
        exportToCSV(data, `Tipos de gallinas${dateTag}.csv`);
    } else if (fmt === "excel") {
        exportToExcel(data, `Tipos de gallinas${dateTag}.xlsx`);
    } else if (fmt === "pdf") {
        exportToPDF(data, `Tipos de gallinas${dateTag}.pdf`);
    }
}

function convertToCSV(rows, columns) {
    const escapeCell = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val);

        return `${s.replace(/"/g, '""')}`;
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

function exportToCSV(data, filename = "Tipos de gallinas.csv") {
    const columns = [
        { header: "ID", key: "id_tipo_gallinas" },
        { header: "Raza", key: "raza" },
        { header: "Descripcion", key: "descripcion" },
    ];
    const csv = convertToCSV(data, columns);
    downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "Tipos de gallinas.xlsx") {
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
        ID: r.id_tipo_gallinas,
        Raza: r.raza,
        Descripcion: r.descripcion,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "tipos de gallinas");

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
                confirmButtonText: "OK",
                customClass: {
                  confirmButton: "btn btn-success"
                },
                buttonsStyling: false
            });
        }
    }
}

async function exportToPDF(data, filename = "Tipos de gallinas.pdf") {
    const sanitizedData = data.map(row => ({
        id_tipo_gallinas: row.id_tipo_gallinas || '',
        raza: row.raza || '',
        descripcion: row.descripcion || '',
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
    doc.text("Reporte de tipos de gallinas", 14, 15);

    const columns = [
        { header: "ID", dataKey: "id_tipo_gallinas" },
        { header: "Raza", dataKey: "raza" },
        { header: "Descripcion", dataKey: "descripcion" },
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

async function init() {
  console.log('tipos_gallinas cargado');
  const tableBody = document.getElementById('tipo-gallina-table-body');
  if (!tableBody) return;

    if (!createModalInstance) {
        const createModalElement = document.getElementById('create-tipo-gallina-modal');
        createModalInstance = new bootstrap.Modal(createModalElement);
    }

  tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando tipos de gallinas ... </td></tr>'; // ✅ CORRECCIÓN: colspan="4"

  try {
    const typeChicken = await typeChickenService.getTypeChicken();
    allTypeChickens = typeChicken;
    if (typeChicken && typeChicken.length > 0) {
      tableBody.innerHTML = typeChicken.map(createTypeChickenRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron tipos de gallinas.</td></tr>'; // ✅ CORRECCIÓN: colspan="4"
    }
  } catch (error) {
    console.error('Error al obtener los tipos de gallinas:', error);
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar los datos.</td></tr>`; // ✅ CORRECCIÓN: colspan="4"
  }

  // Aplicamos el patrón remove/add para evitar listeners duplicados
  const editForm = document.getElementById('edit-tipo-gallina-form');
  const createForm = document.getElementById('create-tipo-gallina-form');
  tableBody.removeEventListener('click', handleTableClick);
  tableBody.addEventListener('click', handleTableClick);
  editForm.removeEventListener('submit', handleUpdateSubmit);
  editForm.addEventListener('submit', handleUpdateSubmit);
  createForm.removeEventListener('submit', handleCreateSubmit);
  createForm.addEventListener('submit', handleCreateSubmit);

}

export { init };
