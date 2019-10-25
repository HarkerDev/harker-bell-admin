<template>
  <v-container>
    <v-row>
      <v-text-field v-model="event.name"></v-text-field>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      event: {
        name: "",
        category: "",
        start: null,
        end: null
      }
    };
  },
  methods: {
    submit() {
      return fetch("https://bell.dev.harker.org/admin/addEvents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          date: this.date, // ISO!!!
          clear_all: false,
          events: [this.event],
        }),
      }).then(response => {
        
      }).catch(error => {
        
      });
    }
  },
};
</script>