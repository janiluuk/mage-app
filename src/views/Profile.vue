<template>
  <div class="container-fluid">
    <div
      class="page-header min-height-300 border-radius-xl mt-4"
      style="
        background-image: url(&quot;https://images.unsplash.com/photo-1531512073830-ba890ca4eba2?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80&quot;);
      "
    >
      <span class="mask bg-gradient-success opacity-6"></span>
    </div>
    <div class="card card-body mx-3 mx-md-4 mt-n6">
      <div class="row gx-4">
        <div class="col-auto">
          <div class="avatar avatar-xl position-relative">
            <img
              src="@/assets/img/bruce-mars.jpg"
              alt="profile_image"
              class="shadow-sm w-100 border-radius-lg"
            />
          </div>
        </div>
        <div class="col-auto my-auto">
          <div class="h-100">
            <h5 class="mb-1">Sum Ting Wong</h5>

            <p class="mb-0 font-weight-normal text-sm">Master of disaster</p>
          </div>
        </div>
        <div
          class="mx-auto mt-3 col-lg-4 col-md-6 my-sm-auto ms-sm-auto me-sm-0"
        >
          <div class="nav-wrapper position-relative end-0">
            <ul
              class="p-1 bg-transparent nav nav-pills nav-fill"
              role="tablist"
            >
              <li class="nav-item">
                <a
                  class="px-0 py-1 mb-0 nav-link active"
                  data-bs-toggle="tab"
                  href="javascript:;"
                  role="tab"
                  aria-selected="true"
                >
                  <i class="fa fa-list"></i>
                  <span class="ms-1">My uploads</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="px-0 py-1 mb-0 nav-link"
                  data-bs-toggle="tab"
                  href="javascript:;"
                  role="tab"
                  data-bs-target="#uploads"
                  aria-selected="false"
                >
                  <i class="fa fa-list"></i>
                  <span class="ms-1">Ready content</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="px-0 py-1 mb-0 nav-link"
                  data-bs-toggle="tab"
                  href="javascript:;"
                  role="tab"
                  data-bs-target="#underworkJobs"
                  aria-selected="false"
                >
                  <i class="fa fa-list"></i>

                  <span class="ms-1">Jobs under work</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="px-0 py-1 mb-0 nav-link"
                  data-bs-toggle="tab"
                  href="javascript:;"
                  role="tab"
                  data-bs-target="#inProgressJobs"
                  aria-selected="false"
                >
                  <i class="fa fa-list"></i>

                  <span class="ms-1">Jobs processing</span>
                </a>
              </li>
              <li class="nav-item">
                <a
                  class="px-0 py-1 mb-0 nav-link"
                  data-bs-toggle="tab"
                  href="javascript:;"
                  role="tab"
                  data-bs-target="#failedJobs"
                  aria-selected="false"
                >
                  <i class="fa fa-list"></i>

                  <span class="ms-1">Failed Jobs</span>
                </a>
              </li>
            </ul>
            <div class="tab-content" id="myTabContent">
              <div
                class="tab-pane fade show active"
                id="readyJobs"
                role="tabpanel"
                aria-labelledby="ready-tab"
              >
                Ready content
              </div>
              <div
                class="tab-pane fade"
                id="underworkJobs"
                role="tabpanel"
                aria-labelledby="home-tab"
              >
                Content in works
              </div>
              <div
                class="tab-pane fade"
                id="inProgressJobs"
                role="tabpanel"
                aria-labelledby="inProgress-tab"
              >
                Jobs in processing
              </div>
              <div
                class="tab-pane fade"
                id="failedJobs"
                role="tabpanel"
                aria-labelledby="failed-tab"
              >
                Failed jobs
              </div>
              <div
                class="tab-pane fade"
                id="uploads"
                role="tabpanel"
                aria-labelledby="failed-tab"
              >
                My uploads
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="mt-3 row">
          <div class="col-12 col-md-6 col-xl-4 position-relative">
            <div class="card card-plain h-100">
              <div class="p-3 pb-0 card-header">
                <h6 class="mb-0">Platform Settings</h6>
              </div>
              <div class="p-3 card-body">
                <h6 class="text-xs text-uppercase text-body font-weight-bolder">
                  Account
                </h6>
                <ul class="list-group">
                  <li class="px-0 border-0 list-group-item">
                    <material-switch
                      id="flexSwitchCheckDefault"
                      class="ps-0 ms-0"
                      name="flexSwitchCheckDefault"
                      label-class="mb-0 text-body text-truncate w-80"
                      checked
                      >Email me when someone follows me</material-switch
                    >
                  </li>
                  <li class="px-0 border-0 list-group-item">
                    <material-switch
                      id="flexSwitchCheckDefault1"
                      class="ps-0 ms-0"
                      name="flexSwitchCheckDefault1"
                      label-class="mb-0 text-body text-truncate w-80"
                      >Email me when someone answers on my post</material-switch
                    >
                  </li>

                  <li class="px-0 border-0 list-group-item">
                    <material-switch
                      id="flexSwitchCheckDefault2"
                      class="ps-0 ms-0"
                      name="flexSwitchCheckDefault2"
                      label-class="mb-0 text-body text-truncate w-80"
                      checked
                      >Email me when someone mentions me</material-switch
                    >
                  </li>
                </ul>
                <h6
                  class="mt-4 text-xs text-uppercase text-body font-weight-bolder"
                >
                  Application
                </h6>
                <ul class="list-group">
                  <li class="px-0 border-0 list-group-item">
                    <material-switch
                      id="flexSwitchCheckDefault3"
                      class="ps-0 ms-0"
                      name="flexSwitchCheckDefault3"
                      label-class="mb-0 text-body text-truncate w-80"
                      >New launches and projects</material-switch
                    >
                  </li>
                  <li class="px-0 border-0 list-group-item">
                    <material-switch
                      id="flexSwitchCheckDefault4"
                      class="ps-0 ms-0"
                      name="flexSwitchCheckDefault4"
                      label-class="mb-0 text-body text-truncate w-80"
                      checked
                      >Monthly product updates</material-switch
                    >
                  </li>
                  <li class="px-0 pb-0 border-0 list-group-item">
                    <material-switch
                      id="flexSwitchCheckDefault5"
                      class="ps-0 ms-0"
                      name="flexSwitchCheckDefault5"
                      label-class="mb-0 text-body text-truncate w-80"
                      >Subscribe to newsletter</material-switch
                    >
                  </li>
                </ul>
              </div>
            </div>
            <hr class="vertical dark" />
          </div>
          <div class="col-12 col-md-6 col-xl-4 mt-md-0 mt-4 position-relative">
            <profile-info-card
              title="Profile Information"
              description="Hi, I’m Wong, I decided to put description of my shit here.."
              :info="{
                fullName: 'Sum T. Wong',
                mobile: '(982) 666 123',
                email: 'sumthing@wong.com',
                location: 'Molvania',
              }"
              :social="[
                {
                  link: 'https://www.facebook.com/Wong/',
                  icon: 'fa-facebook',
                },
                {
                  link: 'https://twitter.com/wong',
                  icon: 'fa-twitter',
                },
                {
                  link: 'https://www.instagram.com/wong/',
                  icon: 'fa-instagram',
                },
              ]"
              :action="{
                route: 'javascript:;',
                tooltip: 'Edit Profile',
              }"
            />
            <hr class="vertical dark" />
          </div>
          <div class="mt-4 col-12 col-xl-4 mt-xl-0">
            <div class="card card-plain h-100">
              <div class="p-3 pb-0 card-header">
                <h6 class="mb-0">Conversations</h6>
              </div>
              <div class="p-3 card-body">
                <ul class="list-group">
                  <li
                    class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
                  >
                    <material-avatar
                      class="me-3"
                      :img="sophie"
                      alt="kal"
                      border-radius="lg"
                      shadow="regular"
                    />
                    <div
                      class="d-flex align-items-start flex-column justify-content-center"
                    >
                      <h6 class="mb-0 text-sm">Sophie B.</h6>
                      <p class="mb-0 text-xs">Hi! I need more information..</p>
                    </div>
                    <a
                      class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                      href="javascript:;"
                      >Reply</a
                    >
                  </li>
                  <li
                    class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
                  >
                    <material-avatar
                      class="me-3"
                      :img="marie"
                      alt="kal"
                      border-radius="lg"
                      shadow="regular"
                    />
                    <div
                      class="d-flex align-items-start flex-column justify-content-center"
                    >
                      <h6 class="mb-0 text-sm">Anne Marie</h6>
                      <p class="mb-0 text-xs">Awesome work, can you..</p>
                    </div>
                    <a
                      class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                      href="javascript:;"
                      >Reply</a
                    >
                  </li>
                  <li
                    class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
                  >
                    <material-avatar
                      class="me-3"
                      :img="ivana"
                      alt="kal"
                      border-radius="lg"
                      shadow="regular"
                    />
                    <div
                      class="d-flex align-items-start flex-column justify-content-center"
                    >
                      <h6 class="mb-0 text-sm">Ivanna</h6>
                      <p class="mb-0 text-xs">About files I can..</p>
                    </div>
                    <a
                      class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                      href="javascript:;"
                      >Reply</a
                    >
                  </li>
                  <li
                    class="px-0 mb-2 border-0 list-group-item d-flex align-items-center"
                  >
                    <material-avatar
                      class="me-3"
                      :img="peterson"
                      alt="kal"
                      border-radius="lg"
                      shadow="regular"
                    />
                    <div
                      class="d-flex align-items-start flex-column justify-content-center"
                    >
                      <h6 class="mb-0 text-sm">Peterson</h6>
                      <p class="mb-0 text-xs">Have a great afternoon..</p>
                    </div>
                    <a
                      class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                      href="javascript:;"
                      >Reply</a
                    >
                  </li>
                  <li
                    class="px-0 border-0 list-group-item d-flex align-items-center"
                  >
                    <material-avatar
                      class="me-3"
                      :img="nick"
                      alt="kal"
                      border-radius="lg"
                      shadow="regular"
                    />
                    <div
                      class="d-flex align-items-start flex-column justify-content-center"
                    >
                      <h6 class="mb-0 text-sm">Nick Daniel</h6>
                      <p class="mb-0 text-xs">Hi! I need more information..</p>
                    </div>
                    <a
                      class="mb-0 btn btn-link pe-3 ps-0 ms-auto"
                      href="javascript:;"
                      >Reply</a
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-12">
            <div class="mb-5 ps-3">
              <h6 class="mb-1">Projects</h6>
              <p class="text-sm">Architects design houses</p>
            </div>
            <div class="row">
              <default-project-card
                title="Modern"
                :image="img1"
                label="Project #2"
                description="As Uber works through a huge amount of internal
                management turmoil."
                :authors="[
                  {
                    image: team1,
                    name: 'Elena Morison',
                  },
                  {
                    image: team2,
                    name: 'Ryan Milly',
                  },
                  {
                    image: team3,
                    name: 'Nick Daniel',
                  },
                  {
                    image: team4,
                    name: 'Peterson',
                  },
                ]"
                :action="{
                  color: 'success',
                  label: 'View Project',
                }"
              />

              <default-project-card
                title="Scandinavian"
                :image="img2"
                label="Project #1"
                description="Music is something that every person has his or her own
                      specific opinion about."
                :authors="[
                  {
                    image: team3,
                    name: 'Nick Daniel',
                  },
                  {
                    image: team4,
                    name: 'Peterson',
                  },
                  {
                    image: team1,
                    name: 'Elena Morison',
                  },
                  {
                    image: team2,
                    name: 'Ryan Milly',
                  },
                ]"
                :action="{
                  color: 'success',
                  label: 'View Project',
                }"
              />

              <default-project-card
                title="Minimalist"
                :image="img3"
                label="Project #3"
                description="Different people have different taste, and various types
                      of music."
                :authors="[
                  {
                    image: team4,
                    name: 'Peterson',
                  },
                  {
                    image: team3,
                    name: 'Nick Daniel',
                  },
                  {
                    image: team1,
                    name: 'Elena Morison',
                  },
                  {
                    image: team2,
                    name: 'Ryan Milly',
                  },
                ]"
                :action="{
                  color: 'success',
                  label: 'View Project',
                }"
              />
              <default-project-card
                title="Gothic"
                image="https://images.unsplash.com/photo-1606744824163-985d376605aa?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                label="Project #4"
                description="Why would anyone pick blue over pink? Pink is obviously a
                      better color."
                :authors="[
                  {
                    image: team4,
                    name: 'Peterson',
                  },
                  {
                    image: team3,
                    name: 'Nick Daniel',
                  },
                  {
                    image: team2,
                    name: 'Ryan Milly',
                  },
                  {
                    image: team1,
                    name: 'Elena Morison',
                  },
                ]"
                :action="{
                  color: 'success',
                  label: 'View Project',
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProfileInfoCard from "./components/ProfileInfoCard.vue";
import DefaultProjectCard from "./components/DefaultProjectCard.vue";
import MaterialSwitch from "@/components/material/MaterialSwitch.vue";
import MaterialAvatar from "@/components/material/MaterialAvatar.vue";
import sophie from "@/assets/img/kal-visuals-square.jpg";
import marie from "@/assets/img/marie.jpg";
import ivana from "@/assets/img/ivana-square.jpg";
import peterson from "@/assets/img/team-4.jpg";
import nick from "@/assets/img/team-3.jpg";
import img1 from "@/assets/img/home-decor-1.jpg";
import img2 from "@/assets/img/home-decor-2.jpg";
import img3 from "@/assets/img/home-decor-3.jpg";
import team1 from "@/assets/img/team-1.jpg";
import team2 from "@/assets/img/team-2.jpg";
import team3 from "@/assets/img/team-3.jpg";
import team4 from "@/assets/img/team-4.jpg";

import setNavPills from "@/assets/js/nav-pills.js";
import setTooltip from "@/assets/js/tooltip.js";

export default {
  name: "profile-overview",
  data() {
    return {
      showMenu: false,
      sophie,
      marie,
      ivana,
      peterson,
      nick,
      img1,
      team1,
      team2,
      team3,
      team4,
      img2,
      img3,
    };
  },
  components: {
    ProfileInfoCard,
    DefaultProjectCard,
    MaterialSwitch,
    MaterialAvatar,
  },

  mounted() {
    this.$store.state.isAbsolute = true;
    setNavPills();
    setTooltip();
    this.getProfile();
  },
  beforeUnmount() {
    this.$store.state.isAbsolute = false;
  },
  methods: {
    getProfile: async () => {
      const res = await fetch("http://vimage.dudeisland.eu:47860/user/");
      const data = await res.json();
      console.log(data);
    },
  },
};
</script>
