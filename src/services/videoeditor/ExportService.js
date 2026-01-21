/**
 * ExportService - Handles video export using FFmpeg
 * Adapted from movie-maker's ffmpeg-module.js
 */

import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import FileService from '@/services/file.service';
import VideoJobsService from '@/services/videojobs.service';
import requestService from '@/services/request-service/ApiRequestService';
import { API_V1_BASE_URL } from '@/utils/api-base-urls';

// Maximum video size (in MB) for client-side processing
const CLIENT_SIDE_MAX_SIZE_MB = 100; // 100MB limit for client-side processing
const CLIENT_SIDE_MAX_DURATION_SECONDS = 300; // 5 minutes max for client-side

class ExportService {
  constructor() {
    this.ffmpeg = null;
    this.ffmpegLoaded = false;
    this.ffmpegLoading = false;
  }

  /**
   * Check if video should be processed client-side or server-side
   * @param {Array} videoFiles - Array of VideoFileAdapter instances
   * @returns {Object} { useClientSide: boolean, reason: string }
   */
  shouldUseClientSide(videoFiles) {
    if (!videoFiles || videoFiles.length === 0) {
      return { useClientSide: false, reason: 'No video files' };
    }

    // Calculate total size and duration
    let totalSize = 0;
    let totalDuration = 0;

    videoFiles.forEach(video => {
      // Estimate size from duration and bitrate (rough estimate)
      const estimatedBitrate = video.bitrate || 5000000; // 5 Mbps default
      const duration = video.duration || 0;
      const estimatedSize = (estimatedBitrate * duration) / 8; // bytes
      totalSize += estimatedSize;
      totalDuration += duration;
    });

    const totalSizeMB = totalSize / (1024 * 1024);

    // Use client-side for small videos
    if (totalSizeMB <= CLIENT_SIDE_MAX_SIZE_MB && totalDuration <= CLIENT_SIDE_MAX_DURATION_SECONDS) {
      return { 
        useClientSide: true, 
        reason: `Video is small enough (${totalSizeMB.toFixed(1)}MB, ${totalDuration.toFixed(1)}s) for client-side processing` 
      };
    }

    return { 
      useClientSide: false, 
      reason: `Video is too large (${totalSizeMB.toFixed(1)}MB, ${totalDuration.toFixed(1)}s) - using server-side processing` 
    };
  }

