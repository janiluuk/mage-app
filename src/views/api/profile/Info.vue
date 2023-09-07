<script setup>
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const onUpload = () => {
  toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
};
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div class="row mt-4 overflow-hidden">
          <div>
            <material-avatar :img="getImage" shadow="regular" class="img-fluid w-20 mt-7" :fixedSize="true">
            </material-avatar>
          </div>
          <div class="mt-1  mb-2" v-show="!file">


            <FileUpload mode="basic" :auto="true" name="imageInput[]" accept="image/*" :maxFileSize="1000000"
               @uploader="onFileChange" customUpload />
          </div>

          <div v-show="file">
            <Button label="Remove" class="p-button-text mr-2 mb-2" @click.prevent="onFileRemove" />
            <material-button size="sm" type="button">
              <label for="imageInput" class="mb-0 text-white small cursor-pointer">Change</label>
              <input id="imageInput" type="file" style="display: none;" accept="image/*" @change.prevent="onFileChange">
            </material-button>
          </div>

        </div>


        <div class="row mt-5">

          <material-input id="name" label="Name" variant="static" v-model:value="user.name" name="name" />
          <validation-error :errors="apiValidationErrors.name" />

        </div>

        <div class="row mt-5">
          <material-input id="email" type="email" label="Email Address" variant="static" v-model:value="user.email"
            name="email" />

          <validation-error :errors="apiValidationErrors.email" />
        </div>

        <div class="button-row d-flex mt-4">
          <material-button type="button" color="dark" variant="gradient" class="ms-auto mb-0 js-btn-next"
            @click="handleSubmit">Submit Changes</material-button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import MaterialInput from "@/components/material/MaterialInput.vue";
import MaterialButton from "@/components/material/MaterialButton.vue";
import MaterialAvatar from "@/components/material/MaterialAvatar.vue";
import ValidationError from "@/components/ValidationError.vue";
import formMixin from "@/mixins/formMixin.js";
import showSwal from "@/mixins/showSwal.js";
import _ from "lodash"

export default {
  name: "Info",
  components: {
    MaterialInput,
    MaterialButton,
    MaterialAvatar,
    ValidationError,
  },
  data() {
    return {
      user: {},
      file: null,
      imgSource: '/assets/img/placeholder.jpg',
      loading: null,
    }
  },
  mixins: [formMixin],
  computed: {
    getImage() {
      if (!this.user.profile_image || this.loading) return "/assets/img/placeholder.jpg";
      else { return this.user.profile_image }
    }
  },
  async mounted() {
    this.loading = true
    try {
      await this.$store.dispatch("profile/getProfile")
      this.user = _.omit(this.$store.getters['profile/getUserProfile'], 'links');
    } catch (error) {
      showSwal.methods.showSwal({
        type: "error",
        message: "Oops, something went wrong!",
        width: 500
      });
    } finally {
      this.loading = false
      this.initialImageUrl = this.getImage;
    }
    this.loading = false
  },
  methods: {
    onFileChange(event) {
      this.file = event.files[0];
      this.user.profile_image = URL.createObjectURL(this.file);
    },
    onFileRemove() {
      this.file = null
      this.user.profile_image = this.initialImageUrl;
    },
    async handleSubmit() {
      if (this.user.id <= 3 && (process.env.VUE_APP_IS_DEMO ?? 1) == 1) {
        showSwal.methods.showSwal({
          type: "error",
          message: "You are not allowed to change data of default users.",
          width: 500
        });
      } else {
        this.resetApiValidation();

        try {
          if (this.file !== null) {
            await this.$store.dispatch("profile/uploadPic", this.file)
            this.user.profile_image = this.$store.getters['profile/getUserProfileImage']
            this.file = null
          }

          await this.$store.dispatch('profile/editProfile', this.user)
          this.user = _.omit(this.$store.getters['profile/getUserProfile'], 'links');
          showSwal.methods.showSwal({
            type: "success",
            message: "Profile updated successfully!",
            width: 500
          });
        } catch (error) {
          this.setApiValidation(error.response.data.errors);
          showSwal.methods.showSwal({
            type: "error",
            message: "Oops, something went wrong!",
            width: 500
          });
        }
      }
    }
  },
};
</script>
  
