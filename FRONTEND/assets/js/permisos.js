// Sistema simple de permisos para botones
(function () {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rol = user.nombre_rol ? user.nombre_rol.toLowerCase() : "";

  // Variable global para guardar el módulo actual
  window._currentModule = null;

  // Permisos por rol y módulo (C=crear, E=editar, D=eliminar)
  const permisos = {
    superadmin: {
      // TODO
      users: { crear: true, editar: true, eliminar: true },
      roles: { crear: true, editar: true, eliminar: true },
      tareas: { crear: true, editar: true, eliminar: true },
      lands: { crear: true, editar: true, eliminar: true },
      galpones: { crear: true, editar: true, eliminar: true },
      incidentes: { crear: true, editar: true, eliminar: true },
      inventario: { crear: true, editar: true, eliminar: true },
      sensors: { crear: true, editar: true, eliminar: true },
      sensor_types: { crear: true, editar: true, eliminar: true },
      registro_sensores: { crear: false, editar: false, eliminar: false },
      incidentes_gallina: { crear: true, editar: true, eliminar: true },
      chickens: { crear: true, editar: true, eliminar: true },
      tipos_gallinas: { crear: true, editar: true, eliminar: true },
      rescue: { crear: true, editar: true, eliminar: true },
      aislamientos: { crear: true, editar: true, eliminar: true },
      produccion_huevos: { crear: true, editar: true, eliminar: true },
      stock: { crear: true, editar: true, eliminar: true },
      ventas: { crear: true, editar: true, eliminar: true },
    },
    administrador: {
      // TODO menos CRUD de superadmin
      users: { crear: true, editar: true, eliminar: true }, // Se bloqueará superadmin en el código
      roles: { crear: true, editar: true, eliminar: true },
      tareas: { crear: true, editar: true, eliminar: true },
      lands: { crear: true, editar: true, eliminar: true },
      galpones: { crear: true, editar: true, eliminar: true },
      incidentes: { crear: true, editar: true, eliminar: true },
      inventario: { crear: true, editar: true, eliminar: true },
      sensors: { crear: true, editar: true, eliminar: false },
      sensor_types: { crear: true, editar: true, eliminar: false },
      registro_sensores: { crear: false, editar: false, eliminar: false },
      incidentes_gallina: { crear: true, editar: true, eliminar: true },
      chickens: { crear: true, editar: true, eliminar: true },
      tipos_gallinas: { crear: true, editar: true, eliminar: true },
      rescue: { crear: true, editar: true, eliminar: true },
      aislamientos: { crear: true, editar: true, eliminar: true },
      produccion_huevos: { crear: true, editar: true, eliminar: true },
      stock: { crear: true, editar: true, eliminar: true },
      ventas: { crear: true, editar: true, eliminar: true },
    },
    supervisor: {
      tareas: { crear: true, editar: true, eliminar: true },
      incidentes: { crear: true, editar: true, eliminar: true },
      inventario: { crear: true, editar: true, eliminar: false },
      sensors: { crear: true, editar: true, eliminar: false },
      sensor_types: { crear: true, editar: true, eliminar: false },
      registro_sensores: { crear: false, editar: false, eliminar: false },
      tipos_gallinas: { crear: true, editar: true, eliminar: false },
      rescue: { crear: true, editar: true, eliminar: false },
      chickens: { crear: true, editar: true, eliminar: false },
      incidentes_gallina: { crear: true, editar: true, eliminar: false },
      aislamientos: { crear: false, editar: false, eliminar: false }, // Solo ver
      produccion_huevos: { crear: true, editar: true, eliminar: false },
      stock: { crear: true, editar: true, eliminar: false },
    },
    operario: {
      tareas: { crear: false, editar: true, eliminar: false },
      galpones: { crear: false, editar: false, eliminar: false },
      incidentes: { crear: false, editar: true, eliminar: false },
      inventario: { crear: false, editar: false, eliminar: false },
      sensors: { crear: false, editar: false, eliminar: false },
      sensor_types: { crear: false, editar: false, eliminar: false },
      registro_sensores: { crear: false, editar: false, eliminar: false },
      tipos_gallinas: { crear: false, editar: false, eliminar: false },
      rescue: { crear: true, editar: true, eliminar: false },
      chickens: { crear: true, editar: true, eliminar: false },
      incidentes_gallina: { crear: true, editar: true, eliminar: false },
      aislamientos: { crear: false, editar: false, eliminar: false }, // Solo ver
      produccion_huevos: { crear: true, editar: true, eliminar: false },
      stock: { crear: true, editar: false, eliminar: false },
    },
  };

  // Función para verificar permiso
  window.tienePermiso = function (modulo, accion) {
    if (!rol || !permisos[rol]) return false;
    if (!permisos[rol][modulo]) return false;
    return permisos[rol][modulo][accion] || false;
  };

  // Aplicar permisos cuando el DOM esté listo
  document.addEventListener("DOMContentLoaded", function () {
    aplicarPermisos();
  });

  // También exponer para llamar manualmente después de cargar contenido dinámico
  window.aplicarPermisos = function (modulo = null) {
    // Si se pasa un módulo explícitamente, guardarlo
    if (modulo) {
      window._currentModule = modulo;
    }

    const paginaActual =
      modulo || window._currentModule || obtenerModuloActual();

    if (!paginaActual) {
      console.warn("No se pudo detectar el módulo actual");
      return;
    }

    console.log("Aplicando permisos para:", paginaActual, "Rol:", rol);

    // Ocultar botones de crear
    if (!tienePermiso(paginaActual, "crear")) {
      document
        .querySelectorAll(
          '[data-action="create"], [id*="btn-open-create"], [id*="create-"], .btn:has(i.fa-plus)'
        )
        .forEach((btn) => {
          if (btn.tagName === "BUTTON" || btn.classList.contains("btn")) {
            btn.style.display = "none";
          }
        });
    }

    // Ocultar botones de editar
    if (!tienePermiso(paginaActual, "editar")) {
      document
        .querySelectorAll('[data-action="edit"], .btn-edit, [onclick*="edit"]')
        .forEach((btn) => {
          btn.style.display = "none";
        });
    }

    // Ocultar botones de eliminar
    if (!tienePermiso(paginaActual, "eliminar")) {
      document
        .querySelectorAll(
          '[data-action="delete"], .btn-delete, [onclick*="delete"]'
        )
        .forEach((btn) => {
          btn.style.display = "none";
        });
    }

    // Para administrador: ocultar opción de crear/editar superadmin
    if (rol === "administrador" && paginaActual === "users") {
      ocultarOpcionSuperadmin();
    }
  };

  // Obtener módulo actual desde el contenido cargado
  function obtenerModuloActual() {
    // Método 1: Buscar en el último link clickeado (guardado por main.js)
    const activeLink = document.querySelector("a[data-page].active");
    if (activeLink) {
      return activeLink.getAttribute("data-page");
    }

    // Método 2: Buscar el último link con data-page que tenga contenido cargado
    const allLinks = document.querySelectorAll("a[data-page]");
    let lastPage = null;
    allLinks.forEach((link) => {
      const page = link.getAttribute("data-page");
      if (page) lastPage = page;
    });

    // Método 3: Si no hay links, intentar desde el título de la página
    const pageTitle = document.querySelector(
      "#main-content h4, #main-content h1"
    );
    if (pageTitle) {
      const texto = pageTitle.textContent.toLowerCase().trim();
      // Mapeo de títulos a módulos
      const mapeo = {
        usuarios: "users",
        roles: "roles",
        tareas: "tareas",
        fincas: "lands",
        galpones: "galpones",
        incidentes: "incidentes",
        "inventario finca": "inventario",
        sensores: "sensors",
        "tipos de sensores": "sensor_types",
        "registros de sensores": "registro_sensores",
        "incidente gallina": "incidentes_gallina",
        "registro gallinas": "chickens",
        "tipos de gallinas": "tipos_gallinas",
        salvamento: "rescue",
        aislamientos: "aislamientos",
        "produccion huevos": "produccion_huevos",
        stock: "stock",
        ventas: "ventas",
      };
      return mapeo[texto] || null;
    }

    return null;
  }

  // Función específica para ocultar rol superadmin en selects
  function ocultarOpcionSuperadmin() {
    setTimeout(() => {
      document
        .querySelectorAll('select[id*="rol"], select[id*="id_rol"]')
        .forEach((select) => {
          const option = select.querySelector('option[value="1"]');
          if (option) option.style.display = "none";
        });
    }, 100);
  }
})();
