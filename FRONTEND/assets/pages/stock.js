import { stockService } from "../api/stock.service.js";

let modalEditInstance = null;

console.log('estoy aqui')
// ----------------------------
// Crear fila de la tabla
// ----------------------------
function createStockRow(stock) {

  return `
    <tr>
        <td>${stock.id_producto}</td>
        <td>${stock.unidad_medida}</td>
        <td>${stock.id_produccion}</td>
        <td>${stock.cantidad_disponible}</td>

        <td class="text-end">
            <button class="btn btn-sm btn-info btn-edit-stock" data-id="${stock.id_producto}">
                <i class="fa-regular fa-pen-to-square"></i>
            </button>

        </td>
    </tr>
  `;
}

// ----------------------------
// Abrir Modal para editar
// ----------------------------
async function openEditModal(stockId) {
  const modalElement = document.getElementById("edit-stock-modal");

  if (!modalEditInstance) {
    modalEditInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const stock = await stockService.GetStockById(stockId);

    document.getElementById("edit-id-producto").value = stock.id_producto;
    document.getElementById("edit-unidad-medida").value = stock.unidad_medida;
    document.getElementById("edit-id-produccion").value = stock.id_produccion;
    document.getElementById("edit-cantidad-disponible").value = stock.cantidad_disponible;

    modalEditInstance.show();
  } catch (error) {
    console.error("Error cargando stock:", error);
    alert("No se pudo cargar el stock a editar.");
  }
}

// ----------------------------
// Guardar Edición
// ----------------------------
async function handleEditSubmit(event) {
  event.preventDefault();

  const UpdateStock = {
    unidad_medida: document.getElementById("edit-unidad-medida").value,
    id_produccion: parseInt(document.getElementById("edit-id-produccion").value),
    cantidad_disponible: parseInt(document.getElementById("edit-cantidad-disponible").value),
  };

  const id = document.getElementById("edit-id-producto").value;

  try {
    await stockService.UpdateStock(id, UpdateStock);
    modalEditInstance.hide();
    init();
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    alert("No se pudo actualizar el stock.");
  }
}

// ----------------------------
// Crear Nuevo Stock
// ----------------------------
async function handleCreateSubmit(event) {
  event.preventDefault();

  const newStock = {
    unidad_medida: (document.getElementById("create-unidad-medida").value),
    id_produccion: parseInt(document.getElementById("create-id-produccion").value),
    cantidad_disponible: parseInt(document.getElementById("create-cantidad-disponible").value),
  };

  try {
    await stockService.CreateStock(newStock);
    alert("Stock creado correctamente");
    event.target.reset();
    init();
  } catch (error) {
    console.error("Error al crear stock:", error);
    alert("No se pudo registrar el stock.");
  }
}


// ----------------------------
// Manejo de clics en tabla
// ----------------------------
function handleTableClick(event) {
  const editBtn = event.target.closest(".btn-edit-stock");

  if (editBtn) {
    const id = editBtn.dataset.id;
    openEditModal(id);
  }

}

// ----------------------------
// Función principal INIT
// ----------------------------
export async function init() {
  const tbody = document.getElementById("stock-table-body");
  tbody.innerHTML = `
      <tr><td colspan="6" class="text-center">Cargando...</td></tr>
  `;

  try {
    // Usar el nuevo endpoint que trae todos los registros
    const stocks = await stockService.GetStockAll();

    if (!stocks || stocks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No hay registros.</td></tr>`;
    } else {
      tbody.innerHTML = stocks.map(createStockRow).join("");
    }

  } catch (error) {
    console.error("Error al obtener stock:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger text-center">Error al cargar datos.</td></tr>`;
  }

  tbody.onclick = handleTableClick;

  document
    .getElementById("create-stock-form")
    .addEventListener("submit", handleCreateSubmit);

  document
    .getElementById("edit-stock-form")
    .addEventListener("submit", handleEditSubmit);
}

// ----------------------------
// Inicializar al cargar página
// ----------------------------
init();