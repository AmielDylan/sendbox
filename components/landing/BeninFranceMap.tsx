import { DottedMap, type Marker } from '@/components/ui/dotted-map'

type RouteMarker = Marker & {
  label: string
  flag: string
}

const DOT_RADIUS = 0.45
// Le marqueur reste proche de la taille des autres points de la carte,
// le drapeau (plus grand que le point) se superpose par-dessus comme un pin.
const MARKER_RADIUS = DOT_RADIUS * 1.3

const markers: RouteMarker[] = [
  {
    lat: 6.3703,
    lng: 2.3912,
    size: MARKER_RADIUS,
    label: 'Cotonou',
    flag: '🇧🇯',
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    size: MARKER_RADIUS,
    label: 'Paris',
    flag: '🇫🇷',
  },
]

export function BeninFranceMap() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border bg-background">
      <DottedMap<RouteMarker>
        markers={markers}
        pulse
        dotRadius={DOT_RADIUS}
        markerColor="#FF6900"
        dotColor="currentColor"
        className="text-muted-foreground/30"
        renderMarkerOverlay={({ marker, x, y }) => (
          <g>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={2.6}
              className="select-none"
            >
              {marker.flag}
            </text>
            <text
              x={x}
              y={y + 4.5}
              textAnchor="middle"
              fontSize={2}
              fill="currentColor"
              className="select-none font-medium text-foreground"
            >
              {marker.label}
            </text>
          </g>
        )}
      />
    </div>
  )
}
