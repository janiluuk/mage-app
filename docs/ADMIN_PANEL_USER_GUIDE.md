# Admin Panel User Guide - Instance Management

This guide explains how to use the Instance Management features in the Admin Panel.

## Overview

The Instance Management panel allows administrators to:
- Monitor all generator instances (ComfyUI, Stable Diffusion Forge)
- View real-time metrics (GPU, CPU, memory utilization)
- Track job queues and processing status
- Manage instance configurations
- View historical metrics and job history

## Accessing the Admin Panel

1. Navigate to `/administration/instances` in your browser
2. Ensure you are logged in as an administrator
3. The panel will automatically load instance data

## Main Dashboard

### Summary Statistics

The top of the panel displays four key metrics:

- **Total Instances**: Number of configured generator instances
- **Online**: Number of instances currently online and healthy
- **Total Queue**: Combined queue size across all instances
- **Processing**: Number of jobs currently being processed

![Summary Statistics](screenshots/summary-stats.png)

### Instance Cards

Each generator instance is displayed as a card showing:

- **Instance Name**: Human-readable name
- **Type**: ComfyUI or Stable Diffusion Forge
- **Status Badge**: Online/Offline/Error status
- **Queue Size**: Number of jobs waiting
- **Processing Count**: Number of active jobs
- **Current Model**: Active model (if available)
- **GPU/CPU/Memory**: Utilization percentages
- **Last Health Check**: Timestamp of last status check

![Instance Cards](screenshots/instance-cards.png)

### Instance Actions

Each instance card provides several action buttons:

1. **View Metrics History** (📊): Opens a chart showing 24-hour metrics history
2. **View Job History** (📋): Shows completed jobs for this instance
3. **Toggle Enabled** (⚙️): Enable or disable the instance
4. **Edit** (✏️): Modify instance configuration
5. **Delete** (🗑️): Remove instance

![Instance Actions](screenshots/instance-actions.png)

## Managing Instances

### Adding a New Instance

1. Click the **"Add Instance"** button in the top-right corner
2. Fill in the form:
   - **Name**: Descriptive name (e.g., "ComfyUI Server 1")
   - **URL**: Full URL including port (e.g., `http://192.168.1.100:8188`)
   - **Type**: Select from dropdown (ComfyUI or Stable Diffusion Forge)
   - **Enabled**: Toggle to enable/disable immediately
3. Click **"Save"** to create the instance

![Add Instance Dialog](screenshots/add-instance-dialog.png)

### Editing an Instance

1. Click the **Edit** button (✏️) on an instance card
2. Modify the fields as needed
3. Click **"Save"** to update

### Toggling Instance Status

- Click the **Toggle Enabled** button (⚙️) to quickly enable/disable an instance
- Disabled instances won't receive new jobs but remain visible for monitoring

### Deleting an Instance

1. Click the **Delete** button (🗑️) on an instance card
2. Confirm the deletion
3. The instance will be permanently removed

## Viewing Metrics History

### Opening Metrics Chart

1. Click the **"View Metrics History"** button (📊) on any instance card
2. A dialog opens showing a 24-hour metrics chart

### Metrics Chart Features

The chart displays:
- **GPU Utilization**: GPU usage percentage over time
- **CPU Utilization**: CPU usage percentage over time
- **Memory Utilization**: Memory usage percentage over time
- **Queue Size**: Number of queued jobs over time
- **Processing Count**: Active jobs over time

![Metrics Chart](screenshots/metrics-chart.png)

### Chart Controls

- **Time Range**: Automatically shows last 24 hours
- **Hover**: Hover over data points to see exact values
- **Zoom**: Click and drag to zoom into specific time ranges
- **Close**: Click outside or press ESC to close

## Viewing Job History

### Opening Job History

1. Click the **"View Job History"** button (📋) on any instance card
2. A dialog opens showing completed jobs

### Job History Table

The table displays:
- **Job ID**: Unique identifier
- **Video Job ID**: Associated video job
- **Processing Time**: Duration in seconds
- **Completed At**: Timestamp of completion
- **Video Job Details**: Prompt and generator type

![Job History](screenshots/job-history.png)

### Job History Features

- **Sorting**: Click column headers to sort
- **Pagination**: Navigate through multiple pages
- **Limit**: Shows up to 50 most recent jobs
- **Filtering**: Jobs are automatically filtered to completed status only

## FFMpeg Worker Status

The bottom section shows FFMpeg encoding status:

- **Active Encoding**: Number of videos currently being encoded
- **Pending Encoding**: Number of videos waiting to be encoded
- **Active Jobs**: List of currently encoding videos with progress

![FFMpeg Status](screenshots/ffmpeg-status.png)

## Auto-Refresh

The panel automatically refreshes every 30 seconds to show the latest data. You can also:

- Click the **Refresh** button (🔄) to manually update
- The **"Updated"** timestamp shows when data was last fetched

## Best Practices

### Instance Configuration

1. **Use Descriptive Names**: Name instances clearly (e.g., "ComfyUI-GPU1", "SD-Forge-Production")
2. **Correct URLs**: Ensure URLs include the full protocol and port
3. **Monitor Health**: Regularly check instance health status
4. **Balance Load**: Distribute jobs across multiple instances when possible

### Monitoring

1. **Check Metrics Regularly**: Review metrics history to identify patterns
2. **Monitor Queue Sizes**: High queue sizes may indicate capacity issues
3. **Watch Processing Count**: Ensure instances aren't overloaded
4. **Review Job History**: Analyze processing times to optimize performance

### Troubleshooting

1. **Offline Instances**: 
   - Check network connectivity
   - Verify instance is running
   - Check firewall rules
   - Review instance logs

2. **High Queue Sizes**:
   - Add more instances
   - Optimize job processing
   - Check for stuck jobs

3. **High Resource Utilization**:
   - Consider adding more instances
   - Review job complexity
   - Check for resource leaks

## Keyboard Shortcuts

- **R**: Refresh data (when panel is focused)
- **ESC**: Close dialogs
- **Enter**: Submit forms

## API Integration

The admin panel uses the following API endpoints:

- `GET /api/administration/instances/status` - Get all instance data
- `GET /api/administration/instances/{id}/metrics-history` - Get metrics history
- `GET /api/administration/instances/{id}/job-history` - Get job history
- `POST /api/administration/generator-instances` - Create instance
- `PUT /api/administration/generator-instances/{id}` - Update instance
- `PATCH /api/administration/generator-instances/{id}/toggle` - Toggle instance
- `DELETE /api/administration/generator-instances/{id}` - Delete instance

For detailed API documentation, see `docs/ADMIN_PANEL_API.md`.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation
3. Check server logs
4. Contact system administrator

## Screenshots

All screenshots are located in the `docs/screenshots/` directory. To capture screenshots:

### Automated Capture

1. **Install Playwright** (if not already installed):
   ```bash
   npm install -D playwright
   npx playwright install chromium
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```

3. **Run the screenshot script**:
   ```bash
   node scripts/capture-screenshots.js
   ```

### Manual Capture

See [SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md) for detailed instructions on manually capturing screenshots.

### Screenshot Files

- `summary-stats.png` - Summary statistics overview (4 metric cards)
- `instance-cards.png` - Instance cards display with metrics
- `instance-actions.png` - Close-up showing available actions on instance cards
- `add-instance-dialog.png` - Add/Edit instance form dialog
- `metrics-chart.png` - Metrics history chart showing 24-hour data
- `job-history.png` - Job history table with completed jobs
- `ffmpeg-status.png` - FFMpeg worker status section

