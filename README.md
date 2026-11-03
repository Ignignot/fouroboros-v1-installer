# FOUROBOROS V1 — install page

Public hosting of the FOUROBOROS V1 installer page so it can be opened in
Chrome (desktop or Android) over https — WebMIDI needs a secure context.

**Install page:** `installer/` — open it, connect an M-VAVE FM-1 running
stock V15 (`FM-1_015`), and follow the steps. The page verifies its
bundled firmware package by SHA-256 before the Install button wakes up.

- Release: FOUROBOROS V1, source commit
  `04d0e620485dcb1dc90c644ee17268d7241cdad8`
- Package: `installer/felucca-04d0e62.fwsc` (609,912 bytes),
  sha256 `4bdc3e2cd6099a712c822e5a59419d69703721b23b8e8a2af597e621edd935c3`
- Status: smoke candidate — hardware verification pending (see the
  banner on the page itself).

FOUROBOROS is built on SLOOP / Felucca (GPL-3.0); the update engine in
`web/` is that project's, used unchanged. The way back to official
stock V15 is built into the bottom of the page. M-VAVE and FM-1 are
trademarks of their respective owners; this page is not affiliated
with them.
