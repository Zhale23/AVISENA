import ApexCharts from 'https://cdn.jsdelivr.net/npm/apexcharts@3.35.3/dist/apexcharts.esm.js';
import { stockService } from "../js/api/stock.service.js";

let modalEditInstance = null;

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
let limit = 10;
let fechaInicioGlobal = null;
let fechaFinGlobal = null;

// ----------------------------
// Crear fila de la tabla
// ----------------------------
function createStockRow(stock) {
  const tabla = `
    <tr>

        <!-- tipo -->
        <td>${
          stock.tipo == 1
            ? "AA"
            : stock.tipo == 2
              ? "AAA"
              : stock.tipo == 3
                ? "Super"
                : ""
        }</td>

        <!-- Unidad medida -->
        <td>${stock.unidad_medida}</td>

        <!-- nombre producto -->
        <td>${stock.nombre_producto}</td>

        <!-- Cantidad disponible -->
        <td>${stock.cantidad_disponible}</td>
    </tr>
  `;
  return tabla;
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
    document.getElementById("edit-id_produccion").value = stock.nombre_producto;
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
  const nombre_producto = parseInt(document.getElementById("create-id-produccion").value);
  const cantidad_disponible = parseInt(document.getElementById("create-cantidad-disponible").value);

  if (!unidad_medida || isNaN(nombre_producto) || isNaN(cantidad_disponible)) {
    alert("Por favor complete todos los campos correctamente.");
    return;
  }

  const newStock = { unidad_medida, nombre_producto, cantidad_disponible };

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

function renderPaginationControls() {
  const paginationDiv = document.getElementById("pagination-controls");
  if (!paginationDiv) return;


  paginationDiv.innerHTML = `
    <button id="btn-prev" class="btn btn-light text-success"><svg class="svg-inline--fa fa-chevron-left" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-left" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"></path></svg></button>
    <span class='px-3 bg-success align-content-center text-white'>${currentPage}</span>
    <button id="btn-next" class="btn btn-light text-success"><svg class="svg-inline--fa fa-chevron-right" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-right" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-fa-i2svg=""><path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"></path></svg></button>
  `;
  const botonPrev = document.getElementById("btn-prev").style.backgroundColor = '#f2f2f2'
  const botonSig = document.getElementById("btn-next").style.backgroundColor = '#f2f2f2'
  document.getElementById("btn-prev").onclick = () => {
    if (currentPage > 1) init(currentPage - 1);
  };

  document.getElementById("btn-next").onclick = () => {
    init(currentPage + 1);
  };
}
// ----------------------------
// Función principal INIT
// ----------------------------
export async function init() {
  const tbody = document.getElementById("stock-table-body");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center">Cargando...</td></tr>`;

  try {
    const stocks = await stockService.GetStockAll(); // stockkkks
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


  renderPaginationControls();
  renderDonutChart();

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

  // 2️⃣ Crear etiquetas tipo "Nombre (Unidad/Tipo)"
  const labels = stocks.map(s => {
    const tipo = s.tipo == 1 ? "AA" :
                 s.tipo == 2 ? "AAA" :
                 s.tipo == 3 ? "Super" : "";
    return `${s.nombre_producto} (${tipo || s.unidad_medida})`;
  });

  // 3️⃣ Cantidades de stock disponible
  const cantidades = stocks.map(s => s.cantidad_disponible);

  // 4️⃣ Detectar producto mayor y menor
  const mayor = stocks.reduce((max, s) =>
    s.cantidad_disponible > max.cantidad_disponible ? s : max
  );
  const menor = stocks.reduce((min, s) =>
    s.cantidad_disponible < min.cantidad_disponible ? s : min
  );

  document.getElementById("productoMayor").textContent =
    `Producto con mayor stock: ${mayor.nombre_producto} (${mayor.cantidad_disponible} unidades)`;

  document.getElementById("productoMenor").textContent =
    `Producto con menor stock: ${menor.nombre_producto} (${menor.cantidad_disponible} unidades)`;

  // 5️⃣ Calcular promedio
  const promedio = Math.round(cantidades.reduce((a, b) => a + b, 0) / cantidades.length);
  const promedioSeries = cantidades.map(() => promedio);
  // 6️⃣ Configurar gráfica (solo 2 líneas: Stock y Promedio)
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
      }
    ],
    chart: { type: 'bar', height: 350 },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 5 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: labels, labels: { rotate: -45, style: { fontSize: '13px' } } },
    yaxis: {
      title: { text: 'Cantidad (unidades)' },
      labels: { formatter: value => value.toFixed(0) }
    },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: val => val + " unidades" } }
  };

  const chart = new ApexCharts(chartDiv, options);
  chart.render();
}

export async function renderDonutChart() {
  console.log("Renderizando gráfica tipo dona...");

  // 1️⃣ Obtener datos desde la API
  const stocks = await stockService.GetStockAll();

  if (!stocks || stocks.length === 0) {
    console.warn("No hay stock para graficar.");
    return;
  }

  // 2️⃣ Etiquetas tipo "Nombre (Tipo/Unidad)"
  const labels = stocks.map(s => {
    const tipo = s.tipo == 1 ? "AA" :
                 s.tipo == 2 ? "AAA" :
                 s.tipo == 3 ? "Super" : "";
    const extra = tipo || s.unidad_medida;
    return extra ? `${s.nombre_producto} (${extra})` : s.nombre_producto;
  });

  // 3️⃣ Cantidades de stock
  const cantidades = stocks.map(s => s.cantidad_disponible);

  // 4️⃣ Configurar gráfica dona
  const chartDiv = document.querySelector("#donutChart"); // nuevo div para la dona
  if (!chartDiv) return;

  const options = {
    series: cantidades,
    chart: {
      type: 'donut',
      height: 350
    },
    labels: labels,
    legend: {
      position: 'right',
      fontSize: '18px'
    },
    tooltip: {
      y: {
        formatter: val => val + " unidades"
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              }
            }
          }
        }
      }
    }
  };

  const chart = new ApexCharts(chartDiv, options);
  chart.render();
}


