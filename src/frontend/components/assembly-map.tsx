"use client"

import { useEffect, useRef } from "react"
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
}

// Composant pour ajuster la vue de la carte
function MapController({ assemblies, selectedAssembly }: { assemblies: Assembly[], selectedAssembly: Assembly | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedAssembly && selectedAssembly.latitude && selectedAssembly.longitude) {
      // Zoomer sur l'assemblée sélectionnée
      map.setView([selectedAssembly.latitude, selectedAssembly.longitude], 13)
    } else {
      // Afficher toutes les assemblées
      const assembliesWithCoords = assemblies.filter(a => a.latitude && a.longitude)
      if (assembliesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          assembliesWithCoords.map(a => [a.latitude!, a.longitude!])
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      } else {
        // Vue par défaut sur la Belgique
        map.setView([50.5039, 4.4699], 8)
      }
    }
  }, [map, assemblies, selectedAssembly])

  return null
}

export default function AssemblyMap({ assemblies, selectedAssembly, onSelectAssembly }: AssemblyMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Cleanup de la carte lors du démontage
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Créer une icône personnalisée
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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController assemblies={assemblies} selectedAssembly={selectedAssembly} />

      {assembliesWithCoords.map((assembly) => (
        <Marker
          key={assembly.id}
          position={[assembly.latitude!, assembly.longitude!]}
          icon={createCustomIcon(selectedAssembly?.id === assembly.id)}
          eventHandlers={{
            click: () => onSelectAssembly(assembly)
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
