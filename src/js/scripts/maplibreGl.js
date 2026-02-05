import "maplibre-gl/dist/maplibre-gl.css"

// Ключ API для MapTiler
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "Srt0jvP7q467BxJntAQl"
// Генератор URL для стилів
const getStyleUrl = (styleName) => `https://api.maptiler.com/maps/${styleName}/style.json?key=${MAPTILER_KEY}`

// Налаштування стилів карти
const MAP_STYLES = {
    streets: "streets-v2",
    dataviz: "dataviz-v4",
    aquarelle: "aquarelle-v4",
    base: "base-v4",
    landscape: "landscape-v4",
    ocean: "ocean-v4",
    openstreetmap: "openstreetmap",
    outdoor: "outdoor-v4",
    hybrid: "satellite-hybrid",
    satellite: "satellite-v4",
    toner: "toner-v2",
    topo: "topo-v4",
    winter: "winter-v4"
}

// Дані для міток на карті
const LOCATIONS = [
    { coords: [30.5234, 50.4501], title: "Майдан Незалежності" },
    { coords: [30.5191, 50.4488], title: "Золоті Ворота" }
]

// Основна функція ініціалізації карти
async function initMap() {
    const container = document.getElementById("map")
    if (!container) return

    try {
        const { default: maplibregl } = await import("maplibre-gl")
        const map = new maplibregl.Map({
            container: container,
            style: getStyleUrl(MAP_STYLES.streets),
            center: [30.5234, 50.4501],
            zoom: 15.5,
            pitch: 50,
            bearing: -20,
            antialias: true
        })

        // Навігація (Zoom + Compass)
        map.addControl(new maplibregl.NavigationControl(), "top-right")

        // Додаємо мітки після завантаження
        LOCATIONS.forEach(loc => {
            // const markerColor = "#FF0000" // Можна задати колір мітки
            new maplibregl.Marker({ ...(typeof markerColor !== 'undefined' && { color: markerColor }) })
                .setLngLat(loc.coords)
                .setPopup(new maplibregl.Popup().setHTML(`<b class="maplibregl-popup-title">${loc.title}</b>`))
                .addTo(map)
        })

        return map
    } catch (error) {
        console.error("Не вдалося ініціалізувати MapLibre:", error)
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMap)
} else {
    initMap()
}