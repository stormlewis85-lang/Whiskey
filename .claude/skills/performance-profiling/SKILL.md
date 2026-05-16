---
name: performance-profiling
description: |
  Use when investigating slow pages, memory issues, bundle size, slow queries, or
  running performance audits. Use before/after optimization to measure delta.
  Do NOT use for general code review or feature planning.
---

## Scorecard Thresholds

| Metric | Good | Acceptable | Poor |
|---|---|---|---|
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| FCP | < 1.8s | 1.8-3.0s | > 3.0s |
| TTFB | < 200ms | 200-600ms | > 600ms |
| Bundle (JS) | < 200KB | 200-500KB | > 500KB |
| API P95 | < 200ms | 200-500ms | > 500ms |
| DB queries/page | < 10 | 10-25 | > 25 |
| Memory (heap) | Stable | Slow growth | Unbounded |

## Procedure

### 1. Establish Baselines
Measure current state before optimizing: page load metrics, bundle size, memory, query count, API latency (P50/P95/P99).

### 2. Profile

**Frontend:**
- Lighthouse audit (performance, a11y, best practices)
- Bundle analyzer — identify largest chunks
- DevTools Performance tab — layout thrashing, re-renders, memory leaks

**Backend:**
- Profile endpoints under realistic load
- Enable query logging — count queries, find N+1
- Check for sync blocking in async paths
- Monitor memory allocation for leaks

**Database:**
- EXPLAIN on slow queries
- Check index usage on WHERE/JOIN columns
- Identify full table scans on large tables
- Check connection pool utilization

### 3. Prioritize
```
Impact Score = (User-Facing Impact × 3) + (Frequency × 2) + (Ease of Fix × 1)
```
Fix highest scores first. Don't optimize what doesn't matter.

### 4. Measure After
Compare before/after for every optimization. No benchmark in CI = next refactor undoes the win silently.

## Anti-Patterns
- Profiling in dev instead of production-like environments
- Optimizing the hot path you *think* exists instead of what profiler shows
- Micro-benchmarks excluding real workload costs (cache, GC, I/O)
- Shipping "faster" code with no regression test
