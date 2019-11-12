<template>
  <v-container>
    <v-row>
      <v-col cols="7" md="3" lg="4" xl="3">
        <v-text-field v-model="event.name" label="Event Name"></v-text-field>
      </v-col>
      <v-col cols="5" md="3" lg="2">
        <v-select v-model="event.category" :items="categories" label="Event Category"></v-select>
      </v-col>
      <v-col cols="4" md="2">
        <v-menu v-model="menus.date" :close-on-content-click="false" offset-y min-width="290px">
          <template v-slot:activator="{on}">
            <v-text-field v-model="event.date" label="Event Date" readonly v-on="on"></v-text-field>
          </template>
          <v-date-picker v-model="event.date" :allowed-dates="allowedDate" no-title @input="menus.date = false"></v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="4" md="2">
        <!-- https://github.com/vuetifyjs/vuetify/issues/4502 -->
        <v-menu v-model="menus.start" :close-on-content-click="false" offset-y min-width="240px" @input="value => value && $refs.timepicker1 && ($refs.timepicker1.selectingHour = true)">
          <template v-slot:activator="{on}">
            <v-text-field v-model="event.start" label="Start Time" readonly v-on="on"></v-text-field>
          </template>
          <v-time-picker v-model="event.start" ref="timepicker1" ampm-in-title></v-time-picker>
        </v-menu>
      </v-col>
      <v-col cols="4" md="2">
        <v-menu v-model="menus.end" :close-on-content-click="false" offset-y min-width="240px" @input="value => value && $refs.timepicker2 && ($refs.timepicker2.selectingHour = true)">
          <template v-slot:activator="{on}">
            <v-text-field v-model="event.end" label="End Time" readonly v-on="on"></v-text-field>
          </template>
          <v-time-picker v-model="event.end" ref="timepicker2" ampm-in-title></v-time-picker>
        </v-menu>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="auto">
        <v-btn color="primary" :disabled="hasEmpty" :loading="loading" tile @click="submit">Add Event</v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" :disabled="allEmpty" text tile @click="clear">Clear</v-btn>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbars.success" color="success" bottom left :timeout="5000">Successfully updated for {{onlineUsers}} online users.</v-snackbar>
    <v-snackbar v-model="snackbars.error" color="error" bottom left :timeout="5000">An error occurred. Check your access token.</v-snackbar>
  </v-container>
</template>

<script>
export default {
  props: {
    accessToken: {
      type: String,
      required: true
    },
    baseUrl: {
      type: String,
      required: true
    },
  },
  data() {
    return {
      event: {
        name: this.$route.query.name || "",
        category: this.$route.query.category || "",
        date: this.$route.query.date || "",
        start: this.$route.query.start || "",
        end: this.$route.query.end || "",
      },
      categories: ["schoolwide", "academics", "important", "athspirit", "extra", "perfarts", "clubs", "special", "info", "other"],
      loading: false,
      menus: {
        date: false,
        start: false,
        end: false,
      },
      snackbars: {
        error: false,
        success: false,
      },
      onlineUsers: 0,
    };
  },
  computed: {
    allEmpty() {
      for (const field of Object.keys(this.event))
        if (this.event[field].length != 0) return false;
      return true;
    },
    hasEmpty() {
      for (const field of Object.keys(this.event))
        if (this.event[field].length == 0) return true;
      return false;
    },
  },
  watch: {
    async "snackbars.success"(open) {
      if (open) {
        const response = await fetch(this.baseUrl+"/api/clients", {
          method: "GET",
        });
        this.onlineUsers = await response.text();
      }
    },
  },
  methods: {
    allowedDate(dateString) {
      let date = new Date(dateString);
      return date.getUTCDay() > 0 && date.getUTCDay() < 6;
    },
    clear() {
      for (const field of Object.keys(this.event))
        this.event[field] = "";
    },
    async submit() {
      this.loading = true;
      this.event.name.replace(/\\n/g, "\n"); // replace escaped newline characters with actual newline chars
      const response = await fetch(this.baseUrl+"/admin/addEvents", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_token: this.accessToken,
          clear_all: false,
          date: this.event.date+"T00:00:00.000Z",
          events: [{
            name: this.event.name,
            category: this.event.category,
            start: this.event.date+"T"+this.event.start+":00.000Z",
            end: this.event.date+"T"+this.event.end+":00.000Z",
          }],
        }),
      });
      if (response.ok) this.snackbars.success = true;
      else this.snackbars.error = true;
      this.clear();
      this.loading = false;
    },
  },
};
</script>

<style>
.v-time-picker-title__time .v-picker__title__btn, .v-time-picker-title__time span {
  font-size: 36px;
  height: 32px;
}
.v-time-picker-title__ampm {
  margin-top: 0;
  margin-bottom: 0;
}
.v-picker--time .v-picker__body {
  width: 240px !important;
}
</style>