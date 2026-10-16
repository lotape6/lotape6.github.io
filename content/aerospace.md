# Chapter: Aerospace (FADA-CATEC, Jun 2019 – Jul 2022)

Sources: CV 2022 and 2025, papers (OpenAlex/DOI records), project sites, video pages fetched 2026-10-16, links supplied by the user.

## One-line thesis
Three years turning research drones into machines that fly a mission on their own: see a target, decide, intercept, land. Six projects, three papers, one competition organised.

## Missions (in order)
| Callsign | Full name | Dates | Role | Video(s) |
|---|---|---|---|---|
| MBZIRC 2020 | Mohamed Bin Zayed International Robotics Challenge, Abu Dhabi | Jun 2019 – Feb 2020 | Software developer, computer vision | `zAnWRs0QPc4` (CATEC channel, names FADA-CATEC), `RYYms1P1BIg` (ISR Lisboa team promo) |
| GAVIOTA / VIGIA | Ground-to-air solutions for safe low-altitude drone operations (GAVIOTA, CATEC + PildoLabs) and VIGIA, AERTEC's detect-and-avoid system in the same family | Feb 2020 – Apr 2021 | Software developer | `6M2dLYKjCXI` (AERTEC's VIGIA video; CATEC not named; the user supplied it) |
| METRICS / RAMI | H2020 871252, RAMI = Robotics for Asset Maintenance and Inspection; 1st RAMI Cascade Campaign for aerial robots, run with IROS 2021 | Dec 2020 – Jan 2022 | Organiser and evaluator | none found |
| DELOREAN | H2020 870251, Drones and EGNSS for low-airspace urban mobility | Apr 2021 – Jun 2021 | Software developer | `NxC_7h8xo_A` (infodron.es Benidorm tests; CATEC not named; keep only if the user confirms) |
| ASSISTANCE | H2020 832576, 19 partners in 8 countries, coordinated by UPV; CATEC is "the main Spanish research centre for civil RPAS/UAS" and organised the final pilot in Linares, 17 Jun 2022 | Jun 2021 – Jul 2022 | Software developer, then project manager (Nov 2021) | `_mxQwBx6l0c` (project video 2020), `PQQH8Z-VyXQ` (UAV integration and gas/smoke sensing, Jun 2021), `8JxTLiy9tN8` (Pilot 2, Rotterdam, 2022), `Ux7T0L8sqtI` (Pilot 3, Linares, Jun 2022) |
| Piloto 5G Andalucía | Red.es / Vodafone pilot; swarm of drones streaming over 5G | Aug 2021 – Oct 2021 | Software developer | none found |

## Papers (all verified to name him)
1. F. González, R. Caballero, F. J. Pérez-Grau, A. Viguria. "Vision-based UAV Detection for Air-to-Air Neutralization". IEEE SSRR 2021. DOI 10.1109/SSRR53300.2021.9597861. Open access: https://zenodo.org/record/6519998. First author. Project: ASSISTANCE.
2. J. Mariscal-Harana, V. Alarcón, F. González, J. J. Calvente, F. J. Pérez-Grau, A. Viguria, A. Ollero. "Audio-Based Aircraft Detection System for Safe RPAS BVLOS Operations". Electronics 9(12):2076, 2020. DOI 10.3390/electronics9122076 (gold OA). Project: GAVIOTA.
3. M. A. Ruiz García, R. Caballero, F. González, A. Viguria, A. Ollero. "Autonomous drone with ability to track and capture an aerial target". ICUAS 2020, pp. 32–40. DOI 10.1109/ICUAS48674.2020.9213883. Project: MBZIRC.

## Hardware and stack
Jetson TX2 (several carriers) and Xavier NX, Raspberry Pi, Intel NUC, Linux for Tegra. ROS, OpenCV (C++ and Python), PCL, Darknet/YOLO, Docker with GPU and peripherals, GStreamer streaming (RTSP, RTP, SRT). Private Git server (so GitHub shows little of this).

## Photos
- ASSISTANCE final pilot, Linares, June 2022: 43 photos at https://assistance-project.eu/2022/06/30/succesful-final-pilot-demonstration-in-linares/index.html (files under https://assistance-project.eu/wp-content/uploads/2022/07/, e.g. IMG_7382.jpg). Licence not stated on the page; the user should check before reuse, or link rather than copy.
- YouTube thumbnails (`https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`) can be shown as posters by the page itself (loaded by the visitor's browser); they could not be downloaded from this session.

## Suggested interactive element
A radar scope: six blips, one per mission, placed by date around the sweep. Hovering a blip shows the callsign and role; clicking opens the mission panel with the video, the paper and the project link. The sweep animates only when the chapter is in view and respects reduced motion.

## Needs user confirmation
- Keep the VIGIA (AERTEC) video under GAVIOTA? The user supplied it, so default yes, labelled "VIGIA, AERTEC's detect-and-avoid demo from the same programme".
- Keep the DELOREAN Benidorm video (not CATEC's own)?
- May the Linares photos be used, or link only?
