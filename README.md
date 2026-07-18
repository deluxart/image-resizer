# Online Image Resizer

A small full-stack app that lets a user upload JPEG/PNG images, pick a resize
percentage, and download the resized results. The interesting part isn't the
resizing itself — it's doing it **without letting one user's work block anyone
else's**, while keeping memory under control.

**Stack:** React + TypeScript (Vite) · ASP.NET Core (.NET 8) · ImageSharp

---

## Running it

Two terminals:

```bash
# API  ->  http://localhost:5080
cd Api
dotnet run

# Client  ->  http://localhost:5173
cd client
npm install
npm run dev
```

Open http://localhost:5173, add images, choose a percentage, hit **Resize**,
download the results.

---

## The core problem

Image resizing is **CPU-bound**, and every decoded image sits in memory while
it's being processed. A naïve implementation ("resize on each request as it
arrives") falls apart under load: a burst of uploads spins up hundreds of
parallel resizes, saturates the CPU, inflates memory, and starves the thread
pool — so **every** request slows down, including requests from other users.

That is exactly what the assignment's non-functional requirements are testing:

| Requirement | How it's addressed |
|---|---|
| *Don't block other users' sessions* | A `SemaphoreSlim` caps concurrent resizes at `N = CPU cores`. Extra requests **await** a free slot without blocking a thread, so the server stays responsive. |
| *Memory management* | Images are streamed straight from the upload into ImageSharp (never buffered as one big `byte[]`), and the decoded bitmap is disposed immediately (`using`). Bounded concurrency also bounds peak memory. |
| *Maximum users: 1,000,000* | The server is stateless per request; the real path to that scale is discussed in [Scaling](#scaling-to-1m-users) below. |
| *Max 10 images per user* | Enforced on the client (queue cap); a stateless server-side equivalent is noted in Scaling. |
| *HTTP timeout: 30s* | ASP.NET Core request-timeout middleware cancels the request's `CancellationToken` after 30s → the API returns `408`. |
| *Block upload until previous finished* | The client processes images **one at a time** and disables the upload control while a batch is running. |

The throttle lives in `ImageResizeService`:

```csharp
private readonly SemaphoreSlim _throttle; // size = configured cores

await _throttle.WaitAsync(cancellationToken);   // wait for a slot (async, non-blocking)
try   { /* decode -> resize -> encode */ }
finally { _throttle.Release(); }                // always free the slot
```

`N = cores` because the work is CPU-bound: more parallelism than cores just adds
context-switching and memory pressure without going faster.

---

## Architecture

The goal was clean, layered code with single responsibilities — the way it
would be written in a large codebase, not a single-file script.

### Backend (`Api/`)

```
Configuration/ResizeOptions.cs      Strongly-typed limits, bound from appsettings + validated on start
Contracts/ResizedImage.cs           Immutable result record
Services/ImageResizeService.cs      The only place that resizes — owns the concurrency semaphore
Validation/ImageUploadValidator.cs  Request validation, separate from the controller (unit-testable)
Exceptions/                         Domain exceptions instead of raw strings
Middleware/ExceptionHandlingMiddleware.cs  One place that maps exceptions -> HTTP status + JSON error
Controllers/ResizeController.cs     Thin: validate -> resize -> return file
Program.cs                          Composition root only
```

Why this shape:

- **Single responsibility.** The controller doesn't validate, resize, *and*
  handle errors — each of those is its own piece.
- **Configuration over magic numbers.** Size limit, allowed formats,
  concurrency and timeout live in `appsettings.json` (`IOptions<ResizeOptions>`,
  validated on startup), so they're tunable per environment.
- **Centralized error handling.** Services just throw meaningful exceptions;
  the middleware turns them into `400/415/408/500` with a consistent JSON body.
  No repetitive `try/catch` scattered across methods.
- **Dependency injection throughout**, including a singleton resizer so the
  semaphore is genuinely shared across all requests.

### Frontend (`client/src/`)

```
config.ts                           API URL, limits, accepted formats — one source of truth
shared/api/httpClient.ts            Configured axios instance
features/resizer/
  hooks/useResizeQueue.ts           ALL feature logic: queue, sequential processing, upload-blocking
  api/resizeImage.ts                One request, typed, with error parsing
  types.ts                          Strict, readonly types
  components/                       Presentational only (props in, UI out):
    ResizerPage · Toolbar · UploadButton · ScaleSlider · ImageList · ImageRow
```

Logic lives in the hook; components are dumb and presentational. That keeps the
UI trivial to reason about and the behaviour easy to test in isolation.

**A note on React Query:** I deliberately did **not** use it here. React Query
shines at *server-state caching* (lists, refetching, invalidation). Resizing is
a one-shot mutation with nothing to cache, so it would add a dependency and
indirection for no benefit. axios + a small typed hook is the cleaner fit. I'd
reach for React Query the moment we cached results or listed past jobs.

---

## Scaling to 1M users

The current design handles concurrency correctly on a single instance. Taking it
to a million users is an infrastructure story, and the code is already shaped for
it (stateless requests, no in-process user state). The path:

1. **Go async / job-based.** Instead of resizing inside the HTTP request,
   `POST /resize` enqueues a job and returns a `jobId`; the client polls
   `GET /jobs/{id}` (or gets a push) and downloads when ready. This removes the
   30-second-per-request ceiling and decouples upload rate from processing rate.
2. **External queue + worker fleet.** Put jobs on a real broker (given the AWS
   context, **SQS**) and process them with a separate, horizontally-scalable
   pool of worker services. Throughput scales by adding workers; the API stays
   thin and fast.
3. **Object storage, not local disk.** Uploads and results live in **S3**, so
   any instance can serve any result and nothing is tied to one machine.
4. **Stateless API behind a load balancer.** With no per-instance state, you
   scale the API horizontally; per-user limits (the "10 images") move to a
   shared store like **Redis** (counter with TTL) so the cap holds across
   instances.
5. **Backpressure & limits.** Bounded queues, per-user rate limits, and max
   image dimensions protect the system from abuse and runaway memory.

The in-process semaphore in this submission is the single-node version of the
same idea: *bound the concurrent work so the system degrades gracefully instead
of collapsing.*

---

## Trade-offs & what I'd add with more time

- **Automated tests.** The validator and the resize service are written to be
  testable in isolation (pure-ish, injected dependencies); I'd add unit tests
  for validation rules and an integration test for the endpoint.
- **The async job model** described above — the current synchronous endpoint is
  the right size for the assignment, but I'd move to jobs for real scale.
- **Server-side per-user limit** via Redis, rather than client-side only.
- **Observability** — structured request logging and metrics (resize duration,
  queue wait time) to actually see the concurrency behaviour under load.
