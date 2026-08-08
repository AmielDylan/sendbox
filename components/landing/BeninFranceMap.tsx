import { DottedMap, type Marker } from '@/components/ui/dotted-map'

type RouteMarker = Marker & {
  label: string
  flagSrc: string
}

const DOT_RADIUS = 0.45
// Rayon du badge drapeau, affiché par-dessus le marqueur (renderMarkerOverlay).
// Sert aussi de taille de marqueur pour que le pulse parte bien du bord du drapeau.
const FLAG_RADIUS = 1.5

const PILL_HEIGHT = 2.6
const PILL_GAP = 1
const PILL_PADDING_X = 1.3
const PILL_CHAR_WIDTH = 1.3

const markers: RouteMarker[] = [
  {
    lat: 6.3703,
    lng: 2.3912,
    size: FLAG_RADIUS,
    label: 'Bénin',
    flagSrc: '/flags/bj.svg',
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    size: FLAG_RADIUS,
    label: 'France',
    flagSrc: '/flags/fr.svg',
  },
]

export function BeninFranceMap() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border bg-background">
      <DottedMap<RouteMarker>
        markers={markers}
        pulse
        pulseScale={1.6}
        pulseOpacity={0.45}
        dotRadius={DOT_RADIUS}
        markerColor="#FDBA74"
        dotColor="currentColor"
        className="text-muted-foreground/30"
        renderMarkerOverlay={({ marker, index, x, y }) => {
          const pillWidth =
            PILL_PADDING_X * 2 + marker.label.length * PILL_CHAR_WIDTH
          const pillX = x + FLAG_RADIUS + PILL_GAP

          return (
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

              <rect
                x={pillX}
                y={y - PILL_HEIGHT / 2}
                width={pillWidth}
                height={PILL_HEIGHT}
                rx={PILL_HEIGHT / 2}
                className="fill-muted"
              />
              <text
                x={pillX + pillWidth / 2}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={1.5}
                className="fill-foreground font-medium select-none"
              >
                {marker.label}
              </text>
            </g>
          )
        }}
      />
    </div>
  )
}
