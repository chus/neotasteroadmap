import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { feedbackSubmissions, feedbackClusters, researchParticipants, problemBacklog } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

/* ── Helpers ── */

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60))
  return d
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function triage(sentiment: string, urgency: string, themes: string[], quality: number, summary: string) {
  return JSON.stringify({ sentiment, urgency, themes, quality_score: quality, summary, suggested_action: 'Review and cluster' })
}

/* ── Cluster 1: Dietary filtering in discovery (12 submissions) ── */

const dietarySubmissions = [
  {
    name: 'Lena Richter', email: 'lena.r@gmail.com', user_type: 'consumer',
    category: 'experience', title: "Couldn't find vegan options near Mitte",
    body: "I'm vegan and tried searching for restaurants near Mitte on a Tuesday evening. The app showed me 30+ places but I had to tap into each one to check if they had vegan options. I gave up after checking 8 restaurants and just opened Google Maps instead. There's no way to filter by dietary needs and it makes the whole discovery experience frustrating.",
    restaurant_name: null, order_context: 'dine_in', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('negative', 'high', ['dietary', 'discovery', 'filtering'], 5, 'High-quality submission describing specific friction with dietary filtering in discovery flow'),
    created_at: daysAgo(21),
  },
  {
    name: 'Markus Weber', email: 'markus.weber@outlook.de', user_type: 'consumer',
    category: 'feature', title: 'Need a way to filter gluten-free restaurants',
    body: "My daughter has celiac disease and we rely on NeoTaste for finding new restaurants. But every time we want to try somewhere new, we have to manually check each restaurant's menu or call ahead. A simple gluten-free filter would save us so much time and make us much more confident using the vouchers.",
    restaurant_name: null, order_context: 'dine_in', device: 'android',
    research_opt_in: true,
    ai_triage: triage('negative', 'high', ['dietary', 'gluten-free', 'family'], 5, 'Describes specific use case with medical dietary requirement'),
    created_at: daysAgo(19),
  },
  {
    name: 'Sophie Braun', email: 'sophie.braun@web.de', user_type: 'consumer',
    category: 'experience', title: 'Vegetarian options are hard to find in Hamburg',
    body: "I've been a NeoTaste member for 4 months and I love the concept, but as a vegetarian in Hamburg I find it really hard to discover restaurants that work for me. I scroll through the list and there's no indication of whether a place has vegetarian mains until I click through to the full menu. I'd love some kind of tag or filter.",
    restaurant_name: null, order_context: 'dine_in', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('neutral', 'medium', ['dietary', 'vegetarian', 'hamburg'], 4, 'Long-term user requesting dietary filtering, city-specific feedback'),
    created_at: daysAgo(17),
  },
  {
    name: 'Jonas Keller', email: 'j.keller@posteo.de', user_type: 'consumer',
    category: 'experience', title: 'No way to see if restaurants are halal',
    body: "I eat halal and it would be incredibly helpful to know which partner restaurants offer halal options. Right now I have to check each restaurant individually on Google before I can use my NeoTaste voucher. It adds 10-15 minutes every time I want to plan a dinner.",
    restaurant_name: null, order_context: 'dine_in', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['dietary', 'halal', 'time-waste'], 4, 'Describes time overhead of missing dietary information'),
    created_at: daysAgo(15),
  },
  {
    name: 'Clara Fischer', email: 'clara.f@icloud.com', user_type: 'consumer',
    category: 'feature', title: 'Allergen tags on restaurant cards would be great',
    body: "I have a nut allergy and my partner is lactose intolerant. When we browse NeoTaste together, we basically have to check every restaurant twice — once for each of our restrictions. If the cards showed basic allergen info or dietary tags, we could find places that work for both of us in seconds instead of minutes.",
    restaurant_name: null, order_context: 'dine_in', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('neutral', 'medium', ['dietary', 'allergens', 'discovery'], 5, 'Well-articulated need for allergen information on restaurant cards'),
    created_at: daysAgo(13),
  },
  {
    name: 'Tim Schneider', email: 'timschn@gmail.com', user_type: 'consumer',
    category: 'experience', title: 'Went to a restaurant that had no vegan mains',
    body: "Used a voucher at Trattoria Bella in Munich and discovered when we got there that they had zero vegan main courses. The appetizer section had one salad. Felt like a wasted voucher because I relied on NeoTaste to help me find good restaurants but there was no dietary info anywhere in the app.",
    restaurant_name: 'Trattoria Bella', order_context: 'voucher', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('negative', 'high', ['dietary', 'vegan', 'wasted-voucher', 'munich'], 4, 'Bad experience caused by missing dietary information, wasted voucher'),
    created_at: daysAgo(11),
  },
  {
    name: 'Anna Hoffmann', email: 'anna.h@yahoo.de', user_type: 'consumer',
    category: 'feature', title: 'Dietary preference in my profile',
    body: "I wish I could set my dietary preferences (vegetarian) in my profile so that the app automatically highlights restaurants that are a good fit. Right now I discover restaurants, get excited about the photos, and then realize they mostly serve meat. It is a bit deflating.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: true,
    ai_triage: triage('neutral', 'medium', ['dietary', 'profile', 'personalization'], 4, 'Suggests profile-based dietary preference for personalized discovery'),
    created_at: daysAgo(9),
  },
  {
    name: 'Paul Krause', email: 'p.krause@t-online.de', user_type: 'consumer',
    category: 'experience', title: 'Browsing for pescatarian options takes forever',
    body: "As a pescatarian in Cologne, I spend ages scrolling through the app trying to find seafood-friendly restaurants. Most places in NeoTaste are heavily meat-focused and I can't filter them out. I end up going back to the same 3 restaurants instead of exploring new ones.",
    restaurant_name: null, order_context: 'dine_in', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['dietary', 'pescatarian', 'cologne', 'repeat-visits'], 3, 'Dietary filtering friction leading to limited exploration'),
    created_at: daysAgo(7),
  },
  {
    name: 'Mia Lange', email: 'mia.lange@gmx.de', user_type: 'consumer',
    category: 'experience', title: "My friend couldn't use NeoTaste because of her diet",
    body: "I recommended NeoTaste to my friend who has multiple food allergies. She downloaded the app, browsed for 10 minutes, and deleted it because she couldn't tell which restaurants were safe for her. That was a lost user because of missing allergen info. I think adding dietary filters would help you keep more users.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['dietary', 'churn', 'referral', 'allergens'], 4, 'Reports churn of referred user due to missing dietary information'),
    created_at: daysAgo(5),
  },
  {
    name: 'Felix Meyer', email: 'felix.m@protonmail.com', user_type: 'consumer',
    category: 'feature', title: 'Filter by cuisine type and dietary needs',
    body: "The app has great restaurants but finding the right one for my needs is like finding a needle in a haystack. I'm vegetarian and I love Asian food. Let me filter by both cuisine type and dietary needs and I'll use NeoTaste twice as often. Right now I browse, get frustrated, and close the app.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('neutral', 'medium', ['dietary', 'cuisine-filter', 'vegetarian', 'engagement'], 3, 'Combination filter request for dietary needs and cuisine type'),
    created_at: daysAgo(4),
  },
  {
    name: 'Elif Yilmaz', email: 'elif.y@gmail.com', user_type: 'consumer',
    category: 'experience', title: 'Hard to find restaurants for group dinners with mixed diets',
    body: "I organize monthly dinners for 6 friends — 2 vegetarian, 1 vegan, 1 halal. Using NeoTaste to find a restaurant that works for everyone is basically impossible without checking each one individually. I usually give up and use a different app. If you had dietary tags I would always start with NeoTaste.",
    restaurant_name: null, order_context: 'dine_in', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'high', ['dietary', 'group-dining', 'mixed-diets'], 5, 'Describes specific group dining use case with multiple dietary requirements'),
    created_at: daysAgo(2),
  },
  {
    name: 'Niklas Bauer', email: 'n.bauer@outlook.de', user_type: 'consumer',
    category: 'experience', title: 'Vegan filter missing from discovery',
    body: "I just want to see vegan-friendly restaurants. I can see cuisine tags and location but nothing about dietary options. This seems like a basic filter that should exist. I end up using Happy Cow to find vegan places and then checking if they are on NeoTaste. It should be the other way around.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['dietary', 'vegan', 'competitor', 'discovery'], 3, 'User switching to competitor app due to missing dietary filter'),
    created_at: daysAgo(1),
  },
]

