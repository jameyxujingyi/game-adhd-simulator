export function isPointerInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

export function getGameViewportMetrics() {
  const viewport = document.querySelector('[data-game-viewport]')
  if (!(viewport instanceof HTMLElement)) return null
  const rect = viewport.getBoundingClientRect()
  const scale =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--game-scale')) || 1
  return { rect, scale }
}

export function clientToGame(clientX: number, clientY: number) {
  const metrics = getGameViewportMetrics()
  if (!metrics) return null
  return {
    x: (clientX - metrics.rect.left) / metrics.scale,
    y: (clientY - metrics.rect.top) / metrics.scale,
  }
}

export function getCenterInGame(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return clientToGame(rect.left + rect.width / 2, rect.top + rect.height / 2)
}

export function getSizeInGame(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const metrics = getGameViewportMetrics()
  if (!metrics) return null
  return {
    width: rect.width / metrics.scale,
    height: rect.height / metrics.scale,
  }
}

export function isHostOverlappingElementCenter(
  hostElement: HTMLElement,
  targetElement: HTMLElement,
  centerPadding = 10,
): boolean {
  const hostRect = hostElement.getBoundingClientRect()
  const targetRect = targetElement.getBoundingClientRect()
  const cx = targetRect.left + targetRect.width / 2
  const cy = targetRect.top + targetRect.height / 2
  return (
    cx >= hostRect.left - centerPadding &&
    cx <= hostRect.right + centerPadding &&
    cy >= hostRect.top - centerPadding &&
    cy <= hostRect.bottom + centerPadding
  )
}

export function isPointerNearElementCenter(
  clientX: number,
  clientY: number,
  element: HTMLElement,
  thresholdPx = 56,
): boolean {
  const rect = element.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = clientX - cx
  const dy = clientY - cy
  return Math.sqrt(dx * dx + dy * dy) <= thresholdPx
}
