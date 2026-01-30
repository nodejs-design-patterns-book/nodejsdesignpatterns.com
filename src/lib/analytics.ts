/**
 * Analytics Utility Module for GA4 Event Tracking
 *
 * This module provides type-safe helper functions for sending GA4 events.
 * It handles Partytown's async nature and provides debug mode for development.
 *
 * @module analytics
 */

// Type for gtag function (loaded by Google Tag Manager via Partytown)
type GtagFunction = (
  command: string,
  eventNameOrConfig: string,
  params?: Record<string, unknown>,
) => void

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
  source_page: string
  button_location: ButtonLocation
}

export interface ClickBuyButtonParams {
  book_format: BookFormat
  source_page: string
  button_location: ButtonLocation
}

export interface ViewFreeChapterFormParams {
  form_location: string
}

export interface SubmitFreeChapterFormParams {
  form_location: string
}

export interface ClickOutboundLinkParams {
  link_url: string
  link_domain: string
  link_text: string
  source_page: string
}

export interface ScrollDepthParams {
  percent_scrolled: ScrollDepthThreshold
  page_path: string
  content_type: string
}

export interface BlogReadCompleteParams {
  page_path: string
  estimated_read_time: number
  time_on_page: number
}

export interface ViewBlogCtaParams {
  cta_type: string
  cta_position: CtaPosition
  cta_variant: PromoVariant
  page_path: string
}

export interface ClickBlogCtaParams {
  cta_type: string
  cta_position: CtaPosition
  cta_variant: PromoVariant
  page_path: string
}

export interface InternalNavigationParams {
  from_page: string
  to_page: string
  navigation_type: NavigationType
}

export interface ViewChapterDetailsParams {
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
function debugLog(eventName: string, params: Record<string, unknown>): void {
  if (!isDebugMode()) return

  console.group(`📊 Analytics Event: ${eventName}`)
  console.log('Parameters:', params)
  console.log('Timestamp:', new Date().toISOString())
  console.groupEnd()
}

// ============================================================================
// Core Tracking Function
// ============================================================================

/**
 * Safely get the gtag function, handling Partytown's async loading
 */
function getGtag(): GtagFunction | null {
  if (typeof window === 'undefined') return null
  // gtag is loaded via Partytown, may not be immediately available
  return (window as unknown as { gtag?: GtagFunction }).gtag ?? null
}

/**
 * Generic event tracking function
 * Handles cases where gtag might not be loaded yet (Partytown delay)
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown>,
): void {
  debugLog(eventName, params)

  const gtagFn = getGtag()
  if (gtagFn) {
    gtagFn('event', eventName, params)
  } else {
    // If gtag not ready, queue the event for when it becomes available
    // This is a fallback for slow Partytown initialization
    const checkInterval = setInterval(() => {
      const fn = getGtag()
      if (fn) {
        fn('event', eventName, params)
        clearInterval(checkInterval)
      }
    }, 100)

    // Give up after 5 seconds
    setTimeout(() => clearInterval(checkInterval), 5000)
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
  return 'promo01' // fallback
}