/* ── Cluster 2: Map navigation on mobile (7 submissions) ── */

const mapSubmissions = [
  {
    name: 'David Müller', email: 'david.m@gmail.com', user_type: 'consumer',
    category: 'bug', title: 'Map pins overlap and are impossible to tap',
    body: "In Berlin Kreuzberg there are like 15 restaurants in a small area and the map pins all overlap each other. I literally cannot tap the one I want because another pin is on top of it. Zooming in helps a little but then I lose the context of the neighborhood. The map needs clustering or something.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('negative', 'high', ['map', 'pins', 'overlap', 'usability'], 5, 'Specific usability issue with map pin density in high-restaurant areas'),
    created_at: daysAgo(18),
  },
  {
    name: 'Lisa Hartmann', email: 'lisa.h@outlook.de', user_type: 'consumer',
    category: 'experience', title: 'Map is really slow on my phone',
    body: "The map view takes about 4-5 seconds to load all the pins on my Samsung Galaxy A53. When I scroll around, it stutters and jumps. The list view works fine but I prefer using the map because I want to find places near where I currently am. The performance makes it frustrating to use.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['map', 'performance', 'android', 'loading'], 4, 'Map performance issue on mid-range Android device'),
    created_at: daysAgo(14),
  },
  {
    name: 'Jan Schmidt', email: 'jan.schmidt@web.de', user_type: 'consumer',
    category: 'experience', title: "Can't see restaurant names on the map",
    body: "When I open the map, I see a bunch of green dots but no restaurant names. I have to tap each dot individually to find out what restaurant it is. It would be much faster if the map showed at least the first few characters of each restaurant name next to the pin.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('neutral', 'medium', ['map', 'labels', 'discovery'], 4, 'Map UX improvement request for restaurant name labels on pins'),
    created_at: daysAgo(12),
  },
  {
    name: 'Sarah Wolf', email: 'sarah.wolf@gmx.de', user_type: 'consumer',
    category: 'bug', title: 'Map location jumps back after scrolling',
    body: "I scroll the map to a different part of Munich and after 2 seconds it jumps back to my current location. This happens every time. I can't browse restaurants in a different area because the map keeps resetting. Very annoying — I ended up just using the list.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'high', ['map', 'bug', 'location-reset', 'munich'], 4, 'Reproducible map bug where view resets to user location after scrolling'),
    created_at: daysAgo(10),
  },
  {
    name: 'Tom Berger', email: 'tom.b@posteo.de', user_type: 'consumer',
    category: 'experience', title: 'No route or distance shown to restaurants on map',
    body: "I can see restaurants on the map but I have no idea how far they are or how to get there. Showing walking distance or a rough travel time estimate would help me decide if a restaurant is worth the trip, especially when I'm spontaneously looking for somewhere nearby.",
    restaurant_name: null, order_context: 'dine_in', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('neutral', 'low', ['map', 'distance', 'navigation'], 3, 'Feature suggestion for distance/travel time on map'),
    created_at: daysAgo(6),
  },
  {
    name: 'Emma Koch', email: 'emma.k@icloud.com', user_type: 'consumer',
    category: 'experience', title: "Map doesn't show which vouchers I've already used",
    body: "I open the map and all pins look the same. I can't tell which restaurants I've already visited or redeemed a voucher at. I end up tapping into restaurants I've already been to. It would help if visited restaurants had a different pin color or a small checkmark.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('neutral', 'low', ['map', 'visited-state', 'vouchers'], 3, 'Suggests visual differentiation for visited restaurants on map'),
    created_at: daysAgo(3),
  },
  {
    name: 'Moritz Schulz', email: 'moritz.s@gmail.com', user_type: 'consumer',
    category: 'bug', title: 'Map pins disappear when zooming in on Hamburg',
    body: "Noticed a weird bug in Hamburg — when I zoom into Sternschanze area, some restaurant pins just vanish. They come back if I zoom out. Tried closing and reopening the app. Same behavior. Makes me think there are restaurants I'm missing.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['map', 'bug', 'pins-disappear', 'hamburg'], 4, 'Reproducible map rendering bug with pin visibility at certain zoom levels'),
    created_at: daysAgo(1),
  },
]

