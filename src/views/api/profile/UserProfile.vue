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
                      {{ profile }}

                      <!-- <p>Email: {{ userProfile.data.email }}</p>
                      <p>Login: {{ userProfile.data.login }}</p>
                      <p>Profile picture: {{ userProfile.data.profile_image }}</p>
                      <p>Balance: {{ userProfile.data.balance }}</p> -->
                    </TabPanel>
                    <TabPanel header="Password">
                      <div v-for="purchase in purchases" :key="purchase.id">
                        <h4>Product: {{ purchase.product }}</h4>
                        <p>Wallet type: {{ purchase.walletType }}</p>
                        <p>Payment method: {{ purchase.paymentMethod }}</p>
                        <p>Quantity: {{ purchase.quantity }}</p>
                        <p>Order price: {{ purchase.orderPrice }}</p>
                        <p>Date opened: {{ purchase.dateOpen }}</p>
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

