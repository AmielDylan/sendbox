import { DottedMap, type Marker } from '@/components/ui/dotted-map'

type RouteMarker = Marker & {
  label: string
  flag: string
}

const markers: RouteMarker[] = [
  {
    lat: 6.3703,
    lng: 2.3912,
    size: 3,
    label: 'Cotonou',
    flag: '🇧🇯',
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    size: 3,
    label: 'Paris',
    flag: '🇫🇷',
  },
]

export function BeninFranceMap() {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl border bg-background">
      <DottedMap<RouteMarker>
        markers={markers}
        pulse
        markerColor="#FF6900"
        dotColor="currentColor"
        className="text-muted-foreground/30"
        renderMarkerOverlay={({ marker, x, y }) => (
          <g>
            <text
              x={x}
              y={y - 3}
              textAnchor="middle"
              fontSize={4}
              className="select-none"
            >
              {marker.flag}
            </text>
            <text
              x={x}
              y={y + 5.5}
              textAnchor="middle"
              fontSize={2.4}
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