/* ── Cluster 3: Saving favourite restaurants (6 submissions) ── */

const favouritesSubmissions = [
  {
    name: 'Laura Klein', email: 'laura.klein@gmail.com', user_type: 'consumer',
    category: 'feature', title: 'Let me save restaurants for later',
    body: "I browse NeoTaste during my lunch break and find restaurants I want to try on the weekend, but there's no way to save or bookmark them. I end up taking screenshots which is pretty hacky. A simple favorites or save-for-later feature would make the app way more useful for planning.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('neutral', 'medium', ['favourites', 'save', 'planning'], 4, 'Common feature request for restaurant bookmarking'),
    created_at: daysAgo(20),
  },
  {
    name: 'Kevin Roth', email: 'kevin.r@t-online.de', user_type: 'consumer',
    category: 'feature', title: 'Wishlist feature for restaurants',
    body: "Would love a wishlist or favorites list. My partner and I find restaurants separately and then compare what we found, but neither of us can save anything in the app. We end up texting each other restaurant names. A shared list would be perfect but even a personal one would help.",
    restaurant_name: null, order_context: 'dine_in', device: 'android',
    research_opt_in: true,
    ai_triage: triage('neutral', 'medium', ['favourites', 'wishlist', 'sharing', 'couple'], 4, 'Favourites request with social/sharing angle'),
    created_at: daysAgo(16),
  },
  {
    name: 'Maria Jung', email: 'maria.j@web.de', user_type: 'consumer',
    category: 'experience', title: 'Lost track of a great restaurant I found',
    body: "Last week I found an amazing-looking Japanese restaurant on NeoTaste but didn't have time to book. This week I couldn't find it again — I scrolled through dozens of restaurants and couldn't remember the name. If I could have hearted it or saved it, I would have gone there tonight.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['favourites', 're-find', 'lost-restaurant'], 4, 'Lost restaurant due to no save/bookmark feature — potential lost conversion'),
    created_at: daysAgo(12),
  },
  {
    name: 'Dennis Vogel', email: 'dennis.v@gmx.de', user_type: 'consumer',
    category: 'feature', title: 'Bookmark button on restaurant cards',
    body: "Please add a bookmark or heart button to restaurant cards so I can save restaurants I want to visit. Every food app I use has this. Google Maps has it, Yelp has it, even Uber Eats has it. It feels like a missing basic feature.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: false,
    ai_triage: triage('neutral', 'medium', ['favourites', 'bookmark', 'competitor-comparison'], 3, 'Compares NeoTaste unfavorably to competitors on basic bookmarking'),
    created_at: daysAgo(8),
  },
  {
    name: 'Hanna Krüger', email: 'hanna.k@outlook.de', user_type: 'consumer',
    category: 'feature', title: 'Save and organize restaurants in collections',
    body: "I'd love to be able to save restaurants into collections — like 'Date night', 'With parents', 'Quick lunch'. I use NeoTaste in different contexts and having organized lists would help me find the right restaurant faster when I need one.",
    restaurant_name: null, order_context: 'dine_in', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('positive', 'low', ['favourites', 'collections', 'organization'], 3, 'Advanced favourites request with categorization'),
    created_at: daysAgo(5),
  },
  {
    name: 'Stefan Frank', email: 'stefan.f@protonmail.com', user_type: 'consumer',
    category: 'experience', title: "Keep re-discovering the same restaurants I already visited",
    body: "I've been a member for 6 months and visited about 15 restaurants through NeoTaste. But the app keeps showing me these same restaurants as if I haven't been there. I can't mark them as visited or add them to a 'been there' list. Makes browsing less useful over time.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: true,
    ai_triage: triage('negative', 'medium', ['favourites', 'visited', 'repeat-discovery', 'long-term'], 4, 'Long-term user frustrated by re-seeing visited restaurants'),
    created_at: daysAgo(3),
  },
]

