# ODYSSEY — Product Requirements

## 1. Vision
A single-page, scroll-driven 3D journey that starts in orbit above Earth and ends inside the lensed light of a supermassive black hole. The scrollbar works as a throttle: every pixel of scroll moves one continuous camera further through the solar system and beyond.

> "Pick one hard idea and execute it cleanly." Here that idea is **one unbroken camera flight** that ends in a **real-time, physically-inspired ray-marched black hole**.

## 2. Research: what the best sites do
| Reference | Takeaway we adopt |
|---|---|
| Awwwards Three.js / "Scroll 3D" collections (Active Theory, Immersive Garden, Locomotive) | Scroll drives a sequenced 3D scene rather than moving a 2D page |
| Utsubo "Best Three.js Websites 2026" | Restraint: one signature effect, executed with care, beats a pile of effects |
| *Aphelion* (fictional space agency, three.js) | Shader-built procedural planets with no image textures, one continuous camera path |
| "Scroll Through Space" (three.js forum) | Environment changes as you travel; speed is expressed through the scene |
| Lenis + GSAP ScrollTrigger (industry standard) | Inertial smooth scroll, with scroll-linked reveals kept in sync with WebGL |

## 3. Goals
1. **Wow in the first 3 seconds.** A cinematic preloader leads into a shader-built Earth with atmosphere, clouds and city lights.
2. **Scroll equals travel.** Eight chapters, one camera path, and no hard cuts.
3. **Speed you can feel.** The faster you scroll, the more warp streaks, FOV kick, camera roll and chromatic aberration you get.
4. **A finale people screenshot.** A ray-marched Schwarzschild black hole with gravitational lensing, a Doppler-beamed accretion disk and a photon ring.
5. **Real facts.** Every chapter carries accurate, sourced-style numbers.

### Non-goals
Accurate orbital mechanics or scale (it's a cinematic journey, not a simulator), a CMS, audio (v2) and WebGPU (v2).

## 4. Chapters
| # | Chapter | Beat | Signature visual |
|---|---|---|---|
| 00 | Earth | "Beyond the pale blue dot" (hero) | Procedural continents, specular oceans, night-side city lights, Rayleigh-style rim glow |
| 01 | Moon | First stepping stone | Harsh terminator, maria and crater noise |
| 02 | Mars | A desert that remembers water | Rust fbm terrain, polar cap, thin dusty atmosphere |
| 03 | Asteroid Belt | Rubble of a world that never formed | ~1,800 instanced, displaced rocks the camera flies *through* |
| 04 | Jupiter | A storm older than nations | Turbulent banded shader and the Great Red Spot |
| 05 | Saturn | Jewelry of ice and time | Banded rings with the Cassini division and the planet's shadow cast on the rings |
| 06 | Sagittarius A* | Where light forgets the way home | Full-screen ray-marched lensing and accretion disk |
| 07 | Beyond | Outro quote + "Return to Earth" | Camera dives toward the photon ring |

## 5. Functional requirements
- **FR1 Scroll engine:** Lenis smooth scroll maps to a normalized progress value, which drives Catmull-Rom camera and look-at curves. The camera *dwells* on each keyframe while its copy is readable, then travels.
- **FR2 Collision-safe path:** keyframes must keep the camera at least 1.4× the radius away from any body and out of Saturn's ring annulus. Verified numerically (see `js/config.js`).
- **FR3 HUD:** mission clock, distance from Earth (log-interpolated, auto-switching km to light-years), velocity, and the current chapter.
- **FR4 Chapter rail:** clicking a chapter flies the camera there.
- **FR5 Reveals:** headlines rise character by character, stats count up, and the accent color re-themes per chapter.
- **FR6 Pointer parallax:** the camera drifts subtly toward the cursor, and a custom cursor reacts to interactive elements.
- **FR7 Preloader:** shaders are compiled before reveal so the first scroll never stutters.

## 6. Non-functional requirements
| Area | Target |
|---|---|
| Performance | 60 fps on an M1-class laptop; ≥ 30 fps on a mid-range phone (reduced counts, DPR ≤ 1.5) |
| Weight | 0 image textures and < 100 KB of first-party code. Libraries come from CDN (three, gsap, lenis) |
| Accessibility | Semantic sections and real text (not canvas), `prefers-reduced-motion` disables smoothing, warp and aberration, visible focus states, AA contrast on copy |
| Responsive | Portrait layouts re-frame the camera so the planet sits above the copy |
| Compatibility | Evergreen browsers with WebGL2 |

## 7. Success metrics
Average scroll depth > 70%, the black hole chapter reached by > 50% of visitors, and "Return to Earth" clicks show as re-engagement.

## 8. Tech
Three.js (ShaderMaterial and EffectComposer), UnrealBloom, a custom black-hole pass and a custom film pass (grain, vignette, CA), GSAP and ScrollTrigger, and Lenis. The site is static with no build step.
