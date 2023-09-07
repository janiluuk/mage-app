<template>
    <div class="card mb-0">
        <div class="flex justify-content-between mb-3">
            <div>
                <span class="block text-500 font-medium mb-3">Balance</span>
                <div class="text-900 font-medium text-xl">{{ profile.balance }} credits</div>
            </div>
            <div class="flex align-items-center justify-content-center bg-blue-100 border-round"
                style="width: 2.5rem; height: 2.5rem">
                <i class="pi pi-shopping-cart text-blue-500 text-xl"></i>
            </div>
        </div>
        <span class="text-green-500 font-medium">Next recharge in </span>
        <span class="text-500">{{  getNextMonthStart }}</span>
    </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';

export default {
    name: 'BalanceAvailable',
    beforeUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = false;
        }
    },
    async mounted() {
        try {
            await this.fetchUserProfile();
            await this.fetchPurchases();


        } catch (error) {
        }
    },

    data() {
        return {
            profile: { balance: 0 }
        }

    },

    computed: {
        ...mapGetters('profile', {
            profile: 'getUserProfile'
        }),
        ...mapGetters('order', {
            purchases: 'GET_PURCHASES'
        }),
        getNextMonthStart() {
            var now = new Date();
            var next = new Date(now.getFullYear(), now.getMonth()+1, 1);
            var timeLeft = next.getSeconds() - now.getSeconds();
            return moment.duration({ "days": timeLeft }).humanize();

        }
    },
    methods: {
        ...mapActions({
            fetchPurchases: 'order/GET_PURCHASES',
            fetchUserProfile: 'profile/getProfile',
        })

    }
}

</script>