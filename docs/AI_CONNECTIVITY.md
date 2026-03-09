# AI Connectivity

## Components
- mage-app frontend
- Mage API
- websocket/event path
- ComfyUI
- Stable Diffusion Forge
- Ollama
- FFmpeg/media processing
- storage/persistence

## Current flow

```mermaid
flowchart LR
    A[mage-app frontend] -->|REST polling| B[Mage API]
    A -->|local browser state| A2[Client-side orchestration]
    B -->|job enqueue| C[Instance-centric scheduler]
    C --> D[ComfyUI]
    C --> E[Stable Diffusion Forge]
    C --> F[Ollama]
    D --> G[FFmpeg/media processing]
    E --> G
    F --> G
    G --> H[storage/persistence]
    B -->|status polling| H
    A -->|poll admin endpoints| B
```

Today, the frontend initiates generation and repeatedly polls API/admin endpoints for status changes. The API schedules work around specific instances and dispatches tasks to ComfyUI, Stable Diffusion Forge, and Ollama depending on job type. Outputs then pass through FFmpeg/media processing before being written to storage/persistence. UI state coherence is largely browser-local, so shared job/event context across tabs, operators, and services is fragile.

## Current bottlenecks
- polling-heavy admin
- weak shared event story
- browser-local shared state
- instance-centric scheduling

## Target flow

```mermaid
flowchart LR
    A[mage-app frontend] <-->|Realtime events/WebSocket| B[Event gateway]
    B --> C[Mage API orchestration layer]
    C --> D[Queue + capability-aware scheduler]
    D --> E[ComfyUI workers]
    D --> F[Stable Diffusion Forge workers]
    D --> G[Ollama workers]
    E --> H[FFmpeg/media processing]
    F --> H
    G --> H
    H --> I[storage/persistence]
    I --> C
    C -->|state snapshots + audit trail| J[shared job state store]
    B -->|fan-out job updates| A
```

In the target model, polling is replaced with a shared event path where the frontend subscribes to real-time job updates via WebSocket/event gateway. Mage API becomes an orchestration layer backed by a queue and capability-aware scheduler rather than instance affinity. AI workers remain specialized (ComfyUI, Forge, Ollama), but job lifecycle state is persisted centrally and emitted as events to all subscribers. This yields consistent multi-client visibility, easier horizontal scaling, and clearer recovery semantics.

## Validation plan
- tests
  - Add/update integration tests for API orchestration and event emission ordering.
  - Add contract tests for worker adapters (ComfyUI/Forge/Ollama) and media pipeline handoff.
  - Add end-to-end tests to confirm frontend job timeline updates without polling.
- screenshots
  - Capture admin timeline and job detail screens showing live status transitions.
  - Capture failure/retry UX that reflects shared event-state recovery.
- load checks
  - Run synthetic concurrent generation workloads to compare polling vs event-driven overhead.
  - Measure queue latency, worker utilization, and event fan-out lag under burst traffic.
  - Validate storage write/read amplification for artifacts and status snapshots.
