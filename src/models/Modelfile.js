
export default class Modelfile {
        constructor() {
          this.id = null;
          this.filename = '';
          this.name = '';
          this.description = '';
          this.version = '';
          this.enabled = false;
          this.model_type = '';
          this.sample_prompts = [{prompt: '', negative_prompt: '', image_url: ''}];
          this.source_id = null;
          this.nsfw = false;
          this.created_at = null;
          this.updated_at = null;
        }
}
