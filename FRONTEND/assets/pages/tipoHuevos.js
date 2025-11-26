import { TipoHuevosService } from '../js/api/tipoHuevo.service.js';
import { shedService } from '../js/api/shed.service.js';

const tipoHuevos = TipoHuevosService.GetTipoHuevosAll();

console.log(tipoHuevos);

async function init(page = 1) {

console.log("tipoHuevos");
 
 
 }
  export async function cargarTipoHuevos() {

    console.log("tipoHuevoExport");
    try {
        const tiposHuevos = await TipoHuevosService.GetTipoHuevosAll();
        const sheds = await shedService.getSheds();
        const select = document.getElementById('create-id-tipo-huevo');
        const selectGalpon = document.getElementById('create-id-galpon');
        
        tiposHuevos.forEach(huevo => {
            const option = document.createElement('option');
            option.value = huevo.Tamaño;
            option.textContent = `${huevo.Tamaño}`;
            select.appendChild(option);
            console.log(option)
        });

        sheds.forEach(item => {
            const option = document.createElement('option');
            option.value = item.nombre;
            option.textContent = `${item.nombre}`;
            selectGalpon.appendChild(option);
            console.log(option)
        });
        
    } catch {
        console.error('Error cargando tipos de huevo:');
    }
}

// Llamar la función
cargarTipoHuevos();
export { init };