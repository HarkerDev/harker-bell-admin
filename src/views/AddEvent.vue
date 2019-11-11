<template>
  <v-container>
    <v-row>
      <v-col>
        <v-text-field v-model="event.name"></v-text-field>
      </v-col>
      <v-col>
        <v-text-field v-model="event.category"></v-text-field>
      </v-col>
      <v-col>
        <v-text-field v-model="event.start"></v-text-field>
      </v-col>
      <v-col>
        <v-text-field v-model="event.end"></v-text-field>
      </v-col>
      <v-col>
        <v-text-field v-model="event.date"></v-text-field>
      </v-col>
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
        date: "",
        start: "",
        end: "",
      }
    };
  },
  methods: {
    submit() {
      /*return fetch("https://bell.dev.harker.org/admin/addEvents", {
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
        
      });*/
    }
  },
};
</script>