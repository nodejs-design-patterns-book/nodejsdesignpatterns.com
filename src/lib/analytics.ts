/**
 * Analytics Utility Module for GA4 Event Tracking
 *
 * This module provides type-safe helper functions for sending GA4 events.
 * It uses the global gtag() function which runs in the main thread.
 *
 * @module analytics
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Book format options for purchase tracking */
export type BookFormat = 'print' | 'ebook'

/** Button/CTA location identifiers */
export type ButtonLocation =
  | 'hero'
  | 'problem_statement'
  | 'action_plan'
  | 'quotes'
  | 'reviews'
  | 'sidebar'
  | 'footer'
  | 'blog_promo'
  | 'free_chapter_section'

/** CTA position within a page */
export type CtaPosition = 'sidebar' | 'inline' | 'footer'

/** Blog promo variant identifiers (promo01-promo10) */
export type PromoVariant =
  | 'promo01'
  | 'promo02'
  | 'promo03'
  | 'promo04'
  | 'promo05'
  | 'promo06'
  | 'promo07'
  | 'promo08'
  | 'promo09'
  | 'promo10'

/** Scroll depth thresholds */
export type ScrollDepthThreshold = 25 | 50 | 75 | 100

/** Navigation type identifiers */
export type NavigationType = 'header_link' | 'footer_link' | 'inline_link'

// ============================================================================
// Event Parameter Interfaces
// ============================================================================

export interface ViewBuyButtonsParams {
  [key: string]: unknown
  source_page: string
  button_location: ButtonLocation
}

export interface ClickBuyButtonParams {
  [key: string]: unknown
  book_format: BookFormat
  source_page: string
  button_location: ButtonLocation
}

export interface ViewFreeChapterFormParams {
  [key: string]: unknown
  form_location: string
}

export interface SubmitFreeChapterFormParams {
  [key: string]: unknown
  form_location: string
}

export interface ClickOutboundLinkParams {
  [key: string]: unknown
  link_url: string
  link_domain: string
  link_text: string
  source_page: string
}

export interface ScrollDepthParams {
  [key: string]: unknown
  percent_scrolled: ScrollDepthThreshold
  page_path: string
  content_type: string
}

export interface BlogReadCompleteParams {
  [key: string]: unknown
  page_path: string
  estimated_read_time: number
  time_on_page: number
}

export interface ViewBlogCtaParams {
  [key: string]: unknown
  cta_type: string
  cta_position: CtaPosition
  cta_variant: PromoVariant
  page_path: string
}

export interface ClickBlogCtaParams {
  [key: string]: unknown
  cta_type: string
  cta_position: CtaPosition
  cta_variant: PromoVariant
  page_path: string
}

export interface InternalNavigationParams {
  [key: string]: unknown
  from_page: string
  to_page: string
  navigation_type: NavigationType
}

export interface ViewChapterDetailsParams {
  [key: string]: unknown
  chapter_number: number
  chapter_title: string
}

// ============================================================================
// Event Names (constants to prevent typos)
// ============================================================================

export const ANALYTICS_EVENTS = {
  // Conversion events
  VIEW_BUY_BUTTONS: 'view_buy_buttons',
  CLICK_BUY_BUTTON: 'click_buy_button',
  VIEW_FREE_CHAPTER_FORM: 'view_free_chapter_form',
  SUBMIT_FREE_CHAPTER_FORM: 'submit_free_chapter_form',
  // Engagement events
  CLICK_OUTBOUND_LINK: 'click_outbound_link',
  SCROLL_DEPTH: 'scroll_depth',
  BLOG_READ_COMPLETE: 'blog_read_complete',
  // CTA events
  VIEW_BLOG_CTA: 'view_blog_cta',
  CLICK_BLOG_CTA: 'click_blog_cta',
  // Navigation events
  INTERNAL_NAVIGATION: 'internal_navigation',
  VIEW_CHAPTER_DETAILS: 'view_chapter_details',
} as const

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

// ============================================================================
// Debug Mode
// ============================================================================

