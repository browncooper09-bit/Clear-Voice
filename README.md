# ClarityAAC

A dependency-free, low-stimulation AAC board prototype built with HTML, CSS, and JavaScript.

## Run locally
Open `index.html` in a modern browser. Speech voices come from the browser/device.

## Publish with GitHub Pages
1. Create a GitHub repository.
2. Upload `index.html`, `styles.css`, and `app.js` to the repository root.
3. In repository Settings, open Pages and publish from the main branch/root folder.

## Prototype caregiver access
Press and hold **Caregiver** for 3 seconds. The starter PIN is `2468`. Change it under caregiver settings.

## Included
- Static 4x4 board slots and fixed motor-planning positions
- Persistent quick responses and sentence strip
- Browser text-to-speech
- Focus-mode masking that keeps grid coordinates
- Caregiver tile creation, photo upload, voice preview, board assignment, and PIN change
- `localStorage` persistence
- Responsive tablet/mobile layout and reduced-motion support

## Important clinical note
This is a functional prototype, not a medical device. Test vocabulary, symbols, voice behavior, access methods, and emergency communication with AAC users, caregivers, educators, and speech-language professionals before relying on it.

## Suggested production improvements
- Replace emoji with a licensed, consistent AAC symbol set
- Add export/import and backup
- Resize/compress uploaded photos before storage
- Add multilingual vocabulary and voice selection
- Add automated accessibility and browser tests
- Create a service worker for installable offline use
