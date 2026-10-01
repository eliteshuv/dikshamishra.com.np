# Diksha & Aashik — Shubh Vivah

The guest experience is contained in index.html, including all seven artworks, CSS and JavaScript. Deploy this one file with CNAME for the existing GitHub Pages domain.

## Share links

- One-screen announcement with friends invitation button: https://dikshamishra.com.np/
- Three days, 24–26 November: https://dikshamishra.com.np/?v=d1
- Wedding and evening party, 25 November: https://dikshamishra.com.np/?v=d2
- Friends, 24–25 November and Kathmandu reception TBA: https://dikshamishra.com.np/?v=d3

Aliases ?v=full, ?v=day, ?v=friends and #full, #day, #friends also work. Root and invalid links show the announcement with a friends invitation button. The three detailed schedules are absent from one another’s navigation. These are guest-specific presentations, not password protection.

## Features

- Seal opens automatically after three seconds, or immediately on tap.
- Six cinematic chapters, scroll snapping, next/back, chapter dots and keyboard navigation.
- Continuous automatic playback. Press and hold to linger; release resumes. Tall chapters begin scrolling their overflow after 2.6 seconds before advancing. Compact chapters fit the viewport where their content permits. Hover never pauses.
- Complete Nepali/English views with device-local language preference.
- Three unchanged wide originals for landscape screens; new full-screen portrait backgrounds for portrait screens, selected through picture sources and orientation media rules.
- Animated light particles, bell petal burst, mandala, flame, image movement and staggered typography.
- Interactive Ganesha blessing, flower shower, seven selectable wishes, expandable ceremony details, lightable diya, address copy and WhatsApp RSVP.
- Optional synthesized ambient chimes and interactive bell, after user interaction.
- Version-aware all-day calendar, share/copy, venue map, phone and WhatsApp.
- Reduced motion, focus outlines, safe-area controls and no-JavaScript fallback.

Wedding: 25 November 2026 / Mangsir 9, 2083. Phone: +977 974-5315294. Venue: Mithila Abadh Sanskritik Sanrakchan Parishad, Bajrang Chowk–8, opposite Janaki Health Care Hospital, Janakpur. Blessings: Dipendra Mishra and Nilam Mishra. Diksha’s parents host this invitation. Matkor: Sunday 22 November, provisional 4 PM. Haldi/Mehendi/Sangeet/concert: Tuesday 24 November from around 6 PM. Party: Wednesday 25 November at 6 PM, concert ~7:30 PM, Barmala ~9 PM. Bidai: Thursday 26 November, provisional 9 AM. Kathmandu reception TBA.

## Editing

Edit invitation.source.html, responsive-v2.css or interactions-v2.js, then run python build_invitation.py with Pillow installed. Image tokens are replaced with embedded WebPs. Preserve original PNGs; generated portrait WebPs are included. index.html runs independently of all source files and assets. Google Fonts is optional, with system fallbacks.

verify.cjs uses the available local Playwright runtime and Edge to check routes, schedules, mobile/desktop/landscape widths, language, navigation and browser errors. Preview images are ignored. See DESIGN.md for artwork prompts and references.

verify-v2.cjs validates the root fits without scrolling in both languages and multiple orientations, portrait art selection, new interactions and early overflow scrolling.
