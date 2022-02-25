import type { BadgePreset, Sponsor, Sponsorship } from './types'
import type { SponsorkitConfig } from '.'

export function genSvgImage(x: number, y: number, size: number, url: string) {
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" xlink:href="${url}"/>`
}

export function generateBadge(
  x: number,
  y: number,
  sponsor: Sponsor,
  preset: BadgePreset,
) {
  const size = preset.avatar.size
  const { login, avatarUrl } = sponsor
  let name = (sponsor.name || sponsor.login).trim()
  const url = sponsor.linkUrl || `https://github.com/${sponsor.login}`

  if (preset.name && preset.name.maxLength && name.length > preset.name.maxLength) {
    if (name.includes(' '))
      name = name.split(' ')[0]
    else
      name = `${name.slice(0, preset.name.maxLength - 3)}...`
  }

  return `
<a xlink:href="${url}" class="${preset.classes || 'sponsor-link'}" target="_blank" id="${login}">
  ${preset.name ? `<text x="${x + size / 2}" y="${y + size + 18}" text-anchor="middle" class="${preset.name.classes || 'sponsor-name'}" fill="${preset.name.color || 'currentColor'}">${name}</text>` : ''}
  ${genSvgImage(x, y, size, avatarUrl)}
</a>`.trim()
}

export class SvgComposer {
  height = 0
  body = ''

  constructor(public readonly config: Required<SponsorkitConfig>) {}

  addSpan(height = 0) {
    this.height += height
    return this
  }

  addTitle(text: string, classes = 'sponsor-tier-title') {
    return this.addText(text, classes)
  }

  addText(text: string, classes = 'text') {
    this.body += `<text x="${this.config.width / 2}" y="${this.height}" text-anchor="middle" class="${classes}">${text}</text>`
    this.height += 20
    return this
  }

  addRaw(svg: string) {
    this.body += svg
    return this
  }

  addSponsorLine(sponsors: Sponsorship[], preset: BadgePreset) {
    const offsetX = (this.config.width - sponsors.length * preset.boxWidth) / 2 + (preset.boxWidth - preset.avatar.size) / 2
    this.body += sponsors
      .map((s, i) => {
        const x = offsetX + preset.boxWidth * i
        const y = this.height
        return generateBadge(x, y, s.sponsor, preset)
      })
      .join('\n')
    this.height += preset.boxHeight
  }

  addSponsorGrid(sponsors: Sponsorship[], preset: BadgePreset) {
    const perLine = Math.floor((this.config.width - (preset.container?.sidePadding || 0) * 2) / preset.boxWidth)

    new Array(Math.ceil(sponsors.length / perLine))
      .fill(0)
      .forEach((_, i) => {
        this.addSponsorLine(sponsors.slice(i * perLine, (i + 1) * perLine), preset)
      })

    return this
  }

  generateSvg() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.config.width}" height="${this.height}">
<!-- Generated by https://github.com/antfu/sponsorskit -->
<style>${this.config.svgInlineCSS}</style>
${this.body}
</svg>
`
  }
}
