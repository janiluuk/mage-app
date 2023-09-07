<script>
import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
const PREVIEW_URL = process.env.VUE_APP_MODEL_PREVIEW_URL;

export default {
  name: 'ModelfileSelector',
  props: ['model_id', 'model_name'],
  data() {
    return {
      model_id: 0,
      model_name: '',
      isVideoProcessing: false,
      modelFileData: {},
    };
  },
  watch: {
    modelFiles: {
      handler: function (v, o) {
       var name = _.filter(v, function(val) {
        if (this.model_id == val.id) {
          this.model_name = val.name;
          return val;
        }
       }.bind(this));
       this.model_name = name[0]?.name;
       this.$emit('update:modelName', this.model_name);
      }
    }
  },
  created() {
    this.model_id = this.$props.modelId;

    this.fetchModelFiles();
  },
  mounted() {
    this.model_id = this.$props.modelId;

  },
  computed: {
    ...mapGetters('modelfiles', {
      modelFiles: 'list',
      findModelName: 'findModelName',
      previewUrl: 'getModelPreviewUrl',
    }),
  },
  methods: {
    ...mapActions('modelfiles', ['fetchModelFiles']),
    getCarouselData() {
      return _.map(this.modelFiles, function (val) {
        if (val.previewUrl == null) {
          val.previewUrl = 'default.png';
        }
        return { data: val };
      });
    },
    modelSelected(id) {
      this.model_id = id;
      this.model_name = this.findModelName(id);
      this.$emit('update:modelId', this.model_id);
      this.$emit('update:modelName', this.model_name);

    },
  },
};
</script>

<script setup  crossorigin="anonymous">
import { ref } from 'vue';

const props = defineProps({
  carouselItems: Array,
  modelId: Number,
});

const carouselResponsiveOptions = ref([
  {
    breakpoint: '1024px',
    numVisible: 3,
    numScroll: 3,
  },
  {
    breakpoint: '768px',
    numVisible: 2,
    numScroll: 2,
  },
  {
    breakpoint: '560px',
    numVisible: 1,
    numScroll: 1,
  },
]);
</script>

<template>
  <ScrollPanel horizontal class="horizontal-scrollpanel">
  <div class="model-selector">
    <div v-for="modelFile in modelFiles">
      <div
        class="modelfile-item"
        :class="{ selected: modelFile.id == this.model_id }"
        @click="modelSelected(modelFile.id)"
      >
        <div class="modelfile-item-content">
          <div class="model-image-container">
            <div  crossorigin="anonymous"
              class="model-image"
              :style="{
                'background-image': 'url(' + PREVIEW_URL + modelFile.previewUrl,
                cursor: 'pointer',
              }"
            >
            </div>
          </div>
          <div>
            <div class="mt-2 model-name">
              {{ modelFile.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </ScrollPanel>
</template>

<style lang="scss"  crossorigin="anonymous">
@import '@/assets/vimage.scss';
.model-selector-container {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: $border-radius;
  overflow-x: scroll;
}

.model-selector {
  display: flex;
  flex-flow: row;
  width: max-content;
  margin: auto;
}

.modelfile-item {
  background-position: center;
  cursor: pointer;
  padding: 1px;
  margin: 0.5rem;
  border-radius: $border-radius;
  transition: background 0.15s ease-in-out;

  &:hover {
    background: rgba(#eee, 0.1);
    .model-name {
      opacity: 1;
    }
  }
  &.selected {
    @include bg-gradient-vibrant();
    border: none;

    .model-name {
      opacity: 1;
    }
    .modelfile-item-content {
      background: rgba(0, 0, 0, 0.8);
    }
  }
}

.modelfile-item-content {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 2px 2px 0.5rem 2px;
  border-radius: $border-radius;
}

.model-image-container {
  background: transparent;
  border-radius: 100%;
}

.model-image {
  width: 8rem;
  height: 8rem;
  background-position: center;
  background-size: cover;
  border-radius: $border-radius - 2px;
  border: 1px solid var(--surface-card);
}

.model-name {
  font-weight: 700;
  opacity: 0.5;
  width: 100%;
  text-align: center;
  white-space: normal;
  word-break: normal;
  transition: opacity 0.15s ease-in-out;
}
</style>