/* ── Cluster 4: Redemption anxiety at the restaurant (4 submissions) ── */

const redemptionSubmissions = [
  {
    name: 'Chris Wagner', email: 'chris.w@gmail.com', user_type: 'consumer',
    category: 'experience', title: 'Felt embarrassed showing the voucher at the restaurant',
    body: "I went to a nice Italian place in Munich with my girlfriend. When the bill came, I had to show my phone screen to the waiter and he looked confused. He had to call the manager who also seemed unsure. It took 5 minutes to sort out. My girlfriend was embarrassed and said we should just pay normally next time. The redemption process needs to be smoother and more discreet.",
    restaurant_name: 'Osteria del Corso', order_context: 'voucher', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('negative', 'high', ['redemption', 'embarrassment', 'social-friction', 'munich'], 5, 'Detailed social friction during voucher redemption, potential churn risk'),
    created_at: daysAgo(16),
  },
  {
    name: 'Nina Becker', email: 'nina.b@yahoo.de', user_type: 'consumer',
    category: 'experience', title: 'Accidentally triggered the voucher before arriving',
    body: "I was looking at the voucher details while on the U-Bahn heading to the restaurant and I somehow activated it. By the time I arrived 20 minutes later, the voucher was already in its countdown. The waiter said it was fine but I panicked the whole time. There should be a confirmation step or the ability to pause/restart.",
    restaurant_name: 'Kuchi', order_context: 'voucher', device: 'android',
    research_opt_in: true,
    ai_triage: triage('negative', 'high', ['redemption', 'accidental-trigger', 'anxiety', 'berlin'], 5, 'Accidental voucher activation causing anxiety, common UX issue'),
    created_at: daysAgo(11),
  },
  {
    name: 'Alexander Huber', email: 'alex.h@web.de', user_type: 'consumer',
    category: 'experience', title: 'Not sure when to show the voucher — before or after ordering?',
    body: "Every time I use a voucher I'm unsure of the timing. Do I show it when I sit down? When I order? When the bill comes? Different restaurants seem to expect different things and there's no guidance in the app. It creates a small but real moment of anxiety at every visit.",
    restaurant_name: null, order_context: 'voucher', device: 'ios',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['redemption', 'uncertainty', 'timing', 'guidance'], 4, 'Recurring uncertainty about voucher presentation timing'),
    created_at: daysAgo(8),
  },
  {
    name: 'Julia Schwarz', email: 'julia.s@gmx.de', user_type: 'consumer',
    category: 'experience', title: 'Waiter did not know about NeoTaste voucher',
    body: "Went to a partner restaurant in Cologne and the waiter had no idea what NeoTaste was. I had to explain the concept while other diners waited. Eventually the manager came and honored it but it was uncomfortable. I think the restaurant staff need better onboarding or the app should have a page I can show them.",
    restaurant_name: 'Haus Scholzen', order_context: 'voucher', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'high', ['redemption', 'staff-awareness', 'onboarding', 'cologne'], 4, 'Restaurant staff unaware of NeoTaste partnership, social friction'),
    created_at: daysAgo(4),
  },
]

