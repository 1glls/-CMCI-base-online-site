"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Assembly {
  id: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  schedule: string
  phone: string
  email: string
  status: string
}

interface AssemblyMapProps {
  assemblies: Assembly[]
  selectedAssembly: Assembly | null
  onSelectAssembly: (assembly: Assembly) => void
  /** « dark » : fond de carte CARTO sombre et reperes or (charte Nuit & or). */
  variant?: "light" | "dark"
  /** Assemblee survolee (dans la liste ou sur la carte) : son repere s'anime. */
  hoveredId?: string | null
  /** Survol d'un repere sur la carte (null quand la souris le quitte). */
  onHoverAssembly?: (id: string | null) => void
}

/** Texte saisi dans l'admin, insere dans du HTML Leaflet : on l'echappe. */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

/** Sur grand ecran, la liste des assemblees couvre ~46 % de la carte a gauche. */
const listCover = (map: L.Map, variant: string) =>
  variant === "dark" && map.getSize().x >= 1024 ? Math.round(map.getSize().x * 0.46) : 0

// Composant pour ajuster la vue de la carte
function MapController({ assemblies, selectedAssembly, variant }: { assemblies: Assembly[], selectedAssembly: Assembly | null, variant: string }) {
  const map = useMap()

  useEffect(() => {
    const cover = listCover(map, variant)
    if (selectedAssembly && selectedAssembly.latitude && selectedAssembly.longitude) {
      // Zoomer sur l'assemblée sélectionnée, en la gardant hors de la zone de la liste
      const zoom = 13
      const point = map.project([selectedAssembly.latitude, selectedAssembly.longitude], zoom).subtract([cover / 2, 0])
      map.setView(map.unproject(point, zoom), zoom)
    } else {
      // Afficher toutes les assemblées
      const assembliesWithCoords = assemblies.filter(a => a.latitude && a.longitude)
      if (assembliesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          assembliesWithCoords.map(a => [a.latitude!, a.longitude!])
        )
        map.fitBounds(bounds, { paddingTopLeft: [cover + 50, 60], paddingBottomRight: [60, 60], maxZoom: 11 })
      } else {
        // Vue par défaut sur la Belgique
        map.setView([50.5039, 4.4699], 8)
      }
    }
  }, [map, assemblies, selectedAssembly, variant])

  return null
}

export default function AssemblyMap({ assemblies, selectedAssembly, onSelectAssembly, variant = "light", hoveredId = null, onHoverAssembly }: AssemblyMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})

  // Cleanup de la carte lors du démontage
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Icône de la variante claire (ancienne page Assemblées)
  const createCustomIcon = (isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${isSelected ? '#10b981' : '#1a365d'};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" transform="rotate(45)" style="margin-top: -4px; margin-left: -4px;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })
  }

  const assembliesWithCoords = assemblies.filter(a => a.latitude && a.longitude)

  // Charte sombre : un repere fixe par assemblee (losange, deux ondes, etiquette).
  // On ne recree jamais l'icone au survol : on pose seulement des classes CSS
  // (is-active, is-selected), ce qui permet des transitions fluides.
  const iconsKey = assembliesWithCoords.map((a) => `${a.id}:${a.city}`).join("|")
  const darkIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {}
    for (const a of assembliesWithCoords) {
      icons[a.id] = L.divIcon({
        className: "cmci-marker",
        html:
          '<span class="cmci-marker__onde"></span><span class="cmci-marker__onde cmci-marker__onde--2"></span>' +
          '<span class="cmci-marker__losange"></span>' +
          `<span class="cmci-marker__nom">CMCI ${escapeHtml(a.city)}</span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -12],
      })
    }
    return icons
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iconsKey])

  const paint = useCallback(() => {
    if (variant !== "dark") return
    for (const [id, marker] of Object.entries(markerRefs.current)) {
      const el = marker?.getElement()
      if (!marker || !el) continue
      const active = id === hoveredId
      const selected = id === selectedAssembly?.id
      el.classList.toggle("is-active", active)
      el.classList.toggle("is-selected", selected)
      marker.setZIndexOffset(active ? 1000 : selected ? 500 : 0)
    }
  }, [variant, hoveredId, selectedAssembly])

  useEffect(() => { paint() }, [paint, iconsKey])

  // Centre par défaut (Belgique)
  const defaultCenter: [number, number] = [50.5039, 4.4699]
  const defaultZoom = 8

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      ref={mapRef}
      whenReady={(map) => {
        mapRef.current = map.target
      }}
    >
      {/* En sombre, le parent (.map-nuit) inverse les tuiles OSM en CSS : les
          fonds sombres CARTO exigent desormais une cle d'API. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController assemblies={assemblies} selectedAssembly={selectedAssembly} variant={variant} />

      {assembliesWithCoords.map((assembly) => (
        <Marker
          key={assembly.id}
          position={[assembly.latitude!, assembly.longitude!]}
          ref={(m) => { markerRefs.current[assembly.id] = m }}
          icon={variant === "dark" ? darkIcons[assembly.id] : createCustomIcon(selectedAssembly?.id === assembly.id)}
          eventHandlers={{
            click: () => onSelectAssembly(assembly),
            add: () => paint(),
            mouseover: () => onHoverAssembly?.(assembly.id),
            mouseout: () => onHoverAssembly?.(null),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">CMCI {assembly.city}</h3>
              <p className="text-sm text-gray-600 mb-2">{assembly.address}</p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Horaires:</strong> {assembly.schedule}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Tél:</strong> {assembly.phone}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {assembly.email}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
