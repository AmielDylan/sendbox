import { DottedMap, type Marker } from '@/components/ui/dotted-map'

type RouteMarker = Marker & {
  flagSrc: string
}

const DOT_RADIUS = 0.6
// Rayon du badge drapeau, affiché par-dessus le marqueur (renderMarkerOverlay).
// Sert aussi de taille de marqueur pour que le pulse parte bien du bord du drapeau.
// Divisé par le zoom (scale-125) appliqué à la carte pour garder une taille rendue stable.
const FLAG_RADIUS = 1.2

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
    <div className="relative mt-6 aspect-[2/1] w-full max-h-[560px] overflow-hidden bg-background [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)] sm:mt-10">
      <DottedMap<RouteMarker>
        markers={markers}
        pulse
        pulseScale={2}
        markerFill={false}
        dotRadius={DOT_RADIUS}
        markerColor="var(--primary)"
        dotColor="currentColor"
        className="scale-125 text-muted-foreground/30"
        renderMarkerOverlay={({ marker, index, x, y }) => (
          <g>
            <radialGradient id={`flag-fade-${index}`}>
              <stop offset="80%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id={`flag-mask-${index}`}>
              <circle
                cx={x}
                cy={y}
                r={FLAG_RADIUS}
                fill={`url(#flag-fade-${index})`}
              />
            </mask>
            <circle
              cx={x}
              cy={y}
              r={FLAG_RADIUS}
              className="fill-muted-foreground/30"
            />
            <image
              href={marker.flagSrc}
              x={x - FLAG_RADIUS}
              y={y - FLAG_RADIUS}
              width={FLAG_RADIUS * 2}
              height={FLAG_RADIUS * 2}
              mask={`url(#flag-mask-${index})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        )}
      />
    </div>
  )
}
