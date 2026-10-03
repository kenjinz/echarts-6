# Provisional Native Capacity Scorecard

Generated for the implemented catalog on 2026-09-21. Every row intentionally remains **Inconclusive / Low confidence** until its example-specific acceptance criteria receive both automated and visual/domain-parity review. The API/approach column records what the prototype currently exercises; it is not a capability verdict.

| ID | Capability | Classification | Native API or approach | Confidence | Limitation |
| --- | --- | --- | --- | --- | --- |
| M01 | Direct matrix-coordinate scatter | Inconclusive | matrix series coordinate system | Low | Visual placement review pending |
| M02 | Nested Cartesian grids | Inconclusive | grid hosted by matrix | Low | None observed in automated run |
| M03 | Mixed axis types | Inconclusive | independent grid axes | Low | Detailed axis-label review pending |
| M04 | Fixed and automatic sizing | Inconclusive | matrix row and column sizing | Low | Narrow-size visual review pending |
| M05 | Headers, merged labels, empty cells | Inconclusive | matrix body and headers | Low | Merge combinations need manual review |
| M06 | Component placement | Inconclusive | matrix-hosted components | Low | Some component combinations may need offsets |
| M07 | Event routing | Inconclusive | chart and zrender events plus stable IDs | Low | Context menu is zrender-level |
| M08 | Dynamic insertion and removal | Inconclusive | stable IDs and full replacement | Low | Full replacement is used for clarity |
| M09 | Responsive resize | Inconclusive | ResizeObserver and chart.resize | Low | Screenshot review pending because local viewer was unavailable |
| M10 | Image export | Inconclusive | getDataURL | Low | Browser test verifies a non-empty download |
| C01 | Independent panels | Inconclusive | grid, line, scatter | Low | None observed |
| C02 | X range scopes | Inconclusive | maintained axis min and max | Low | ECharts does not choose conflict policy |
| C03 | Y range scopes | Inconclusive | maintained axis min and max | Low | ECharts does not choose conflict policy |
| C04 | Mixed X and Y scopes | Inconclusive | independent scope target resolution | Low | Application state required |
| C05 | Shared visible axis representation | Inconclusive | synchronized axes and hidden duplicates | Low | One physical axis is not reused across grids |
| C06 | X dataZoom scopes | Inconclusive | one dataZoom targets multiple axis IDs | Low | Scope topology rebuilt on toggle |
| C07 | Y dataZoom scopes | Inconclusive | one dataZoom targets multiple axis IDs | Low | Scope topology rebuilt on toggle |
| C08 | Selected-area zoom and reset | Inconclusive | toolbox dataZoom and restore | Low | Cross-grid selection needs manual review |
| C09 | Legend selection scopes | Inconclusive | grouped series names and legends | Low | Naming is a data-model constraint |
| C10 | Series visibility scopes | Inconclusive | legend selected state | Low | Uses grouped names |
| C11 | Symbol-only visibility | Inconclusive | showSymbol option update | Low | Not a legend-only behavior |
| C12 | Multiple Y-axis compatibility | Inconclusive | independent axes and validation | Low | Incompatible sharing is application validation |
| C13 | Tooltip and pointer routing | Inconclusive | stable series IDs | Low | None observed |
| C14 | Enlarge and restore | Inconclusive | selected grid moved to container box | Low | Matrix headers remain in state for restoration |
| C15 | Dynamic cells and state | Inconclusive | stable logical IDs | Low | Full option replacement used |
| C16 | Long labels and narrow view | Inconclusive | matrix overflow and scroll | Low | Manual typography review pending |
| S01 | Boundary and rectangular regions | Inconclusive | custom series with api.coord and api.size | Low | Representative geometry only |
| S02 | Pixel and domain-sized shapes | Inconclusive | scatter plus custom series | Low | Visual zoom comparison pending |
| S03 | Vector scale and reference value | Inconclusive | custom series data update | Low | Numeric input is external HTML |
| S04 | Continuous visualMap scopes | Inconclusive | grouped seriesId targets | Low | Scope grouping is application policy |
| S05 | Piecewise visualMap scopes | Inconclusive | piecewise visualMap and grouped targets | Low | Scope grouping is application policy |
| S06 | Spatial range and zoom scopes | Inconclusive | axis state and dataZoom target arrays | Low | External scope controls required |
| S07 | Legend, series, and symbols | Inconclusive | legend and option updates | Low | Symbol-only visibility uses setOption |
| S08 | Data-item interaction | Inconclusive | stable series and data identities | Low | Disabled mappings need manual interaction review |
| S09 | Aspect, clipping, resize, enlargement | Inconclusive | Cartesian grids and clip | Low | Exact square-ratio pixel audit pending |
| S10 | State persistence | Inconclusive | serializable maintained state | Low | Application state owns restoration |
| P01 | Main spatial plot only | Inconclusive | matrix-hosted grid | Low | None observed |
| P02 | Top marginal fixed X | Inconclusive | shared X state and dataZoom targets | Low | Coupling is application-declared fixed |
| P03 | Right marginal fixed Y | Inconclusive | shared Y state and dataZoom targets | Low | Coupling is application-declared fixed |
| P04 | Both marginal plots | Inconclusive | three hosted grids per logical cell | Low | Local offsets required |
| P05 | Sparse marginals | Inconclusive | conditional hosted grids | Low | Screenshot generated; visual review pending |
| P06 | Matrix subregions | Inconclusive | matrix composition | Low | Grouped-header refinement pending |
| P07 | Multiple nested grids | Inconclusive | multiple grids share matrix coord | Low | Requires disciplined IDs and offsets |
| P08 | Pixel-box fallback | Inconclusive | explicit calculated boxes | Low | Resize complexity must be measured |
| P09 | Cross-cell main ranges | Inconclusive | target resolver plus fixed coupling | Low | Application state required |
| P10 | Marginal value-axis scopes | Inconclusive | independent target groups | Low | More interaction leakage checks recommended |
| P11 | Compound visual components | Inconclusive | grouped component targets | Low | Dense layouts need visual review |
| P12 | Constrained 2 by 3 layout | Inconclusive | matrix overflow and resize | Low | Long-label visual review pending |
| G01 | Native grid3D matrix placement | Inconclusive | undocumented matrix fields | Low | Must not infer support from accepted options |
| G02 | Absolute multi-grid3D fallback | Inconclusive | percentage grid3D boxes | Low | Explicit layout is required |
| G03 | Independent 3D cameras | Inconclusive | per-grid3D viewControl | Low | Manual interaction targeting review pending |
| G04 | Camera scopes | Inconclusive | maintained viewControl state | Low | Public camera events need further observation |
| G05 | 3D ranges, legend, visualMap | Inconclusive | 3D axes and visualMap targets | Low | Legend parity requires manual review |
| G06 | Bounded spatial 3D profile | Inconclusive | scatter3D, line3D, surface | Low | Rendering parity is representative only |
| G07 | 3D main plus 2D marginals | Inconclusive | absolute grid3D plus matrix grids | Low | Mixed coordinate layout has added resize complexity |
| G08 | Per-cell 2D and 3D modes | Inconclusive | combined core and GL options | Low | Context reuse remains extension-managed |
| G09 | 3D enlargement | Inconclusive | selected grid3D box expansion | Low | Camera persistence is maintained state |
| G10 | WebGL resource comparison | Inconclusive | canvas getContext instrumentation | Low | Browser memory APIs remain optional |
| R01 | State export and import | Inconclusive | application JSON snapshot | Low | Not a matrix capability |
| R02 | Renderer image export | Inconclusive | getDataURL | Low | GL and SVG support differ by mode |
| R03 | CSV and raw JSON | Inconclusive | application data-model export | Low | Independent of chart instances |
| R04 | Per-cell baseline | Inconclusive | one echarts.init per cell | Low | Intentionally resource-heavy comparison |
| R05 | Repeated lifecycle | Inconclusive | init and dispose | Low | Automated for 20 cycles |
| R06 | Rapid scope changes | Inconclusive | deterministic option replacement | Low | No event-loop errors observed |
| R07 | Size and timing comparison | Inconclusive | runtime metrics and five-iteration summary | Low | Machine-specific measurements only |
| R08 | Renderer and dimensional cleanup | Inconclusive | dispose and reinitialize renderer | Low | WebGL cleanup is browser-managed |

