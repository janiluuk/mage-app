import moment from 'moment';

export default class VideoJob {
  constructor(rawJob, findModelName) {
    this.id = rawJob.id;
    this.filename = rawJob.attributes.filename;
    this.original_filename = rawJob.attributes.original_filename;
    this.width = rawJob.attributes.width;
    this.height = rawJob.attributes.height;
    this.audio_codec = rawJob.attributes.audio_codec;
    this.bitrate = rawJob.attributes.bitrate;
    this.codec = rawJob.attributes.codec;
    this.size = rawJob.attributes.size;
    this.length = this.getFormattedDuration(rawJob.attributes.length);
    this.fps = rawJob.attributes.fps;
    this.frame_count = rawJob.attributes.frame_count;
    this.url = rawJob.attributes.url;
    this.preview_url = rawJob.attributes.preview_url;
    this.preview_img = rawJob.attributes.preview_img;
    this.seed = rawJob.attributes.seed;
    this.model_id = rawJob.attributes.model_id;
    this.model_name = findModelName(rawJob.attributes.model_id);
    this.denoising = rawJob.attributes.denoising;
    this.prompt = rawJob.attributes.prompt;
    this.negative_prompt = rawJob.attributes.negative_prompt;
    this.steps = rawJob.attributes.steps;
    this.status = rawJob.attributes.status;
    this.progress = rawJob.attributes.progress ? rawJob.attributes.progress : 0;
    this.job_time = this.getHumanizedDuration(rawJob.attributes.job_time);
    this.estimated_time_left = this.getHumanizedDuration(rawJob.attributes.estimated_time_left);
    this.created_at = rawJob.attributes.created_at;
    this.updated_at = rawJob.attributes.updated_at;    
  }

  getFormattedDuration(seconds) {
    if (!seconds) {
      seconds = 1;
    }
    let momentDuration = moment.duration(seconds, 'seconds');
    return moment.utc(momentDuration.as('milliseconds')).format('HH:mm:ss');
  }

  getHumanizedDuration(seconds) {
    if (!seconds) {
      seconds = 1;
    }
    return moment.duration({ "seconds": seconds }).humanize();
  }
}
