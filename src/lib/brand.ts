function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6; break
    case b: h = ((r - g) / d + 4) / 6; break
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generateBrandScale(hex: string): Record<string, string> {
  const [h, s] = hexToHsl(hex)
  return {
    '50':  hslToHex(h, Math.min(s * 0.25, 40), 97),
    '100': hslToHex(h, Math.min(s * 0.45, 55), 94),
    '200': hslToHex(h, Math.min(s * 0.65, 65), 87),
    '300': hslToHex(h, Math.min(s * 0.80, 75), 76),
    '400': hslToHex(h, s, 65),
    '500': hslToHex(h, s, 55),
    '600': hex,
    '700': hslToHex(h, s, 42),
    '800': hslToHex(h, s, 30),
    '900': hslToHex(h, s, 22),
    '950': hslToHex(h, s, 15),
  }
}

export function generateBrandCss(hex: string): string {
  const scale = generateBrandScale(hex)
  const vars = Object.entries(scale)
    .map(([k, v]) => `  --color-sky-${k}: ${v};`)
    .join('\n')
  return `:root {\n${vars}\n}`
}
