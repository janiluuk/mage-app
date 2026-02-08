# Admin Panel - New Features Summary

This document summarizes the new instance management features added in this branch.

## Overview

The Instance Management admin panel provides comprehensive monitoring and management capabilities for generator instances (ComfyUI, Stable Diffusion Forge, etc.).

## Key Features

### 1. Real-Time Monitoring Dashboard

- **Summary Statistics**: At-a-glance view of total instances, online status, queue sizes, and processing counts
- **Auto-Refresh**: Automatically updates every 30 seconds (configurable)
- **Visual Indicators**: Color-coded status badges and progress bars

### 2. Instance Management

- **Add Instances**: Create new generator instances with name, URL, type, and enabled status
- **Edit Instances**: Update instance configuration
- **Toggle Status**: Quickly enable/disable instances
- **Delete Instances**: Remove instances from the system

### 3. Metrics Visualization

- **Real-Time Metrics**: GPU, CPU, and memory utilization displayed on each instance card
- **Historical Charts**: 24-hour metrics history with interactive line charts
- **Color Coding**: Visual indicators for utilization levels (green/yellow/red)

### 4. Job Tracking

- **Queue Monitoring**: View queue size and processing count for each instance
- **Job History**: Complete history of processed jobs with processing times
- **Status Tracking**: Monitor job completion and performance

### 5. FFMpeg Worker Status

- **Encoding Status**: Monitor active and pending encoding jobs
- **Progress Tracking**: Real-time progress for encoding operations
- **Queue Management**: View total queue size for encoding operations

## Technical Implementation

### Frontend Components

- `InstanceManagement.vue` - Main admin panel view
- `InstanceCard.vue` - Individual instance display with metrics
- `MetricsChart.vue` - Historical metrics visualization
- `JobHistoryTable.vue` - Job history data table
- `FFMpegWorkerStatus.vue` - FFMpeg worker monitoring

### Backend API Endpoints

- `GET /api/administration/instances/status` - Comprehensive status
- `GET /api/administration/instances/{id}/metrics-history` - Historical metrics
- `GET /api/administration/instances/{id}/job-history` - Job history
- CRUD endpoints for instance management

### Services

- `instanceAdminService.js` - API client for admin endpoints

## User Guide

For detailed usage instructions, see [ADMIN_PANEL_USER_GUIDE.md](ADMIN_PANEL_USER_GUIDE.md).

## Screenshots

To capture screenshots of the new features:

1. **Automated**: Run `node scripts/capture-screenshots.js` (requires Playwright)
2. **Manual**: Follow instructions in [SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md)

Screenshots are saved to `docs/screenshots/` directory.

## Testing

All features are fully tested:
- **App-side**: 24 unit tests covering all service methods
- **API-side**: 13 feature tests covering all endpoints
- **E2E**: 5 tests for real instance integration

See [TEST_COVERAGE_SUMMARY.md](../mage-api/docs/TEST_COVERAGE_SUMMARY.md) for details.

## Configuration

### Environment Variables

```bash
# Optional: Configure auto-refresh interval (default: 30000ms = 30 seconds)
VITE_ADMIN_REFRESH_INTERVAL=30000
```

## Access

Navigate to `/administration/instances` in your browser. Requires administrator role.

## Future Enhancements

Potential improvements for future versions:
- WebSocket integration for real-time updates
- Alert thresholds and notifications
- Export functionality for metrics data
- Instance control (start/stop/restart)
- Advanced filtering and search
- Performance optimizations


