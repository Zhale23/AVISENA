const mainContent = document.getElementById("main-content");
const navLinks = document.querySelector(".app-nav");

console.log("main.js cargado. El script principal está listo.");

const loadContent = async (page) => {
  console.log(`Paso 2: Se llamó a loadContent con el parámetro: '${page}'`);
  try {
    const response = await fetch(`pages/${page}.html`);
    console.log(
      "Paso 3: Se intentó hacer fetch. Respuesta recibida:",
      response
    );

    if (!response.ok) {
      // Si la respuesta no es OK, lanzamos un error para que lo capture el catch.
      throw new Error(
        `Error de red: ${response.status} - ${response.statusText}`
      );
    }
    const html = await response.text();
    mainContent.innerHTML = html;
    console.log("Paso 4: El contenido HTML se ha inyectado en #main-content.");

    // Aplicar permisos después de cargar contenido
    if (typeof window.aplicarPermisos === "function") {
      setTimeout(() => window.aplicarPermisos(page), 50);
    }

    //  // Actualizar clase active en el menú
    // updateActiveMenuItem(page);

    if (page === "aislamientos") {
      import("../pages/isolations.js").then((isolationModule) =>
        isolationModule.init()
      ); // llama la función modulo en isolations.js
    }
    if (page === "incidentes_gallina") {
      import("../pages/incident_chicken.js").then((incident_chickenModule) =>
        incident_chickenModule.init()
      ); // llama la función modulo en isolations.js
    }
    if (page === "chickens") {
      import("../pages/chickens.js").then((cihckensModule) =>
        cihckensModule.init()
      ); // llama la función modulo en isolations.js
    }

    if (page === "rescue") {
      import("../pages/rescue.js").then((rescueModule) => rescueModule.init()); // llama la función modulo en isolations.js
    }

    if (page === "tipos_gallinas") {
      import("../pages/tipos_gallinas.js").then((tipo_gallinasModule) =>
        tipo_gallinasModule.init()
      );
    }

    //______________ GRUPO A____________
    if (page === "incidentes") {
      import("../pages/incidentes.js").then((incidentesModule) =>
        incidentesModule.init()
      );
    }
    if (page === "galpones") {
      import("../pages/sheds.js").then((shedsModule) => shedsModule.init()); // llama la función modulo en sheds.js
    }
    if (page === "categorias_inventario") {
      import("../pages/categories_inventory.js").then(
        (categoriesInventoryModule) => categoriesInventoryModule.init()
      );
    }
    if (page === "inventario") {
      import("../pages/inventory.js").then((inventoryModule) =>
        inventoryModule.init()
      );
    }
    if (page === "sensors") {
      import("../pages/sensors.js").then((sensorsModule) =>
        sensorsModule.init()
      );
    }

    if (page === "sensor_types") {
      import("../pages/sensor_types.js").then((sensorTypesModule) =>
        sensorTypesModule.init()
      );
    }

    if (page === "registro_sensores") {
      import("../pages/registro-sensores.js").then((registroSensoresModule) =>
        registroSensoresModule.init()
      );
    }

    if (page === "lands") {
      import("../pages/lands.js").then((landsModule) => landsModule.init());
    }

    if (page === "panel") {
      import("./pages/panel.js").then((panelModule) => panelModule.init());
    }

    if (page === "produccion_huevos") {
      import("../pages/produccionHuevos.js").then((module) => module.init());
      import("../pages/tipoHuevos.js").then((module) => module.init());
    }

    if (page === "roles") {
      import("../pages/roles.js").then((module) => module.init());
    }

    if (page === "stock") {
      import("../pages/stock.js").then(async (module) => {
        await module.init();

        requestAnimationFrame(() => {
          module.renderChart();
        });
      });
    }

    if (page === "users") {
      import("../pages/users.js").then((usersModule) => usersModule.init());
    }

    if (page === "metodos_pago") {
      import("../pages/metodo_pago.js").then((modulo) => modulo.init());
    }

    if (page === "detalles_venta") {
      import("../pages/detalles_venta.js").then((ventaDetalleModule) =>
        ventaDetalleModule.init()
      );
    }

    if (page === "tareas") {
      import("../pages/tareas.js").then((module) => {
        console.log("cargando tareas , esto para terminar que el dom cargue.");
        requestAnimationFrame(() => {
          console.log("entro");
          module.init();
        });
      });
    }

    if (page === "ventas") {
      import("../pages/ventas.js").then((ventasModule) => ventasModule.init());
    }

    if (page === "info_venta") {
      import("../pages/info_venta.js").then((infoVentaModule) =>
        infoVentaModule.init()
      );
    }
    if (page === "perfil") {
      import("./pages/perfil.js").then((perfilModule) => perfilModule.init());
    }

    if (page === "alimentos") {
      import("../pages/alimentos.js").then((alimentosModule) =>
        alimentosModule.init()
      );
    }

    if (page === "consumo_alimentos") {
      import("../pages/consumos_alimentos.js").then((consumosModule) =>
        consumosModule.init()
      );
    }
  } catch (error) {
    console.error("¡ERROR! Algo falló dentro de loadContent:", error);
    mainContent.innerHTML = `<h3 class="text-center text-danger p-5">No se pudo cargar el contenido. Revisa la consola (F12).</h3>`;
  }
};

navLinks.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-page]");
  console.log(event);

  if (link) {
    event.preventDefault();
    const pageToLoad = link.dataset.page;
    console.log(
      `Paso 1: Clic detectado. Se va a cargar la página: '${pageToLoad}'`
    );
    loadContent(pageToLoad);

    // const sidepanel = document.getElementById('app-sidepanel');
    // if (sidepanel && window.innerWidth < 1200) {
    //   sidepanel.classList.remove('sidepanel-visible');
    //   sidepanel.classList.add('sidepanel-hidden');
    // }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadContent("panel");
});

const logoutButton = document.getElementById("logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("Cerrando sesión...");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });
}

// Delegación global para accesos directos del panel
document.addEventListener("click", (e) => {
  const shortcut = e.target.closest(".shortcut-link[data-page]");
  if (shortcut) {
    e.preventDefault();
    const page = shortcut.dataset.page;
    console.log(`[Shortcut] Cargando página dinámica: ${page}`);
    loadContent(page);
  }
});
// para  llamar pagnas dentro de paginas
window.loadContent = loadContent;
