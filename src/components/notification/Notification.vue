<template>
    {{  $props.notification.showing == true ? this.showNotification($props.notification.text, $props.notification.detail, $props.notification.severity, $props.notification.id) : "" }} 
</template>

<script>
import * as notificationActions from '@/store/modules/notification/types/actions';
import { mapActions } from 'vuex';
import { useToast } from "primevue/usetoast";

export default {
  name: 'Notification',
  data() {
    return {
      dismissSecs: 4,
      dismissCountDown: 0
    };
  },

  props: {
    notification: {
      id: Number,
      showing: Boolean,
      text: String,
      detail: String,
      variant: String
    }
  },
  setup() {
    const toast = useToast();
    return { toast };
  },

  methods: {
    ...mapActions('notification', {
      removeErrorNotification: notificationActions.REMOVE_ERROR_NOTIFICATION,
    }),
    showNotification(summary, detail="", severity="info", id) {
      
      this.toast.add({ severity: severity, summary: summary, detail: detail, life: 3000});
      this.removeErrorNotification(id);
    },
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },

    openAlert() {
      this.dismissCountDown = this.dismissSecs;
    },

    onDismissed() {
      this.removeErrorNotification(this.$props.notification.id);

      this.toast.removeAllGroups();
    }
  },

  mounted() {
    this.openAlert();
  }
};
</script>

<style scoped>
.alert {
  z-index: 9999;
}
</style>