/**
 * Check if analytics debug mode is enabled.
 * Enable via URL param: ?debug_analytics=true
 * Or in development mode (localhost)
 */
export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false

  const urlParams = new URLSearchParams(window.location.search)
  const debugParam = urlParams.get('debug_analytics') === 'true'
  const isDev =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  return debugParam || isDev
}

/**
 * Log analytics event to console in debug mode
 */
function debugLog<T extends Record<string, unknown>>(
  eventName: string,
  params: T,
): void {
  if (!isDebugMode()) return

  console.group(`📊 Analytics Event: ${eventName}`)
  console.log('Parameters:', params)
  console.log('Timestamp:', new Date().toISOString())
  console.groupEnd()
}

// ============================================================================
// Core Tracking Function
// ============================================================================

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Get the gtag function from the window object
 */
function getGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === 'undefined') return null
  return window.gtag ?? null
}

/**
 * Generic event tracking function
 * Uses the global gtag() function directly for event tracking.
 */
export function trackEvent<T extends Record<string, unknown>>(
  eventName: string,
  params: T,
): void {
  debugLog(eventName, params)

  const gtag = getGtag()
  if (gtag) {
    gtag('event', eventName, params)
  } else {
    // If gtag not ready, queue the event with retry
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const checkInterval = setInterval(() => {
      const g = getGtag()
      if (g) {
        g('event', eventName, params)
        clearInterval(checkInterval)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }, 100)

    // Give up after 5 seconds
    timeoutId = setTimeout(() => clearInterval(checkInterval), 5000)
  }
}

// ============================================================================
// Typed Event Tracking Functions
// ============================================================================

/** Track when buy buttons become visible */
export function trackViewBuyButtons(params: ViewBuyButtonsParams): void {
  trackEvent(ANALYTICS_EVENTS.VIEW_BUY_BUTTONS, params)
}

/** Track buy button clicks */
export function trackClickBuyButton(params: ClickBuyButtonParams): void {
  trackEvent(ANALYTICS_EVENTS.CLICK_BUY_BUTTON, params)
}

/** Track when free chapter form becomes visible */
export function trackViewFreeChapterForm(
  params: ViewFreeChapterFormParams,
): void {
  trackEvent(ANALYTICS_EVENTS.VIEW_FREE_CHAPTER_FORM, params)
}

/** Track free chapter form submissions */
export function trackSubmitFreeChapterForm(
  params: SubmitFreeChapterFormParams,
): void {
  trackEvent(ANALYTICS_EVENTS.SUBMIT_FREE_CHAPTER_FORM, params)
}

/** Track outbound link clicks */
export function trackClickOutboundLink(params: ClickOutboundLinkParams): void {
  trackEvent(ANALYTICS_EVENTS.CLICK_OUTBOUND_LINK, params)
}

/** Track scroll depth milestones */
export function trackScrollDepth(params: ScrollDepthParams): void {
  trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, params)
}

/** Track blog article read completion */
export function trackBlogReadComplete(params: BlogReadCompleteParams): void {
  trackEvent(ANALYTICS_EVENTS.BLOG_READ_COMPLETE, params)
}

/** Track when blog CTA becomes visible */
export function trackViewBlogCta(params: ViewBlogCtaParams): void {
  trackEvent(ANALYTICS_EVENTS.VIEW_BLOG_CTA, params)
}

/** Track blog CTA clicks */
export function trackClickBlogCta(params: ClickBlogCtaParams): void {
  trackEvent(ANALYTICS_EVENTS.CLICK_BLOG_CTA, params)
}

/** Track internal navigation */
export function trackInternalNavigation(
  params: InternalNavigationParams,
): void {
  trackEvent(ANALYTICS_EVENTS.INTERNAL_NAVIGATION, params)
}

/** Track chapter details view */
export function trackViewChapterDetails(
  params: ViewChapterDetailsParams,
): void {
  trackEvent(ANALYTICS_EVENTS.VIEW_CHAPTER_DETAILS, params)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract domain from a URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

/**
 * Check if a URL is external (not same domain)
 */
export function isExternalUrl(url: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.hostname !== window.location.hostname
  } catch {
    return false
  }
}

