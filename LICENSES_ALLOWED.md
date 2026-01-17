# Approved Licenses

This document lists the licenses approved for use in CyberDocGen dependencies.

## Approved License Categories

### Permissive (Approved)
- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- ISC
- 0BSD
- Unlicense
- CC0-1.0
- CC-BY-3.0
- CC-BY-4.0
- WTFPL
- Zlib
- Python-2.0

### Weak Copyleft (Requires Review)
- LGPL-2.0
- LGPL-2.1
- LGPL-3.0
- MPL-2.0
- EPL-1.0
- EPL-2.0

These may be used in production but require legal review to ensure proper linking compliance.

### Not Approved (Copyleft)
- GPL-2.0
- GPL-3.0
- AGPL-3.0
- SSPL-1.0

These licenses require that derivative works also be open-sourced under the same license. They are not approved for use in CyberDocGen without explicit legal approval.

## Review Process

1. New dependencies must have licenses listed in "Approved" category
2. Dependencies with "Requires Review" licenses need legal sign-off
3. "Not Approved" licenses cannot be used without executive approval
4. Run `npx license-checker --summary --production` to audit current dependencies

## Current Status

As of January 2026, CyberDocGen uses 967 packages with the following license distribution:
- MIT: ~85%
- ISC: ~5%
- Apache-2.0: ~5%
- BSD variants: ~4%
- Other permissive: ~1%

All current production dependencies use approved licenses.
