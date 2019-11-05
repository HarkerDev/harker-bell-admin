<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title class="headline">Harker Bell <span class="title font-weight-bold">Admin Console</span></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-row align="center">
          <v-col cols="auto">
            <v-text-field v-model="accessToken" id="password" hide-details dense placeholder="Access Token" type="password"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-switch v-model="productionMode" color="white" hide-details :label="productionMode ? 'Production' : 'Development'"></v-switch>
          </v-col>
          <v-btn icon @click="$vuetify.theme.dark = !$vuetify.theme.dark">
            <v-icon>{{$vuetify.theme.dark ? 'brightness_4' : 'brightness_7'}}</v-icon>
          </v-btn>
        </v-row>
      </v-toolbar-items>
    </v-app-bar>
    <v-content>
      <router-view :access-token="accessToken" :base-url="baseUrl"></router-view>
    </v-content>
  </v-app>
</template>

<script>
let productionMode = localStorage.getItem("productionMode");
export default {
  name: "App",
  data() {
    return {
      accessToken: "",
      productionMode: productionMode == "true" || productionMode == undefined,
    };
  },
  watch: {
    "$vuetify.theme.dark"(dark) {
      localStorage.setItem("darkMode", dark);
    },
    productionMode(prod) {
      localStorage.setItem("productionMode", prod);
    },
  },
  created() {
    this.$vuetify.theme.dark = localStorage.getItem("darkMode") == "true";
  },
  computed: {
    baseUrl() {
      return this.productionMode ? "https://bell.dev.harker.org" : "http://localhost:5000";
    }
  }
};
</script>

<style>
#password:-webkit-autofill, #password:-webkit-autofill:focus, #password:-webkit-autofill:hover, #password:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #005841 inset !important;
          box-shadow: 0 0 0 30px #005841 inset !important;
  -webkit-text-fill-color: white !important;
}
</style>