/**
 * Get current page path
 */
export function getPagePath(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname
}

/**
 * Create an Intersection Observer that fires a callback once when element is visible
 * @param element - DOM element to observe
 * @param callback - Function to call when element becomes visible
 * @param threshold - Visibility threshold (0-1), default 0.5 (50% visible)
 */
export function observeOnce(
  element: Element,
  callback: () => void,
  threshold = 0.5,
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback()
          observer.disconnect()
        }
      })
    },
    { threshold },
  )

  observer.observe(element)
  return observer
}

/**
 * Extract promo variant ID from image path
 * e.g., "/src/images/promo/promo05.png" -> "promo05"
 */
export function extractPromoVariant(imagePath: string): PromoVariant {
  const match = imagePath.match(/promo(\d+)/)
  if (match) {
    return `promo${match[1].padStart(2, '0')}` as PromoVariant
  }
  if (isDebugMode()) {
    console.warn(
      `[Analytics] Could not extract promo variant from: ${imagePath}`,
    )
  }
  return 'promo01' // fallback
}

// ============================================================================
// Type Validation Helpers (with debug warnings)
// ============================================================================

const VALID_BOOK_FORMATS: BookFormat[] = ['print', 'ebook']
const VALID_BUTTON_LOCATIONS: ButtonLocation[] = [
  'hero',
  'problem_statement',
  'action_plan',
  'quotes',
  'reviews',
  'sidebar',
  'footer',
  'blog_promo',
  'free_chapter_section',
]
const VALID_PROMO_VARIANTS: PromoVariant[] = [
  'promo01',
  'promo02',
  'promo03',
  'promo04',
  'promo05',
  'promo06',
  'promo07',
  'promo08',
  'promo09',
  'promo10',
]
const VALID_CTA_POSITIONS: CtaPosition[] = ['sidebar', 'inline', 'footer']

/**
 * Validate book format value with debug warning for invalid values
 */
export function validateBookFormat(value: string): BookFormat {
  if (VALID_BOOK_FORMATS.includes(value as BookFormat)) {
    return value as BookFormat
  }
  if (isDebugMode()) {
    console.warn(
      `[Analytics] Invalid book_format: "${value}". Expected one of: ${VALID_BOOK_FORMATS.join(', ')}`,
    )
  }
  return 'print' // fallback
}

/**
 * Validate button location value with debug warning for invalid values
 */
export function validateButtonLocation(value: string): ButtonLocation {
  if (VALID_BUTTON_LOCATIONS.includes(value as ButtonLocation)) {
    return value as ButtonLocation
  }
  if (isDebugMode()) {
    console.warn(
      `[Analytics] Invalid button_location: "${value}". Expected one of: ${VALID_BUTTON_LOCATIONS.join(', ')}`,
    )
  }
  return 'hero' // fallback
}

/**
 * Validate promo variant value with debug warning for invalid values
 */
export function validatePromoVariant(value: string): PromoVariant {
  if (VALID_PROMO_VARIANTS.includes(value as PromoVariant)) {
    return value as PromoVariant
  }
  if (isDebugMode()) {
    console.warn(
      `[Analytics] Invalid promo_variant: "${value}". Expected one of: ${VALID_PROMO_VARIANTS.join(', ')}`,
    )
  }
  return 'promo01' // fallback
}

/**
 * Validate CTA position value with debug warning for invalid values
 */
export function validateCtaPosition(value: string): CtaPosition {
  if (VALID_CTA_POSITIONS.includes(value as CtaPosition)) {
    return value as CtaPosition
  }
  if (isDebugMode()) {
    console.warn(
      `[Analytics] Invalid cta_position: "${value}". Expected one of: ${VALID_CTA_POSITIONS.join(', ')}`,
    )
  }
  return 'sidebar' // fallback
}
