<template>
  <div class="container-fluid py-4">
    <div class="col-12 lg:col-8 m-auto">
      <div class="card">
        <div class="card-body">
          <h3 class="text-center mb-4 font-bold">User Profile</h3>
          <TabView>
            <TabPanel header="Profile">
              <Info />
            </TabPanel>
            <TabPanel header="Password">
              <Password />
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

export default {
  name: "User Profile",
  components: {
    Info,
    Password,
  },
};
</script>
