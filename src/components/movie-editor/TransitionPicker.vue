<template>
  <div class="transition-picker" @click="showPanel = true">
    <div class="transition-icon" :class="'trans-' + modelValue.type">
      <i :class="transitionIcon" />
    </div>
    <OverlayPanel ref="op" appendTo="body" class="transition-panel">
      <div class="flex flex-column gap-2" style="width: 220px;">
        <div class="font-semibold text-sm mb-1">Transition</div>
        <div
          v-for="opt in transitionTypes"
          :key="opt.value"
          class="transition-option flex align-items-center gap-2 p-2 border-round cursor-pointer"
          :class="{ 'transition-option--active': modelValue.type === opt.value }"
          @click="selectType(opt.value)"
        >
          <i :class="opt.icon" class="text-lg" />
          <span class="text-sm">{{ opt.label }}</span>
        </div>
        <Divider class="my-1" />
        <div class="flex align-items-center gap-2">
          <label class="text-xs font-semibold">Duration</label>
          <InputNumber
            :modelValue="modelValue.duration"
            @update:modelValue="updateDuration"
            :min="0.1"
            :max="5"
            :step="0.1"
            suffix="s"
            :minFractionDigits="1"
            class="w-full"
          />
        </div>
      </div>
    </OverlayPanel>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import OverlayPanel from 'primevue/overlaypanel';
import Divider from 'primevue/divider';
import InputNumber from 'primevue/inputnumber';

export default {
  name: 'TransitionPicker',
  components: { OverlayPanel, Divider, InputNumber },
  props: {
    modelValue: {
      type: Object,
      default: () => ({ type: 'cut', duration: 0.5 }),
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const op = ref(null);
    const showPanel = ref(false);

    const transitionTypes = [
      { value: 'cut', label: 'Cut', icon: 'pi pi-minus' },
      { value: 'crossfade', label: 'Crossfade', icon: 'pi pi-sun' },
      { value: 'fade-black', label: 'Fade to Black', icon: 'pi pi-moon' },
      { value: 'wipe-left', label: 'Wipe Left', icon: 'pi pi-arrow-left' },
      { value: 'wipe-right', label: 'Wipe Right', icon: 'pi pi-arrow-right' },
      { value: 'dissolve', label: 'Dissolve', icon: 'pi pi-sparkles' },
    ];

    const transitionIcon = computed(() => {
      const found = transitionTypes.find((t) => t.value === props.modelValue.type);
      return found ? found.icon : 'pi pi-minus';
    });

    function selectType(type) {
      emit('update:modelValue', { ...props.modelValue, type });
    }

    function updateDuration(duration) {
      emit('update:modelValue', { ...props.modelValue, duration });
    }

    return {
      op,
      showPanel,
      transitionTypes,
      transitionIcon,
      selectType,
      updateDuration,
    };
  },
  watch: {
    showPanel(val) {
      if (val && this.$refs.op) {
        this.$refs.op.toggle(event);
      }
    },
  },
};
</script>

<style scoped>
.transition-picker {
  cursor: pointer;
  display: inline-flex;
}

.transition-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: background 0.2s;
}

.transition-icon:hover {
  background: var(--primary-100);
}

.trans-crossfade { background: var(--yellow-100); }
.trans-fade-black { background: var(--surface-400); color: white; }
.trans-wipe-left,
.trans-wipe-right { background: var(--blue-100); }
.trans-dissolve { background: var(--purple-100); }

.transition-option {
  transition: background 0.15s;
}
.transition-option:hover {
  background: var(--surface-hover);
}
.transition-option--active {
  background: var(--primary-100);
  color: var(--primary-700);
}
</style>

