<template>
<div>  
    <div class="col-12 md:col-4">


      <h5>Config generation</h5>
      <div class="row justify-between">
        <p>
          The code below automatically reflects your changes. You can copy/paste
          it in your favorite Deforum tool.
        </p>
        <div class="">
          <!-- Download json button -->
          <Button class="mr-5" @click="downloadJson">Download json</Button>
          <Button class="p-button-warning" @click="copyCode">Copy code</Button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="w-100 flex justify-center">
        <Textarea
          class="border rounded-md px-2 py-1 w-full font-mono"
          :value="code"
          :autoResize="true"
          rows="20"
          readonly
        >
        </Textarea>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { generateConfig } from "@/components/Deforum/services/configGenerator";

export default {
  components: {
  },
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  computed: {
    code() {
      return String(generateConfig(this.config));
    }
  },
  methods: {
    copyCode() {
      navigator.clipboard.writeText(this.code);
    },
    downloadJson() {
      const element = document.createElement("a");
      const file = new Blob([this.code], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      const fileName = this.config.batch_name.replace(/\s/g, "-").toLowerCase();
      element.download = `${fileName}.json`;
      element.click();
    }
  }
};
</script>
