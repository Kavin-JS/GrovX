# GrovX

**GrovX** (Quantum Search Lab) is an application-driven implementation and evaluation of **Grover's search algorithm**, built as a multi-page React website.

**Live site:** https://Kavin-JS.github.io/GrovX/

The application: recovering one secret item (an n-bit unlock code, or a record in an unsorted table) from a yes/no check, compared against classical linear search on queries, time, qubits, gate counts, noise tolerance and practical advantage.

## Pages

| Page | What it does |
|---|---|
| Home | Problem statement, live animated Grover demo, headline results |
| Algorithm | Theory, four steps, circuit diagram, interactive rotation picture, complexity |
| Lab | Classical search and Grover side by side; amplitudes per iteration, shot-based measurement, probability curve, gate counts |
| Benchmarks | Sweeps N = 2^n, measures queries and time, validates the simulator against theory, CSV export |
| Resources | Qubits, Toffoli/CNOT counts, noise-aware success, quantum vs classical run time, crossover chart |
| Evaluation | Findings, comparison, key-search application, advantages, limitations, conclusion, references |

## Run locally

Requires Node 18 or newer.

```bash
npm install
npm run dev
```

Vite serves the site at **http://localhost:5173/GrovX/** (the `/GrovX/` path matches the GitHub Pages address).

Other commands:

```bash
npm run build      # production build into dist/
npm run build:docs # production build into docs/ (for Pages option A)
npm run preview    # serve the production build locally
npm test           # unit tests: simulator, Grover circuit, resource model
```

## Deploy to GitHub Pages

The repository is `Kavin-JS/GrovX`. There are two ways to publish; use either one.

### Option A: deploy from the `docs/` folder (no build step, no hidden files)

The repository already contains a ready-built copy of the site in `docs/`.

1. Push everything to the `main` branch.
2. Open **Settings > Pages**. Under **Source** choose **Deploy from a branch**, then branch `main` and folder `/docs`, and click Save.
3. The site appears at https://Kavin-JS.github.io/GrovX/ after a minute.

If you change the source code, rebuild the folder with `npm run build:docs` and commit `docs/` again.

### Option B: automatic build with GitHub Actions

1. Make sure `.github/workflows/deploy.yml` is in the repository. It is a hidden folder, and the GitHub web uploader can skip it, so use `git push` or GitHub Desktop, or create the file in the GitHub editor.
2. Open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The workflow builds the Vite project and publishes `dist/` on every push to `main`. You can also run it by hand from the **Actions** tab.

### Configuration that makes this work

- `vite.config.js` sets `base: '/GrovX/'`, so all asset URLs start with `/GrovX/`.
- The app uses hash routing (`/#/lab`), so no server-side redirects or `404.html` are needed.
- No backend, database, API keys or environment variables are used. Everything runs in the browser.

## How the quantum part is implemented

- `src/quantum/simulator.js`: state-vector simulator with the gates H, X and multi-controlled Z (all real-valued, so the simulation is exact).
- `src/quantum/grover.js`: builds Grover's circuit as an explicit gate list (oracle = X, MCZ, X; diffusion = H, X, MCZ, X, H) and runs it gate by gate.
- `src/quantum/resources.js`: estimates Toffoli/CNOT counts, fidelity and run time.
- `src/classical/linearSearch.js`: the classical baseline.
- `tests/grover.test.js`: checks that the simulated success probability equals sin^2((2k+1)theta) for every iteration count.

## Project structure

```
GrovX/
├── .github/workflows/deploy.yml   GitHub Pages deployment
├── docs/                          prebuilt site for GitHub Pages (option A)
├── public/                        static assets (favicon)
├── src/
│   ├── quantum/                   simulator, Grover circuit, resource model
│   ├── classical/                 linear search baseline
│   ├── experiments/               benchmark sweep and CSV export
│   ├── components/                charts, circuit and rotation diagrams
│   ├── pages/                     the six pages
│   ├── hooks/  utils/             chart colours, number formatting
│   ├── App.jsx  main.jsx  styles.css
├── tests/                         unit tests
├── index.html  vite.config.js  package.json  package-lock.json
├── LICENSE  README.md  .gitignore
```

## Note on the results

The simulator runs on a classical CPU, so its wall-clock time is much larger than classical search. Grover's advantage is a reduction in oracle queries (O(N) to O(sqrt N)) on quantum hardware, not faster simulation. Resource and noise figures are back-of-envelope estimates and are labelled as such.

## License

MIT, see `LICENSE`.
