// Inicializar el mapa
const map = L.map('map').setView([40.4168, -3.7038], 13); // Coordenadas de Madrid, España

// Cargar una capa de mosaico
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Agregar marcadores al hacer clic en el mapa
let markers = [];
let arrows = [];
let rutasAnteriores = [];

map.on('click', function(e) {
    const marker = L.marker(e.latlng).addTo(map);
    markers.push(marker);
});

// Función para obtener y trazar rutas utilizando el servicio de enrutamiento de OpenStreetMap
function obtenerRuta(transporte, unirRutas = false) {
    if (markers.length < 2) {
        alert('Por favor, selecciona al menos dos puntos.');
        return;
    }

    const waypoints = markers.map(marker => marker.getLatLng());
    const mode = transporte || 'driving'; // 'driving', 'walking', 'cycling'

    const url = `https://router.project-osrm.org/route/v1/${mode}/${waypoints.map(latlng => `${latlng.lng},${latlng.lat}`).join(';')}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const routeCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                
                if (unirRutas && rutasAnteriores.length > 0) {
                    rutasAnteriores.push(...routeCoords);
                } else {
                    rutasAnteriores = routeCoords;
                }

                const polyline = L.polyline(rutasAnteriores, { color: 'blue' }).addTo(map);
                map.fitBounds(polyline.getBounds());

                // Mostrar flechas y números en la ruta
                for (let i = 0; i < routeCoords.length - 1; i++) {
                    const start = routeCoords[i];
                    const end = routeCoords[i + 1];
                    const midPoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

                    // Crear un marcador de flecha
                    const arrow = L.marker(midPoint, {
                        icon: L.divIcon({
                            className: 'arrow-icon',
                            html: `<div style="transform: rotate(${Math.atan2(end[0] - start[0], end[1] - start[1])}rad); width: 20px; height: 20px; border: solid black; border-width: 0 2px 2px 0; display: inline-block; padding: 3px;"></div>`,
                            iconSize: [20, 20]
                        })
                    }).addTo(map);
                    arrows.push(arrow);

                    // Crear un marcador con el número de la arista
                    const numberMarker = L.marker(midPoint, {
                        icon: L.divIcon({
                            className: 'number-icon',
                            html: `<div style="background-color: white; border: 1px solid black; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">${i + 1}</div>`,
                            iconSize: [20, 20]
                        })
                    }).addTo(map);
                    arrows.push(numberMarker);
                }

                // Mostrar información de la ruta
                const distance = (route.distance / 1000).toFixed(2); // Convertir a kilómetros
                const duration = (route.duration / 60).toFixed(2); // Convertir a minutos
                document.getElementById('info').innerHTML = `
                    <strong>Ruta:</strong><br>
                    <span>Distancia: ${distance} km</span><br>
                    <span>Tiempo estimado: ${duration} minutos</span>
                `;
            } else {
                alert('No se pudo encontrar una ruta.');
            }
        })
        .catch(error => {
            console.error('Error al obtener la ruta:', error);
            alert('Hubo un error al obtener la ruta.');
        });
}

// Función para limpiar los marcadores y las flechas
function limpiarMarcadores() {
    markers.forEach(marker => map.removeLayer(marker)); // Eliminar cada marcador del mapa
    markers = []; // Reiniciar el array de marcadores
    arrows.forEach(arrow => map.removeLayer(arrow)); // Eliminar cada flecha del mapa
    arrows = []; // Reiniciar el array de flechas
    document.getElementById('info').innerHTML = ''; // Limpiar información de la ruta
}

// Función para limpiar los marcadores y las rutas
function limpiarTodo() {
    limpiarMarcadores(); // Limpiar los marcadores y las flechas

    // Eliminar todas las polilíneas del mapa
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    rutasAnteriores = []; // Reiniciar las rutas anteriores
}

// Vincular botones a funciones de enrutamiento
document.getElementById('ruta-dron').addEventListener('click', () => obtenerRuta('driving'));
document.getElementById('ruta-completa').addEventListener('click', () => obtenerRuta('driving', true));
document.getElementById('limpiar').addEventListener('click', limpiarMarcadores);
document.getElementById('limpiar-todo').addEventListener('click', limpiarTodo);