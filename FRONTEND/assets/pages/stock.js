import ApexCharts from 'https://cdn.jsdelivr.net/npm/apexcharts@3.35.3/dist/apexcharts.esm.js';
import { stockService } from "../js/api/stock.service.js";

let modalEditInstance = null;

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
            <button class="btn btn-sm btn-success btn-edit-stock" style="color: rgb(12, 12, 12);" data-id="${stock.id_producto}">
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

    document.getElementById("edit-id_producto").value = stock.id_producto;
    document.getElementById("edit-unidad_medida").value = stock.unidad_medida;
    document.getElementById("edit-id_produccion").value = stock.id_produccion;
    document.getElementById("edit-cantidad_disponible").value = stock.cantidad_disponible;

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

  const updatedStock = {
    unidad_medida: document.getElementById("edit-unidad_medida").value,
    id_produccion: parseInt(document.getElementById("edit-id_produccion").value),
    cantidad_disponible: parseInt(document.getElementById("edit-cantidad_disponible").value),
  };

  const id = document.getElementById("edit-id_producto").value;

  try {
    console.log("Enviando al backend:", id, updatedStock); // <--- Ver qué se envía
    const response = await stockService.UpdateStock(id, updatedStock);
    console.log("Respuesta backend:", response); // <--- Ver respuesta real
    Swal.fire({
        position: "top-center",
        icon: "success",
        title: `Stock actualizado con éxito.`,
        showConfirmButton: false,
        timer: 1500
    });
    modalEditInstance.hide();
    init();
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    // Si el error es un objeto JSON
    if (error instanceof Object) console.error("Detalle del error:", JSON.stringify(error));
    alert("No se pudo actualizar el stock. Revisa la consola.");
  }
}
// ----------------------------
// Crear Nuevo Stock
// ----------------------------
async function handleCreateSubmit(event) {
  event.preventDefault();

  const unidad_medida = document.getElementById("create-unidad-medida").value;
  const id_produccion = parseInt(document.getElementById("create-id-produccion").value);
  const cantidad_disponible = parseInt(document.getElementById("create-cantidad-disponible").value);

  if (!unidad_medida || isNaN(id_produccion) || isNaN(cantidad_disponible)) {
    alert("Por favor complete todos los campos correctamente.");
    return;
  }

  const newStock = { unidad_medida, id_produccion, cantidad_disponible };

  try {
    const response = await stockService.CreateStock(newStock);
    console.log("Respuesta del backend:", response);
    Swal.fire({
        position: "top-center",
        icon: "success",
        title: `Stock creado con éxito.`,
        showConfirmButton: false,
        timer: 1500
      });
    event.target.reset();

    const modalElement = document.getElementById("create-stock-modal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();

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
  const deleteBtn = event.target.closest(".btn-delete-stock");

  if (editBtn) {
    const id = editBtn.dataset.id;
    openEditModal(id);
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    deleteStock(id);
  }
}

// ----------------------------
// Función principal INIT
// ----------------------------
export async function init() {
  const tbody = document.getElementById("stock-table-body");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center">Cargando...</td></tr>`;

  try {
    const stocks = await stockService.GetStockAll();
    console.log("Stocks obtenidos del backend:", stocks);

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

  document.getElementById("create-stock-form")
          .addEventListener("submit", handleCreateSubmit);

  document.getElementById("edit-stock-form")
          .addEventListener("submit", handleEditSubmit);
}
////////////////////////////////
////////  GRAFICA *************
//////////////////////////////

export async function renderChart() {
  console.log("Renderizando gráfica con datos reales...");

  // 1️⃣ Obtener los datos desde la API
  const stocks = await stockService.GetStockAll();

  if (!stocks || stocks.length === 0) {
    console.warn("No hay stock para graficar.");
    return;
  }

  // 2️⃣ Obtener etiquetas y cantidades
  const labels = stocks.map(s => "Prod " + s.id_producto);
  const cantidades = stocks.map(s => s.cantidad_disponible);

  // 3️⃣ Detectar producto mayor y menor
  const mayor = stocks.reduce((max, s) =>
    s.cantidad_disponible > max.cantidad_disponible ? s : max
  );

  const menor = stocks.reduce((min, s) =>
    s.cantidad_disponible < min.cantidad_disponible ? s : min
  );

  // 4️⃣ Mostrar en tu HTML
  document.getElementById("productoMayor").textContent =
    `Producto con mayor stock: ID ${mayor.id_producto} (${mayor.cantidad_disponible} unidades)`;

  document.getElementById("productoMenor").textContent =
    `Producto con menor stock: ID ${menor.id_producto} (${menor.cantidad_disponible} unidades)`;

  // 5️⃣ CÁLCULOS REALES para las 3 barras
  const promedio = cantidades.reduce((a, b) => a + b, 0) / cantidades.length;
  const maximo = Math.max(...cantidades);

  const promedioSeries = cantidades.map(() => promedio);
  const maxSeries = cantidades.map(() => maximo);

  // 6️⃣ Configurar gráfica
  const chartDiv = document.querySelector("#chart");
  if (!chartDiv) return;

  const options = {
    series: [
      {
        name: "Stock disponible",
        data: cantidades
      },
      {
        name: "Promedio de stock",
        data: promedioSeries
      },
      {
        name: "Stock máximo histórico",
        data: maxSeries
      }
    ],
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5,
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -45,
        style: { fontSize: '13px' }
      }
    },
    yaxis: {
      title: {
        text: 'Cantidad (unidades)'
      }
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: val => val + " unidades"
      }
    }
  };

  const chart = new ApexCharts(chartDiv, options);
  chart.render();
}
