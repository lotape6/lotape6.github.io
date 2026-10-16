# Chapter: Automotive (Bertrandt for BMW, Jul 2022 – May 2024)

Sources: CV 2025; BMW Group PressClub releases fetched 2026-10-16 (links below). Nothing public names Bertrandt or the user in connection with the handles, so the page presents the role as the user's own experience and the product facts as BMW's.

## One-line thesis
Owner of the software for one part everybody touches first: the flush door handles that extend on their own as you walk up to a Neue Klasse BMW.

## Role (from CV)
- Designed the software architecture for the extendable door handles of next-generation BMW vehicles, keeping system states, events and requirements traceable.
- Automotive-critical C++ on AUTOSAR; requirement-driven development across the lifecycle.
- Diagnosed integration issues from CAN, LIN, SOME/IP and DLT traces across interdependent components.
- Git-based integration, GTest/GMock unit tests, Scrum.
- The user: "the cars with extendable door handles released in 2026 were the target of my software (I was in charge of the extendable door handles)".

## The product, in BMW's words (all HIGH confidence, quoted from PressClub)
- BMW iX3 (NA5), launched Sep 2025, first Neue Klasse model: "The door handles are integrated flush into the doors and extend automatically when the standard BMW Digital Key approaches." (US press kit, https://www.press.bmwgroup.com/usa/article/attachment/T0452316EN_US/637548)
- BMW i3, second Neue Klasse model, Mar 2026: "retractable flush door handles that extend automatically"; "When the BMW Digital Key Plus is near, the flush-mounted door handles automatically extend." (https://www.press.bmwgroup.com/global/article/detail/T0456164EN/the-new-bmw-i3-second-model-of-the-neue-klasse)
- Euro NCAP five stars, Jul 2026: "The assessors confirmed that the electrically operated handles worked reliably after all the crash tests." and exit is possible "even in the event of all the electrical systems failing" thanks to "a mechanical redundancy". (https://www.press.bmwgroup.com/global/article/detail/T0459155EN/)
- Consumer page: handles extend at about six feet and light up in darkness (https://www.bmwusa.com/vehicles/x-series/ix3/bmw-ix3/ix3-2025-na5-bev-exterior.html).
- Behaviour details from the press: ice-breaking function in cold weather (BMWBLOG), and the exit-warning that holds the latch when a cyclist is coming: "The handle moves. The door doesn't." (GadgetReview).
- Architecture context: "Four Superbrains for the Neue Klasse" (https://www.press.bmwgroup.com/global/article/detail/T0448372EN): zonal controllers, 600 m less wiring, 30% lighter harness, basic functions incl. vehicle access on one central computer.

## Visuals
- Press photos exist in each release's media section but need a free My.PressClub login and are licensed "for press purposes exclusively". Do not copy; link, or ask support.pressclub@bmwgroup.com.
- Embeddable official videos (BMW Group channel, IDs seen on the press page https://www.press.bmwgroup.com/global/article/detail/T0452379EN/): Neue Klasse documentary Ep.1 `fWOx09Lvwg4`, Ep.3 design language `8amA1rK_m-8`, Deep Dive Design `GnsghaXyaTE`.
- Best approach for the chapter background: an original illustration (SVG/Canvas) of a flush handle extending, drawn by us, so no licence issue.

## Suggested interactive element
A state machine the visitor can drive: Retracted → Approach detected (key nearby) → Extended → Grasp → Unlocked/Open → Retract; plus the two safety branches (exit-warning hold, mechanical redundancy). Each state shows which bus signals are involved in general terms (CAN/LIN) without any confidential detail. A slider "walk towards the car" extends the handle in the illustration.

## Needs user confirmation
- OK to show the state machine at this level of generality (public press facts only)?
- OK to embed BMW's official Neue Klasse documentary videos?