/* ── Cluster 5: Trial value not clear enough (3 submissions) ── */

const trialSubmissions = [
  {
    name: 'Max König', email: 'max.k@outlook.de', user_type: 'consumer',
    category: 'experience', title: "On my trial week and don't understand what I get",
    body: "I signed up for the free trial 3 days ago and I still don't understand exactly what the membership gets me. Are the vouchers unlimited? Are they all 2-for-1? Does it work at every restaurant? I keep browsing the app but there's no clear explanation of the value proposition. I'll probably cancel before the trial ends unless something clicks.",
    restaurant_name: null, order_context: 'general', device: 'ios',
    research_opt_in: true,
    ai_triage: triage('negative', 'high', ['trial', 'value-proposition', 'confusion', 'churn-risk'], 5, 'Trial user confused about value, likely to churn'),
    created_at: daysAgo(13),
  },
  {
    name: 'Katharina Neumann', email: 'k.neumann@gmail.com', user_type: 'consumer',
    category: 'experience', title: "Trial didn't show me what's worth paying for",
    body: "Finished my 7-day trial and I'm not sure it was worth subscribing. I visited 2 restaurants and saved maybe 15 euros total. The app didn't really guide me on how to get the most value. A 'try these 3 restaurants this week' prompt or something would have made the trial feel more structured and valuable.",
    restaurant_name: null, order_context: 'general', device: 'android',
    research_opt_in: false,
    ai_triage: triage('negative', 'medium', ['trial', 'onboarding', 'value', 'conversion'], 4, 'Post-trial user who did not convert, suggests guided trial experience'),
    created_at: daysAgo(9),
  },
  {
    name: 'Robert Weiß', email: 'robert.w@t-online.de', user_type: 'consumer',
    category: 'pricing', title: "What's the difference between trial and paid?",
    body: "I'm in my trial and I genuinely cannot figure out what changes when I start paying. Will the same restaurants be available? Will vouchers change? Is there a limit? The pricing page says '2-for-1 at top restaurants' but that's what I already have in the trial. What am I paying for that I don't already get for free?",
    restaurant_name: null, order_context: 'general', device: 'web',
    research_opt_in: false,
    ai_triage: triage('negative', 'high', ['trial', 'pricing', 'confusion', 'value-proposition'], 4, 'Trial user unable to distinguish trial from paid value'),
    created_at: daysAgo(3),
  },
]

