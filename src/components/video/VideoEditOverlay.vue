<template>
      <div class="startup-container">
        <div class="startup-row">
          <div class="item-container">
            <h4 class="text-center">All good! Now tell us how this video would look like</h4>
          </div>
          <div class="item-container">
            <div class="startup-main-prompt">
            <Textarea rows="2" autoResize placeholder="Type your idea here 💡💡💡"
                    v-model="job.prompt" :disabled="isVideoProcessing"></Textarea>
            </div>
            <div v-if="formChanged == true" class="text-center">
              <Button @click="$emit('overlay:active', false);" label="Done! Take me to next step"
                      class="p-button p-component p-button-lg p-button-rounded p-button-outlined p-button-primary mb-0 mt-3 mr-3" />
            </div>
          </div>
        </div>
        <div class="startup-row">
          <div class="item-container">
            <h6 class="text-center">Feeling lazy? Choose one of these ready-made prompts</h6>
          </div>
          <ScrollPanel horizontal class="horizontal-scrollpanel">
              <ul class="preset-prompt-list horizontal-scroll-list">
                  <li class="horizontal-scroll-item list-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                        high detail, fantasy, realistic, light effect, hyper detail, volumetric lighting, cinematic, macro, depth of field, blur, red light and clouds from the back, highly detailed epic cinematic concept art cg render made in maya, blender and photoshop, octane render
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </li>
                  <li class="horizontal-scroll-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                      volumetric lighting, cinematic, macro, depth of field, blur, red light and clouds from the back, highly detailed epic cinematic concept art cg render made in maya, blender and photoshop, octane render
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </li>
                  <li class="horizontal-scroll-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                      high detail, fantasy, realistic, light effect, hyper detail, volumetric lighting, cinematic, macro, epic cinematic concept art cg render made in maya, blender and photoshop, octane render
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </li>
                  <li class="horizontal-scroll-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                      high detail, red light and clouds from the back, highly detailed epic cinematic concept art cg render made in maya, blender and photoshop, octane render
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </li>
                  <li class="horizontal-scroll-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                      high detail, fantasy, realistic, light effect, hyper detail, blender and photoshop, octane render
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </li>
                  <li class="horizontal-scroll-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                      high detail, fantasy, realistic, light effect, hyper detail, volumetric lighting, cinematic, macro, depth of field, blur, red light and clouds from the back, blender and photoshop
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                      </div>
                  </li>
                  <li class="horizontal-scroll-item">
                    <div class="preset-prompt-item">
                      <div class="preset-prompt-body item-body">
                      light effect, hyper detail, volumetric lighting, cinematic, macro, red light and clouds from the back, highly detailed epic cinematic concept art cg render made in maya, blender and photoshop, octane render
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Continue with this <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </li>
                </ul>
          </ScrollPanel>
        </div>
        <div class="startup-row">
          <div class="item-container">
            <h6 class="text-center">Exclusive templates, including prompts and other parameters</h6>
          </div>
          <ScrollPanel horizontal class="horizontal-scrollpanel">
              <ul class="preset-prompt-list horizontal-scroll-list">
                <li class="horizontal-scroll-item list-item">
                  <div class="template-with-img">
                    <div class="template-body item-body">
                      <div class="text-xxl">Ghibi Studio style animation video</div>
                      <div class="text-sm text-light">Works best for portrait and family videos</div>
                    </div>
                    <div class="template-img" style="background-image: url('https://preview.redd.it/star-wars-in-studio-ghibli-style-by-ai-v0-n6ffuovav35a1.jpg?width=640&crop=smart&auto=webp&s=373a8a96b8acba01547bbd97dd348d3015ae6808');"></div>
                    <div class="preset-prompt-footer item-footer">
                      <div class="continue-tag">Use template <i class="pi pi-chevron-right"></i></div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="template-with-img">
                    <div class="template-body item-body">
                      <div class="text-xxl">Watercolor video</div>
                      <div class="text-sm text-light">Works best for landscape for portrait videos</div>
                    </div>
                    <div class="template-img" style="background-image: url('https://d2culxnxbccemt.cloudfront.net/craft/content/uploads/a/general/wp-content/uploads/2016/04/Step3.jpg');"></div>
                    <div class="preset-prompt-footer item-footer">
                      <div class="continue-tag">Use template <i class="pi pi-chevron-right"></i></div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="template-with-img">
                    <div class="template-body item-body">
                      <div class="text-xxl">Hand drawn video</div>
                      <div class="text-sm text-light">Works best for urban landscape, portrait and simple videos</div>
                    </div>
                    <div class="template-img" style="background-image: url('https://i.pinimg.com/736x/48/c6/7e/48c67e99880d282a37932046797f9696.jpg');"></div>
                    <div class="preset-prompt-footer item-footer">
                      <div class="continue-tag">Use template <i class="pi pi-chevron-right"></i></div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="template-with-img">
                    <div class="template-body item-body">
                      <div class="text-xxl">Cyberpunk animation video</div>
                      <div class="text-sm text-light">Works best for action videos</div>
                    </div>
                    <div class="template-img" style="background-image: url('https://i.redd.it/i-made-an-ai-model-that-can-generate-cyberpunk-anime-v0-x1zvm7qvlfw91.png?width=2048&format=png&auto=webp&s=5491ccfa28e005ff0eff79e275cb629a8d2bbfc5');"></div>
                    <div class="preset-prompt-footer item-footer">
                      <div class="continue-tag">Use template <i class="pi pi-chevron-right"></i></div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="template-with-img">
                    <div class="template-body item-body">
                      <div class="text-xxl">Horror animation video</div>
                      <div class="text-sm text-light">Works best for portrait and action videos</div>
                    </div>
                    <div class="template-img" style="background-image: url('https://img.freepik.com/premium-photo/childrens-scary-horror-dream-neural-network-ai-generated_76080-34903.jpg');"></div>
                    <div class="preset-prompt-footer item-footer">
                      <div class="continue-tag">Use template <i class="pi pi-chevron-right"></i></div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="template-with-img">
                    <div class="template-body item-body">
                      <div class="text-xxl">Pixar Studio style animation video</div>
                      <div class="text-sm text-light">Works best for portrait and family videos</div>
                    </div>
                    <div class="template-img" style="background-image: url('https://www.storypick.com/wp-content/uploads/2023/04/hp6.jpg');"></div>
                    <div class="preset-prompt-footer item-footer">
                      <div class="continue-tag">Use template <i class="pi pi-chevron-right"></i></div>
                    </div>
                  </div>
                </li>
              </ul>
          </ScrollPanel>
        </div>
        <div class="startup-row">
          <div class="item-container">
            <h6 class="text-center">Settings from previous projects</h6>
          </div>
          <ScrollPanel horizontal class="horizontal-scrollpanel">
              <ul class="preset-prompt-list horizontal-scroll-list">
                <li class="horizontal-scroll-item list-item">
                  <div class="pre-setting">
                    <div class="pre-setting-img" style="background-image: url('https://stablediffusion.fr/assets/prompt/stablediffusion_prompt_detailed_1boy_1chibi.webp');"></div>
                    <div class="pre-setting-body item-body">
                      <div>
                        <div class="pre-setting-row">
                          <b>Prompt: </b>
                          <span>masterpiece, best quality, bestquality,Amazing,beautiful detailed eyes,1boy,1chibi,bird wings,finely detail,Depth of field,extremelydetailed CG unity 8k wallpaper,masterpiece, full body,(vtuberminato aqua),green hair and black hair, blu overcoat, centre parting, art book, trees and sea in the back grand ,red eyes, smile, circular eyebrow,fox ears, I really want to stay at your house, Yoji Shinkawa
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Negative Prompt: </b>
                          <span>lowres, bad anatomy, bad hands, ...
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Parameters: </b>
                          <span>Steps: 46, Sampler: Euler a, CFG scale: 11, Seed: 3282961398
                          </span>
                        </div>
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Apply settings <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="pre-setting">
                    <div class="pre-setting-img" style="background-image: url('https://img.freepik.com/premium-photo/fictional-real-beautiful-african-woman-gold-black-colors-made-with-generative-ai_245726-3910.jpg');"></div>
                    <div class="pre-setting-body item-body">
                      <div>
                        <div class="pre-setting-row">
                          <b>Prompt: </b>
                          <span>aesthetic, very inspirational, world inside a glass sphere by james gurney by artgerm with james jean, joe fenton and tristan eaton by ross tran
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Negative Prompt: </b>
                          <span>un-detailed skin, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, ugly eyes, (out of frame:1.3), worst quality, low quality, jpeg artifacts, cgi, sketch, cartoon, drawing, (out of frame:1.1)un-detailed skin, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, ugly eyes, (out of frame:1.3), worst quality, low quality, jpeg artifacts, cgi, sketch, cartoon, drawing, (out of frame:1.1)
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Parameters: </b>
                          <span>Steps: 50, Sampler: Euler a, CFG scale: 7.0, Seed: 1579799523, Face restoration, Size: 512x512
                          </span>
                        </div>
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Apply settings <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="pre-setting">
                    <div class="pre-setting-img" style="background-image: url('https://stablediffusion.fr/assets/prompt/girl_blond_hair_black_glasses_background_by_greg_rutkowski_makoto_shinkai_kyoto_animation.webp');"></div>
                    <div class="pre-setting-body item-body">
                      <div>
                        <div class="pre-setting-row">
                          <b>Prompt: </b>
                          <span>cute girl, crop-top, blond hair, black glasses, stretching, with background by greg rutkowski makoto shinkai kyoto animation key art feminine mid shot
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Negative Prompt: </b>
                          <span>Deformed, blurry, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, blurry, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, ((((mutated hands and fingers)))), (((out of frame)))
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Parameters: </b>
                          <span>Steps: 30, Sampler: DDIM, CFG scale: 12.0, Seed: 123, Size: 512x512
                          </span>
                        </div>
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Apply settings <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="pre-setting">
                    <div class="pre-setting-img" style="background-image: url('https://stablediffusion.fr/assets/prompt/pope_francis_DJ_in_a_nightclub_mixing_live_on_stage_giant_mixing_table_masterpiece.webp');"></div>
                    <div class="pre-setting-body item-body">
                      <div>
                        <div class="pre-setting-row">
                          <b>Prompt: </b>
                          <span>(Pope Francis) wearing leather jacket is a DJ in a nightclub, mixing live on stage, giant mixing table, 4k resolution, a masterpiece
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Negative Prompt: </b>
                          <span>white robe, easynegative, bad-hands-5, grainy, low-res, extra limb, poorly drawn hands, missing limb, blurry, malformed hands, blur
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Parameters: </b>
                          <span>Steps: 40, Sampler: DDIM, CFG scale: 8.0, Seed: 1639299662, Face restoration, Size: 480x512
                          </span>
                        </div>
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Apply settings <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </div>
                </li>
                <li class="horizontal-scroll-item list-item">
                  <div class="pre-setting">
                    <div class="pre-setting-img" style="background-image: url('https://stablediffusion.fr/assets/prompt/Cute%20small%20cat%20sitting%20in%20a%20movie%20theater%20eating%20chicken%20wiggs%20watching%20a%20movie%20,unreal%20engine,%20cozy%20indoor%20lighting,%20artstation.webp');"></div>
                    <div class="pre-setting-body item-body">
                      <div>
                        <div class="pre-setting-row">
                          <b>Prompt: </b>
                          <span>Cute small cat sitting in a movie theater eating chicken wiggs watching a movie ,unreal engine, cozy indoor lighting, artstation, detailed, digital painting,cinematic,character design by mark ryden and pixar and hayao miyazaki, unreal 5, daz, hyperrealistic, octane render
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Negative Prompt: </b>
                          <span>ugly, ugly arms, ugly hands,ugly, ugly arms, ugly hands,
                          </span>
                        </div>
                        <div class="pre-setting-row">
                          <b>Parameters: </b>
                          <span>Steps: 25, Sampler: Euler a, CFG scale: 8.0, Seed: 3099373267, Size: 512x512
                          </span>
                        </div>
                      </div>
                      <div class="preset-prompt-footer item-footer">
                        <div class="continue-tag">Apply settings <i class="pi pi-chevron-right"></i></div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
          </ScrollPanel>
        </div>
      </div>