## Provisional verdicts

| Target | Verdict | Rationale |
| --- | --- | --- |
| Multi-panel Cartesian | Evaluation implemented | One-instance routes, scope controls, state capture, export, and lifecycle probes are ready for acceptance review. |
| Bounded spatial 2D | Evaluation implemented | Representative custom and ordinary series plus scoped controls are ready for geometry and interaction review. |
| Bounded spatial 3D | Evaluation implemented | Representative GL series, resource accounting, and state controls are ready for parity and camera review. |
| Compound spatial 2D | Evaluation implemented | Nested-grid and calculated-box variants are ready for layout and interaction review. |
| Compound 3D main with 2D marginals | Evaluation implemented | The mixed-dimensional route is ready for layout, resize, and cleanup review. |

## Evidence

- Automated browser run: every M, C, S, P, G, and R route loads without page or console errors.
- Unit tests verify stable IDs, scope targeting, imported-state validation, option-state capture, 2D/3D topology, enlargement, WebGL accounting, exports, and scorecard defaults.
- Representative screenshots are stored in `evidence/screenshots`.
- Representative runtime option snapshots are stored in `evidence/options`; R07 comparison output is stored in `evidence/measurements`.
- Visual inspection remains pending, so screenshots are evidence inputs rather than pass/fail proof.