  /**
   * Load FFmpeg for client-side processing
   * @returns {Promise} FFmpeg instance
   */
  async loadFFmpeg() {
    if (this.ffmpegLoaded && this.ffmpeg) {
      return this.ffmpeg;
    }

    if (this.ffmpegLoading) {
      // Wait for existing load to complete
      while (this.ffmpegLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.ffmpeg;
    }

    this.ffmpegLoading = true;

    try {
      this.ffmpeg = new FFmpeg();
      
      // Set up logging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      // Load FFmpeg core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/esm';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.ffmpegLoaded = true;
      this.ffmpegLoading = false;
      
      return this.ffmpeg;
    } catch (error) {
      this.ffmpegLoading = false;
      console.error('Failed to load FFmpeg:', error);
      throw new Error(`Failed to load FFmpeg: ${error.message}`);
    }
  }
  /**
   * Build complex filter graph for FFmpeg
   * @param {Array} timeline - Array of VideoFragmentAdapter instances
   * @param {Array} videoFiles - Array of VideoFileAdapter instances
   * @param {Object} exportOptions - Export configuration
   * @returns {Array} [filterGraph, outputs] - Filter graph and output streams
   */
  buildFilterGraph(timeline, videoFiles, exportOptions = {}) {
    const parseFilter = (subFilters) => {
      return subFilters.map(sf => {
        if (Array.isArray(sf)) {
          return `${sf[0]}=${sf[1]}`;
        }
        return sf;
      }).join(',');
    };

    const filter = [];
    
    // Calculate earliest start time for each video
    const earliestStarts = new Map();
    videoFiles.forEach(video => {
      const fragments = timeline.filter(f => f.video === video);
      if (fragments.length > 0) {
        const maxStart = Math.max(...fragments.map(f => f.start));
        earliestStarts.set(video, video.duration * maxStart);
      } else {
        earliestStarts.set(video, 0);
      }
    });

    // Process each fragment
    for (let i = 0; i < timeline.length; i++) {
      const fragment = timeline[i];
      const videoIndex = videoFiles.indexOf(fragment.video);
      const earliestStart = earliestStarts.get(fragment.video);
      const start = fragment.start * fragment.video.duration - earliestStart;
      const end = fragment.end * fragment.video.duration - earliestStart;

      // Video filters
      filter.push({
        filter: parseFilter([
          ['trim', `start=${start}:end=${end}`],
          ['setpts', `${1 / fragment.playbackRate}*(PTS-STARTPTS)`],
        ]),
        inputs: `[${videoIndex}:v]`,
        outputs: `v${i}`,
      });

      // Audio filters
      if (!fragment.video.hasAudio) {
        const duration = (end - start) / fragment.playbackRate;
        filter.push({
          filter: 'aevalsrc',
          options: { exprs: '0', duration },
          outputs: `a${i}`,
        });
      } else {
        // Calculate tempo commands for playback rate
        const tempoCommands = [];
        let playbackRate = fragment.playbackRate;
        const minTempo = 0.5;
        
        while (true) {
          if (playbackRate < minTempo) {
            tempoCommands.push(['atempo', '0.5']);
            playbackRate *= 2;
          } else {
            tempoCommands.push(['atempo', `${playbackRate}`]);
            break;
          }
        }

        filter.push({
          filter: parseFilter([
            ['atrim', `start=${start}:end=${end}`],
            ['asetpts', 'PTS-STARTPTS'],
            ...tempoCommands,
            ['volume', `${fragment.volume}`],
          ]),
          inputs: `[${videoIndex}:a]`,
          outputs: `a${i}`,
        });
      }
    }

    // Concatenate all fragments
    const concatInputs = timeline.flatMap((f, i) => [`v${i}`, `a${i}`]);
    filter.push({
      filter: 'concat',
      options: `n=${timeline.length}:a=1`,
      inputs: concatInputs,
      outputs: ['out', 'outa'],
    });

    // Apply custom resolution if specified
    if (exportOptions.customResolution && exportOptions.width && exportOptions.height) {
      filter.push({
        inputs: 'out',
        filter: 'scale',
        options: {
          w: exportOptions.width,
          h: exportOptions.height,
          flags: 'bicubic',
        },
        outputs: 'out',
      });
    }

    // Apply FPS changes
    if (exportOptions.fps) {
      if (exportOptions.interpolate) {
        filter.push({
          inputs: 'out',
          filter: 'minterpolate',
          options: {
            fps: `${exportOptions.fps}`,
          },
          outputs: 'out',
        });
      } else {
        filter.push({
          inputs: 'out',
          filter: 'fps',
          options: `${exportOptions.fps}`,
          outputs: 'out',
        });
      }
    }

    // Apply custom filters
    const outputs = new Set(['out', 'outa']);
    if (exportOptions.filters && Array.isArray(exportOptions.filters)) {
      exportOptions.filters.forEach(f => {
        if (f.input === 'audio' && f.output === 'video') {
          filter.push({
            inputs: 'out',
            filter: 'nullsink',
          });
          outputs.delete('outa');
        } else if (f.input === 'video' && f.output === 'audio') {
          outputs.delete('out');
          filter.push({
            inputs: 'outa',
            filter: 'nullsink',
          });
        }
        
        const inputStream = `out${f.input === 'audio' ? 'a' : ''}`;
        const outputStream = `out${f.output === 'audio' ? 'a' : ''}`;
        
        filter.push({
          inputs: inputStream,
          filter: f.name,
          options: f.options || '',
          outputs: outputStream,
        });
      });
    }

    return [filter, Array.from(outputs)];
  }

  /**
   * Convert filter graph to FFmpeg command arguments
   * @param {Array} filterGraph - Filter graph array
   * @returns {Array} FFmpeg filter arguments
   */
  filterGraphToFFmpegArgs(filterGraph) {
    const args = [];
    
    filterGraph.forEach(filter => {
      let filterStr = '';
      
      if (filter.inputs) {
        if (Array.isArray(filter.inputs)) {
          filterStr = filter.inputs.map(inp => `[${inp}]`).join('');
        } else {
          filterStr = `[${filter.inputs}]`;
        }
      }
      
      filterStr += filter.filter;
      
      if (filter.options) {
        if (typeof filter.options === 'string') {
          filterStr += `=${filter.options}`;
        } else if (typeof filter.options === 'object') {
          const opts = Object.entries(filter.options)
            .map(([key, value]) => `${key}=${value}`)
            .join(':');
          filterStr += `=${opts}`;
        }
      }
      
      if (filter.outputs) {
        if (Array.isArray(filter.outputs)) {
          filterStr += filter.outputs.map(out => `[${out}]`).join('');
        } else {
          filterStr += `[${filter.outputs}]`;
        }
      }
      
      args.push('-filter_complex', filterStr);
    });
    
    return args;
  }

  /**
   * Export video using backend FFmpeg workers or client-side fallback
   * @param {Object} params - Export parameters
   * @param {Function} onProgress - Progress callback
   * @param {Function} onOutput - Output log callback
   * @param {boolean} forceClientSide - Force client-side processing
   * @returns {Promise} Export result
   */
  async exportVideo(params, onProgress, onOutput, forceClientSide = false) {
    const {
      timeline,
      videoFiles,
      exportOptions,
      outputName = 'exported-video.mp4',
    } = params;

    if (!timeline || timeline.length === 0) {
      throw new Error('No fragments in timeline to export');
    }

    // Check if we should use client-side processing
    const sizeCheck = this.shouldUseClientSide(videoFiles);
    const useClientSide = forceClientSide || sizeCheck.useClientSide;

    if (onOutput) {
      onOutput(`Processing method: ${useClientSide ? 'Client-side' : 'Server-side'} (${sizeCheck.reason})`);
    }

    // Try backend first, fallback to client-side if it fails
    if (!useClientSide) {
      try {
        return await this.exportVideoServerSide(params, onProgress, onOutput);
      } catch (error) {
        console.warn('Server-side export failed, falling back to client-side:', error);
        if (onOutput) {
          onOutput(`Server-side export failed: ${error.message}. Falling back to client-side processing...`);
        }
        // Fall through to client-side processing
      }
    }

    // Use client-side FFmpeg
    return await this.exportVideoClientSide(params, onProgress, onOutput);
  }

  /**
   * Export video using backend FFmpeg workers
   * @param {Object} params - Export parameters
   * @param {Function} onProgress - Progress callback
   * @param {Function} onOutput - Output log callback
   * @returns {Promise} Export result
   */
  async exportVideoServerSide(params, onProgress, onOutput) {
    const {
      timeline,
      videoFiles,
      exportOptions,
      outputName = 'exported-video.mp4',
    } = params;

    // Build filter graph
    const [filterGraph, outputs] = this.buildFilterGraph(timeline, videoFiles, exportOptions);
    
    // Prepare fragments data for backend
    const fragments = timeline.map(fragment => ({
      videoId: fragment.video.videoData?.id || fragment.video.videoData?.attributes?.id,
      videoUrl: fragment.video.videoUrl,
      start: fragment.start,
      end: fragment.end,
      playbackRate: fragment.playbackRate,
      volume: fragment.volume,
      hasAudio: fragment.video.hasAudio,
    }));

    // Prepare input files
    const inputFiles = videoFiles.map((video, index) => ({
      url: video.videoUrl,
      index: index,
      id: video.videoData?.id || video.videoData?.attributes?.id,
    }));

    // Submit export job to backend
    const jobResponse = await this.submitExportJob({
      fragments,
      inputFiles,
      filterGraph,
      outputs,
      exportOptions: {
        fps: exportOptions.fps || null,
        bitrate: exportOptions.bitrate || null,
        width: exportOptions.width || null,
        height: exportOptions.height || null,
        customResolution: exportOptions.customResolution || false,
        interpolate: exportOptions.interpolate || false,
      },
      outputName,
    });

    // Extract job ID from response (handle JSON:API format)
    const jobId = jobResponse.data?.data?.id || jobResponse.data?.id || jobResponse.id;
    
    if (!jobId) {
      throw new Error('Failed to get job ID from export job submission');
    }

    // Monitor progress
    const result = await this.monitorExportProgress(jobId, onProgress, onOutput);
    
    return result;
  }

  /**
   * Export video using client-side FFmpeg
   * @param {Object} params - Export parameters
   * @param {Function} onProgress - Progress callback
   * @param {Function} onOutput - Output log callback
   * @returns {Promise} Export result
   */
  async exportVideoClientSide(params, onProgress, onOutput) {
    const {
      timeline,
      videoFiles,
      exportOptions,
      outputName = 'exported-video.mp4',
    } = params;

    if (onOutput) {
      onOutput('Loading FFmpeg...');
    }

    // Load FFmpeg if not already loaded
    const ffmpeg = await this.loadFFmpeg();

    if (onOutput) {
      onOutput('FFmpeg loaded. Downloading video files...');
    }

    try {
      // Download all video files
      const inputFiles = [];
      for (let i = 0; i < videoFiles.length; i++) {
        const video = videoFiles[i];
        if (onOutput) {
          onOutput(`Downloading input ${i + 1}/${videoFiles.length}: ${video.fileName}...`);
        }
        
        const videoData = await fetchFile(video.videoUrl);
        const inputFileName = `input${i}.mp4`;
        await ffmpeg.writeFile(inputFileName, videoData);
        inputFiles.push(inputFileName);
        
        if (onProgress) {
          onProgress({
            percent: (i + 1) / (videoFiles.length + 1) * 0.1, // 10% for downloading
            timemark: this.formatTime(0),
          });
        }
      }

      if (onOutput) {
        onOutput('Building filter graph...');
      }

      // Build filter graph
      const [filterGraph, outputs] = this.buildFilterGraph(timeline, videoFiles, exportOptions);
      
      // Convert filter graph to FFmpeg command
      const filterArgs = this.filterGraphToFFmpegArgs(filterGraph);
      
      // Build FFmpeg command
      const outputFileName = outputName || 'output.mp4';
      const ffmpegArgs = [
        ...inputFiles.flatMap(file => ['-i', file]),
        ...filterArgs,
        '-map', '[out]',
      ];

      // Add audio mapping if available
      if (outputs.includes('outa')) {
        ffmpegArgs.push('-map', '[outa]');
      }

      // Add output options
      if (exportOptions.bitrate) {
        ffmpegArgs.push('-b:v', `${exportOptions.bitrate}M`);
      }
      if (exportOptions.fps) {
        ffmpegArgs.push('-r', `${exportOptions.fps}`);
      }

      ffmpegArgs.push('-y', outputFileName);

      if (onOutput) {
        onOutput(`Running FFmpeg: ${ffmpegArgs.join(' ')}`);
      }

      // Set up progress monitoring
      let lastProgress = 0;
      ffmpeg.on('progress', ({ progress, time }) => {
        if (onProgress) {
          const percent = Math.min(progress || 0, 1);
          onProgress({
            percent: 0.1 + (percent * 0.9), // 10% for download, 90% for encoding
            timemark: time || this.formatTime(0),
          });
          lastProgress = percent;
        }
      });

      // Execute FFmpeg
      await ffmpeg.exec(ffmpegArgs);

      if (onOutput) {
        onOutput('Encoding complete. Reading output file...');
      }

      // Read output file
      const outputData = await ffmpeg.readFile(outputFileName);
      const outputBlob = new Blob([outputData], { type: 'video/mp4' });

      // Clean up
      for (const file of inputFiles) {
        await ffmpeg.deleteFile(file);
      }
      await ffmpeg.deleteFile(outputFileName);

      if (onProgress) {
        onProgress({
          percent: 1,
          timemark: this.formatTime(100),
        });
      }

      if (onOutput) {
        onOutput('Export complete!');
      }

      // Create download URL
      const outputUrl = URL.createObjectURL(outputBlob);

      return {
        success: true,
        fileUrl: outputUrl,
        blob: outputBlob,
        fileName: outputFileName,
      };
    } catch (error) {
      console.error('Client-side export failed:', error);
      if (onOutput) {
        onOutput(`Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Submit export job to backend API
   * @param {Object} jobData - Export job data
   * @returns {Promise} Job submission response
   */
  async submitExportJob(jobData) {
    try {
      const response = await requestService.post(
        '/video-export',
        jobData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
        true // requiresAuth
      );
      
      return response;
    } catch (error) {
      console.error('Failed to submit export job:', error);
      throw new Error(`Failed to submit export job: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Monitor export job progress using SSE or polling
   * @param {string} jobId - Export job ID
   * @param {Function} onProgress - Progress callback
   * @param {Function} onOutput - Output log callback
   * @param {boolean} useSSE - Use Server-Sent Events for real-time updates
   * @returns {Promise} Export result
   */
  async monitorExportProgress(jobId, onProgress, onOutput, useSSE = false) {
    if (useSSE && typeof EventSource !== 'undefined') {
      return this.monitorExportProgressSSE(jobId, onProgress, onOutput);
    }
    
    // Fallback to polling
    return this.monitorExportProgressPolling(jobId, onProgress, onOutput);
  }

  /**
   * Monitor export job progress using Server-Sent Events (SSE)
   * @param {string} jobId - Export job ID
   * @param {Function} onProgress - Progress callback
   * @param {Function} onOutput - Output log callback
   * @returns {Promise} Export result
   */
  async monitorExportProgressSSE(jobId, onProgress, onOutput) {
    return new Promise(async (resolve, reject) => {
      const { API_V1_BASE_URL } = await import('@/utils/api-base-urls');
      const AuthService = (await import('@/services/auth/AuthService')).default;
      const token = AuthService.getToken();
      
      const url = `${API_V1_BASE_URL}/video-export/${jobId}/stream`;
      const eventSource = new EventSource(`${url}?token=${token}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Report progress
          if (onProgress && data.progress !== undefined) {
            const progressValue = typeof data.progress === 'number' ? data.progress / 100 : parseFloat(data.progress) / 100 || 0;
            onProgress({
              percent: progressValue,
              timemark: data.timemark || this.formatTime(progressValue * 100),
            });
          }
          
          // Report output logs
          if (onOutput && data.output_log && Array.isArray(data.output_log)) {
            data.output_log.forEach(line => {
              if (typeof line === 'string') {
                onOutput(line);
              }
            });
          }
          
          // Check job status
          if (data.status === 'completed' || data.status === 'success') {
            eventSource.close();
            resolve({
              jobId,
              fileUrl: data.output_url,
              success: true,
            });
          } else if (data.status === 'failed' || data.status === 'error') {
            eventSource.close();
            reject(new Error(data.error || 'Export failed on server.'));
          } else if (data.status === 'cancelled') {
            eventSource.close();
            reject(new Error('Export job was cancelled.'));
          } else if (data.status === 'timeout') {
            eventSource.close();
            reject(new Error('Export progress stream timed out.'));
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        eventSource.close();
        reject(new Error('SSE connection error: ' + (error.message || 'Connection failed')));
      };
    });
  }

  /**
   * Monitor export job progress using polling (fallback)
   * @param {string} jobId - Export job ID
   * @param {Function} onProgress - Progress callback
   * @param {Function} onOutput - Output log callback
   * @returns {Promise} Export result
   */
  async monitorExportProgressPolling(jobId, onProgress, onOutput) {
    return new Promise((resolve, reject) => {
      let pollInterval;
      let lastProgress = 0;
      
      const poll = async () => {
        try {
             const response = await requestService.get(
               `/video-export/${jobId}`,
               {},
               {
                 headers: {
                   'Accept': 'application/json',
                 },
               },
               true // requiresAuth
             );
             
             // Handle JSON:API format or direct response
             const jobData = response.data?.data?.attributes || response.data?.data || response.data;
             const status = jobData.status || jobData.attributes?.status;
             const progress = jobData.progress || jobData.attributes?.progress || 0;
             const error = jobData.error || jobData.attributes?.error;
             const output = jobData.output || jobData.attributes?.output || [];
             const fileUrl = jobData.fileUrl || jobData.file_url || jobData.attributes?.fileUrl || jobData.attributes?.file_url;

                 // Report progress
                 const progressValue = typeof progress === 'number' ? progress / 100 : progress;
                 if (onProgress && progressValue > lastProgress) {
                   onProgress({
                     percent: progressValue,
                     timemark: jobData.timemark || jobData.attributes?.timemark || this.formatTime(progressValue * 100),
                   });
                   lastProgress = progressValue;
                 }
                 
                 // Report output logs
                 if (onOutput && Array.isArray(output) && output.length > 0) {
                   output.forEach(line => {
                     if (typeof line === 'string') {
                       onOutput(line);
                     }
                   });
                 }

          // Check job status
          if (status === 'completed' || status === 'success') {
            clearInterval(pollInterval);
            resolve({
              jobId,
              fileUrl: fileUrl || jobData.output_url || jobData.attributes?.output_url,
              success: true,
            });
          } else if (status === 'failed' || status === 'error') {
            clearInterval(pollInterval);
            reject(new Error(error || 'Export job failed'));
          } else if (status === 'cancelled') {
            clearInterval(pollInterval);
            reject(new Error('Export job was cancelled'));
          }
          // Otherwise, continue polling
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      };

      // Start polling immediately, then every second
      poll();
      pollInterval = setInterval(poll, 1000);
    });
  }

  /**
   * Cancel export job
   * @param {string} jobId - Export job ID
   * @returns {Promise} Cancellation result
   */
  async cancelExportJob(jobId) {
    try {
      const response = await requestService.delete(
        `/video-export/${jobId}`,
        {},
        {},
        true // requiresAuth
      );
      
      return response;
    } catch (error) {
      console.error('Failed to cancel export job:', error);
      throw new Error(`Failed to cancel export job: ${error.message || 'Unknown error'}`);
    }
  }


  /**
   * Format time in HH:MM:SS.mmm format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
  }

  /**
   * Upload exported video to mage-app API
   * @param {File|Blob} videoFile - Exported video file
   * @param {string} fileName - Name for the uploaded file
   * @param {Function} onProgress - Upload progress callback
   * @returns {Promise} Upload result
   */
  async uploadExportedVideo(videoFile, fileName, onProgress) {
    try {
      // Use FileService to upload
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('type', 'video');
      
      // Upload exported video to file service
      const response = await FileService.create({
        file: videoFile,
        meta: {
          name: fileName,
          type: 'video',
        },
      });
      
      return response;
    } catch (error) {
      console.error('Failed to upload exported video:', error);
      throw error;
    }
  }
}

export default new ExportService();