</template>
<script>


export default {
    name: "VideoEditOverlay",
    props: ['overlay-active','job'],
    emits: ['overlay:active'],

}
</script>

<style lang="scss">

.horizontal-scrollpanel {
  float: left;
  width: 100%;
}
.startup-overlay {
  backdrop-filter: blur(50px);
  background-color: rgba(8,20,38,1);
  background: rgba(6,22,47,0.4);
}

.p-sidebar .p-sidebar-content {
  padding-left: 0;
  padding-right: 0;
  padding-bottom: 50px;
}

.startup-container {
  width: 100%;
  float: left;
  padding-top: 10%;
  animation: startup-appear-animation 0.5s ease-in-out;
}

.startup-row {
  width: 100%;
  margin-bottom: 50px;
  float: left;
}

.item-container {
  width: 90vw;
  max-width: 1180px;
  margin: auto;
}

.startup-main-prompt textarea {
  width: 100%;
  font-size: 1.5rem;
  padding: 18px;
  border-radius: 18px;
  text-align: justify;
  -moz-text-align-last: center; /* Firefox 12+ */
  text-align-last: center;
}

.horizontal-scroll-list {
  list-style-type: none;
  white-space: nowrap;
  padding: 0 20px 10px 20px;
  margin: 0;
}

.preset-prompt-item, .template-with-img, .pre-setting {
  border: 1px solid #0b213f;
  margin-right: 20px;
  color: #eeeeee90;
  cursor: pointer;
  transition: border 0.2s linear, color 0.2s linear, height 0.2s linear;

  &:hover {
    border-color: #5dead4;
    color: #eee;
  }
}
.preset-prompt-item {
  width: 250px;
  white-space: normal;
  font-size: 1.2rem;
  border-radius: 12px;
  padding: 1rem;
  line-height: 1.3;
}

