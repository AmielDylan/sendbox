import { DottedMap, type Marker } from '@/components/ui/dotted-map'

type RouteMarker = Marker & {
  flagSrc: string
}

const DOT_RADIUS = 0.45
// Rayon du badge drapeau, affiché par-dessus le marqueur (renderMarkerOverlay).
// Sert aussi de taille de marqueur pour que le pulse parte bien du bord du drapeau.
const FLAG_RADIUS = 1.5

const markers: RouteMarker[] = [
  {
    lat: 6.3703,
    lng: 2.3912,
    size: FLAG_RADIUS,
    flagSrc: '/flags/bj.svg',
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    size: FLAG_RADIUS,
    flagSrc: '/flags/fr.svg',
  },
]

export function BeninFranceMap() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden bg-background">
      <DottedMap<RouteMarker>
        markers={markers}
        pulse
        pulseScale={2}
        dotRadius={DOT_RADIUS}
        markerColor="#FF6900"
        dotColor="currentColor"
        className="text-muted-foreground/30"
        renderMarkerOverlay={({ marker, index, x, y }) => (
          <g>
            <clipPath id={`flag-clip-${index}`}>
              <circle cx={x} cy={y} r={FLAG_RADIUS} />
            </clipPath>
            <image
              href={marker.flagSrc}
              x={x - FLAG_RADIUS}
              y={y - FLAG_RADIUS}
              width={FLAG_RADIUS * 2}
              height={FLAG_RADIUS * 2}
              clipPath={`url(#flag-clip-${index})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        )}
      />
    </div>
  )
}