/* ── Main seed function ── */

async function main() {
  console.log('Seeding Voice feedback data...')

  // Create clusters first
  const clusterData = [
    {
      label: 'Dietary filtering in discovery',
      description: 'Users cannot filter or discover restaurants by dietary needs (vegan, vegetarian, halal, gluten-free). This forces manual checking of each restaurant.',
      theme: 'Discovery',
      submission_count: 12,
      avg_sentiment: 'negative',
      top_urgency: 'high',
      status: 'active',
    },
    {
      label: 'Map navigation on mobile',
      description: 'Map pins overlap in dense areas, performance is poor on mid-range devices, and navigation features like distance/labels are missing.',
      theme: 'Discovery',
      submission_count: 7,
      avg_sentiment: 'negative',
      top_urgency: 'medium',
      status: 'active',
    },
    {
      label: 'Saving favourite restaurants',
      description: 'No bookmark/save/wishlist feature. Users take screenshots or lose track of restaurants they want to visit.',
      theme: 'Discovery',
      submission_count: 6,
      avg_sentiment: 'neutral',
      top_urgency: 'medium',
      status: 'active',
    },
    {
      label: 'Redemption anxiety at the restaurant',
      description: 'Social friction during voucher redemption — staff confusion, accidental triggers, unclear timing guidance.',
      theme: 'Churn',
      submission_count: 4,
      avg_sentiment: 'negative',
      top_urgency: 'high',
      status: 'active',
    },
    {
      label: 'Trial value not clear enough',
      description: 'Trial users struggle to understand the value proposition and what changes after the trial ends.',
      theme: 'Trial conversion',
      submission_count: 3,
      avg_sentiment: 'negative',
      top_urgency: 'high',
      status: 'active',
    },
  ]

  console.log('Creating 5 clusters...')
  const insertedClusters = await db.insert(feedbackClusters).values(clusterData).returning()
  const clusterIds = insertedClusters.map((c) => c.id)

  console.log('Cluster IDs:', clusterIds)

  // Create all submissions grouped by cluster
  const allSubmissions = [
    ...dietarySubmissions.map((s) => ({ ...s, cluster_id: clusterIds[0] })),
    ...mapSubmissions.map((s) => ({ ...s, cluster_id: clusterIds[1] })),
    ...favouritesSubmissions.map((s) => ({ ...s, cluster_id: clusterIds[2] })),
    ...redemptionSubmissions.map((s) => ({ ...s, cluster_id: clusterIds[3] })),
    ...trialSubmissions.map((s) => ({ ...s, cluster_id: clusterIds[4] })),
  ].map((s) => ({
    ...s,
    ai_triaged_at: s.created_at,
    status: 'reviewing' as const,
  }))

  console.log(`Inserting ${allSubmissions.length} submissions...`)
  await db.insert(feedbackSubmissions).values(allSubmissions)

  // Create research participants from opt-in submissions
  const optedIn = allSubmissions.filter((s) => s.research_opt_in)
  const uniqueEmails = new Map<string, typeof optedIn[0]>()
  for (const s of optedIn) {
    if (!uniqueEmails.has(s.email)) uniqueEmails.set(s.email, s)
  }

  const participants = Array.from(uniqueEmails.values()).map((s) => ({
    name: s.name,
    email: s.email,
    user_type: s.user_type,
    source: 'voice_form',
    tags: '[]',
    notes: '',
    contact_count: 0,
    opted_in_at: s.created_at,
    created_at: s.created_at,
  }))

  console.log(`Creating ${participants.length} research participants...`)
  for (const p of participants) {
    try {
      await db.insert(researchParticipants).values(p)
    } catch {
      // Skip duplicates (unique constraint on email)
      console.log(`  Skipping duplicate: ${p.email}`)
    }
  }

  // Create 2 problem backlog items
  const backlogItems = [
    {
      title: 'Dietary filtering in restaurant discovery',
      description: 'Users across all cities consistently report inability to filter or discover restaurants by dietary needs. 12 submissions from unique users describing vegan, vegetarian, halal, gluten-free, and pescatarian filtering needs. Multiple users report switching to competitor apps. One user reports churning a referred friend.',
      evidence: '12 submissions, 5 research candidates, 4 cities',
      strategic_area: 'Discovery',
      status: 'backlog' as const,
      source_cluster_id: clusterIds[0],
      submission_count: 12,
      research_candidate_count: 5,
      representative_quote: "I'm vegan and tried searching for restaurants near Mitte on a Tuesday evening. The app showed me 30+ places but I had to tap into each one to check if they had vegan options. I gave up after checking 8 restaurants and just opened Google Maps instead.",
      pm_notes: 'Strong signal across cities. Multiple dietary types affected. Competitor switching reported.',
      priority_signal: 'High priority — growing cluster with 12 submissions, 5 research candidates, negative sentiment, multiple cities affected',
    },
    {
      title: 'Redemption experience causes social anxiety and accidental triggers',
      description: 'Users report social friction during the voucher redemption moment — staff confusion, accidental activation in transit, unclear timing guidance. The core issue is that the redemption UX creates anxiety rather than delight at the moment that should be the highlight of the NeoTaste experience.',
      evidence: '4 submissions, 2 research candidates, 3 cities',
      strategic_area: 'Churn',
      status: 'watching' as const,
      watch_until: daysFromNow(25),
      source_cluster_id: clusterIds[3],
      submission_count: 4,
      research_candidate_count: 2,
      representative_quote: "I went to a nice Italian place with my girlfriend. When the bill came, I had to show my phone screen to the waiter and he looked confused. He had to call the manager who also seemed unsure. It took 5 minutes to sort out. My girlfriend was embarrassed and said we should just pay normally next time.",
      pm_notes: 'Watching for more signals. Only 4 submissions but high emotional impact. May connect to churn initiatives.',
      priority_signal: 'Medium priority — small cluster but high urgency and emotional intensity, directly related to churn risk',
    },
  ]

  console.log('Creating 2 problem backlog items...')
  const insertedBacklog = await db.insert(problemBacklog).values(backlogItems).returning()

  // Link clusters to backlog items
  const { eq } = await import('drizzle-orm')
  await db.update(feedbackClusters).set({ backlog_item_id: insertedBacklog[0].id }).where(eq(feedbackClusters.id, clusterIds[0]))
  await db.update(feedbackClusters).set({ backlog_item_id: insertedBacklog[1].id }).where(eq(feedbackClusters.id, clusterIds[3]))

  console.log('')
  console.log('Voice seed data complete!')
  console.log(`  ${allSubmissions.length} submissions across 5 clusters`)
  console.log(`  ${participants.length} research participants`)
  console.log(`  2 problem backlog items`)
  console.log(`  4 cities: Berlin, Munich, Hamburg, Cologne`)
}

main().catch(console.error)