.template-with-img {
  font-size: 1.2rem;
  padding: 12px;
  border-radius: 12px;
}

.pre-setting {
  font-size: 0.9rem;
  line-height: 1.4;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-flow: row;
  column-gap: 20px;
  width: 600px;
  white-space: normal;
}

.horizontal-scroll-item {
  display: inline-flex;
}

.preset-prompt-footer {
  opacity: 0;
  padding-right: 10px;
  transition: opacity 0.15s linear, padding-right 0.2s linear;
  margin-top: 10px;

  .preset-prompt-item:hover &, .template-with-img:hover &, .pre-setting:hover & {
    opacity: 1;
  padding-right: 0px;
  }
}

.continue-tag {
  font-size: 0.9rem;
  line-height: 1;
  color: #5dead4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.template-img {
  width: 400px;
  height: 225px;
  background-size: cover;
  background-position: center;
  border-radius: 6px;
  margin-top: 12px;
}

.pre-setting-img {
  width: 150px;
  height: 150px;
  background-size: cover;
  background-position: center;
  border-radius: 6px;
}

.pre-setting-body {
  flex: 1;
}

.pre-setting-row {
  padding: 10px 0;
  border-bottom: 1px solid #0b213f;

  &:first-child {
    padding-top: 0;
  }
  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
}

.p-scrollpanel .p-scrollpanel-bar {
  background: #545c5e;
  transition: background 0.15s linear, box-shadow 0.15s linear, opacity 0.15s linear;
  height: 7px;
  border-radius: 2px;
  &:hover, &:active {
    background: #56d9f6;
  }
  &:focus {
    box-shadow: 0 0 0 1px #6f8388;
  }
}

</style>
