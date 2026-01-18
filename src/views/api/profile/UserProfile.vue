<template>


          <div class="container-fluid py-4">
            <div class="col-6 col-lg-8 m-auto">
              <div class="card">
                <div class="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div class="bg-gradient-success shadow-success border-radius-lg pt-4 pb-3">
                    <p class="ms-3 text-white text-center"><b>User Profile</b></p>
                  </div>
                </div>
                <div class="card-body">
                  <TabView>
                    <TabPanel header="Profile">
                      <Info v-if="profile" />
                      <div v-else class="text-center p-4">
                        <ProgressSpinner />
                        <p class="mt-3 text-500">Loading profile...</p>
                      </div>
                    </TabPanel>
                    <TabPanel header="Password">
                      <Password />
                      <div v-if="purchases && purchases.length > 0" class="mt-4">
                        <h5>Recent Purchases</h5>
                        <div v-for="purchase in purchases" :key="purchase.id" class="p-3 border-round mb-2 bg-surface-100">
                          <h6 class="mb-1">{{ purchase.product }}</h6>
                          <p class="text-sm text-500 mb-0">Wallet: {{ purchase.walletType }} | Method: {{ purchase.paymentMethod }}</p>
                          <p class="text-sm text-500 mb-0">Quantity: {{ purchase.quantity }} | Price: {{ purchase.orderPrice }}</p>
                          <p class="text-xs text-500 mt-1">Date: {{ purchase.dateOpen }}</p>
                        </div>
                      </div>
                      <div v-else class="text-center p-4 text-500">
                        <p>No purchases found</p>
                      </div>
                    </TabPanel>
                  </TabView>
                </div>
              </div>
            </div>
          </div>
 


</template>

<script>
import Info from "./Info.vue";
import Password from "./Password.vue";
import { mapActions, mapGetters } from 'vuex';

export default {
  name: "User Profile",
  components: {
    Info,
    Password
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters('profile', {
      profile: 'getUserProfile'
    }),
    ...mapGetters('order', {
      purchases: 'GET_PURCHASES'
    }),
  },
  methods: {
    ...mapActions({
      fetchPurchases: 'order/GET_PURCHASES',
      fetchUserProfile: 'profile/getProfile',
    })
  },

  async mounted() {
    try {
      await this.fetchUserProfile();
      await this.fetchPurchases();

      console.log(this.profile);
      console.log(this.purchases);
 
    } catch (error) {
      console.log(error);
    }
  }
};
</script>

