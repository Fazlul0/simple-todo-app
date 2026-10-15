# Simple Todo App

A minimal, dependency-free todo list built with vanilla HTML, CSS, and JavaScript.

## Features

- Add, complete, and delete todos
- Due dates with overdue / due-soon indicators
- Priority levels (Low, Medium, High)
- Filter by All / Active / Completed
- Sort manually, by due date, or by priority
- "Clear completed" bulk action
- "Reset" form button to clear input, date, and priority
- Total items badge in the heading (hidden when empty)
- Persistent storage in `localStorage`
- Responsive single-column layout

## UI polish

- Card hover lift and entry fade-in animation
- Visible focus rings on all interactive controls
- Smooth hover transitions on buttons, rows, and badges
- Soft row highlight on hover
- Empty state glyph
- Pill-style counter and total-badge
- `prefers-reduced-motion` respected (transitions disabled)
- Custom `::selection` color matching the accent

## Getting started

No build step or dependencies. Open the app in a browser:

```sh
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Or serve the directory with any static server, e.g.:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

| File         | Purpose                          |
|--------------|----------------------------------|
| `index.html` | App markup and form structure    |
| `styles.css` | Theming, layout, and animations  |
| `app.js`     | State, rendering, persistence    |

## Data

Todos are saved in `localStorage` under keys defined in `app.js`. Clearing site data
wipes the list, the active filter, and the sort preference.

## License

MIT
