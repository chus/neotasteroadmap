import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { featureRequests } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

const now = Date.now()
const DAY = 86_400_000

const requests = [
  {
    title: 'Multi-language menu support',
    customer_problem: 'Restaurants with international clientele can only display menus in one language, forcing staff to translate verbally.',
    current_behaviour: 'Menu items are stored in a single language. No translation layer exists.',
    desired_outcome: 'Restaurant owners can add translations per menu item; diners see the menu in their preferred language automatically.',
    success_metric: 'Restaurants with translations enabled see ≥15% increase in order completion rate.',
    customer_evidence: 'Requested by 12 partner restaurants in Berlin and 8 in Amsterdam during Q4 partner calls.',
    submitter_name: 'Lena Weber',
    submitter_role: 'Partner Success Lead',
    status: 'open',
    vote_count: 34,
    created_at: new Date(now - 58 * DAY),
  },
  {
    title: 'Dietary preference filters',
    customer_problem: 'Users with allergies or dietary restrictions (vegan, gluten-free) waste time scrolling through irrelevant dishes.',
    current_behaviour: 'Basic keyword search exists but no structured dietary tags or persistent filter preferences.',
    desired_outcome: 'Users set dietary preferences in their profile; feed and restaurant pages automatically filter or tag dishes.',
    success_metric: 'Users with active dietary filters show ≥20% higher 30-day retention.',
    customer_evidence: 'Top-voted item in last two user surveys (n=2,400). 18% of support tickets mention allergies.',
    submitter_name: 'Marco Rossi',
    submitter_role: 'Product Manager',
    status: 'under_review',
    vote_count: 51,
    created_at: new Date(now - 45 * DAY),
  },
  {
    title: 'Restaurant analytics dashboard',
    customer_problem: 'Restaurant partners have no visibility into how their NeoTaste page performs — views, saves, conversions.',
    current_behaviour: 'Partners receive a monthly PDF report by email with basic metrics.',
    desired_outcome: 'A self-serve dashboard where partners can see real-time views, saves, redemptions, and revenue attribution.',
    success_metric: 'Partner NPS increases by ≥10 points within 3 months of dashboard launch.',
    customer_evidence: 'Cited as #1 churn reason in exit interviews (7 of 15 churned partners in Q1).',
    submitter_name: 'Sofia Müller',
    submitter_role: 'Partner Success Lead',
    status: 'planned',
    admin_note: 'Aligned with Discovery strategic level. Scope being defined.',
    vote_count: 42,
    created_at: new Date(now - 40 * DAY),
  },
  {
    title: 'Group dining coordination',
    customer_problem: 'Planning group dinners is fragmented — users share links in WhatsApp, lose track of preferences, double-book tables.',
    current_behaviour: 'No group features. Users share restaurant links manually via external messaging apps.',
    desired_outcome: 'In-app group creation where members vote on restaurants, see merged availability, and book as a group.',
    success_metric: 'Groups that use the feature book ≥2 dinners/month on average.',
    customer_evidence: 'Organic behaviour observed: 30% of shared links come from group chats (UTM data).',
    submitter_name: 'Tom van Dijk',
    submitter_role: 'Growth Lead',
    status: 'open',
    vote_count: 27,
    created_at: new Date(now - 32 * DAY),
  },
  {
    title: 'Push notification preferences',
    customer_problem: 'Users receive all-or-nothing notifications. Power users feel spammed; casual users miss relevant alerts.',
    current_behaviour: 'Single toggle: notifications on or off. No granularity by type (deals, new restaurants, social).',
    desired_outcome: 'Users can enable/disable notification categories independently and set quiet hours.',
    success_metric: 'Opt-out rate decreases by ≥30%; push-driven session starts increase by ≥15%.',
    customer_evidence: '22% of 1-star App Store reviews mention notification overload.',
    submitter_name: 'Anna Schmidt',
    submitter_role: 'Mobile Engineer',
    status: 'open',
    vote_count: 19,
    created_at: new Date(now - 25 * DAY),
  },
  {
    title: 'Saved collections / lists',
    customer_problem: 'Users bookmark restaurants into a flat, unsorted list that becomes unusable after ~20 saves.',
    current_behaviour: 'Single "Saved" list with no folders, tags, or sorting.',
    desired_outcome: 'Users can create named collections (e.g. "Date nights", "Work lunches") and drag restaurants between them.',
    success_metric: 'Users with ≥2 collections have 2× higher 60-day retention than single-list users.',
    customer_evidence: 'Feature requested in 340+ App Store reviews. Internal dogfooding confirms the pain point.',
    submitter_name: 'Elena Petrova',
    submitter_role: 'Design Lead',
    status: 'under_review',
    vote_count: 63,
    created_at: new Date(now - 18 * DAY),
  },
  {
    title: 'Table availability widget for partners',
    customer_problem: 'Partners manually update availability on NeoTaste and their own system, leading to double bookings.',
    current_behaviour: 'Partners set generic "available" time slots in the NeoTaste dashboard. No POS/reservation system sync.',
    desired_outcome: 'An embeddable widget or API integration with common reservation systems (OpenTable, Resy, TheFork).',
    success_metric: 'Double-booking complaints drop to <1% of reservations.',
    customer_evidence: '5 enterprise partners have made this a contract renewal condition.',
    submitter_name: 'Jan de Vries',
    submitter_role: 'Partnerships Director',
    status: 'open',
    vote_count: 38,
    created_at: new Date(now - 12 * DAY),
  },
  {
    title: 'Dark mode',
    customer_problem: 'Users browsing restaurants at night find the bright UI uncomfortable.',
    current_behaviour: 'App only supports light theme. No system-preference detection.',
    desired_outcome: 'Full dark theme that respects system preference and can be toggled manually.',
    success_metric: 'Evening session duration (8PM–12AM) increases by ≥10%.',
    customer_evidence: 'Mentioned in 180+ App Store reviews. Competitor apps all support dark mode.',
    submitter_name: 'Kai Lehmann',
    submitter_role: 'Frontend Engineer',
    status: 'declined',
    admin_note: 'Deprioritized for 2026. Will revisit after design system refresh.',
    vote_count: 45,
    created_at: new Date(now - 5 * DAY),
  },
]

async function main() {
  console.log('Seeding 8 feature requests…')
  for (const req of requests) {
    await db.insert(featureRequests).values(req)
    console.log(`  ✓ ${req.title}`)
  }
  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
