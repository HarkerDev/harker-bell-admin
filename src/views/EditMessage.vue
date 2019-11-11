<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="8" md="5" lg="6" xl="4">
        <v-text-field v-model="message" dense hint="Make sure you don't self-XSS yourself." persistent-hint label="Message"></v-text-field>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" :disabled="message.length == 0" :loading="loading" tile @click="saveMessage">Save</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="body-2">
        <div class="overline font-weight-medium">Helpful Hints</div>
        <div>Use the <kbd>blink</kbd> class on a <kbd>span</kbd> tag to flash text.</div>
        <div>Use a <kbd>{color}--text</kbd> class to change the text color. For example, <kbd>blue2--text</kbd>.</div>
        <div>Available colors are <code class="elevation-0">red2</code>, <code class="elevation-0">deeporange2</code>, <code class="elevation-0">orange2</code>, <code class="elevation-0">yellow2</code>, <code class="elevation-0">lightgreen2</code>, <code class="elevation-0">green2</code>, <code class="elevation-0">teal2</code>, <code class="elevation-0">lightblue2</code>, <code class="elevation-0">blue2</code>, <code class="elevation-0">indigo2</code>, <code class="elevation-0">purple2</code>, <code class="elevation-0">pink2</code>, <code class="elevation-0">bluegrey2</code>, and <code class="elevation-0">grey2</code>.</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div class="overline font-weight-medium">Live Preview</div>
        <div v-html="message"></div>
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
      message: "",
      loading: false,
      snackbars: {
        error: false,
        success: false,
      },
      onlineUsers: 0,
    };
  },
  watch: {
    accessToken() {
      this.fetchMessage();
    },
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
    async fetchMessage() {
      const response = await fetch(this.baseUrl+"/admin/getMessage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_token: this.accessToken
        }),
      });
      if (response.ok) this.message = await response.text();
    },
    async saveMessage() {
      this.loading = true;
      const response = await fetch(this.baseUrl+"/admin/editMessage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_token: this.accessToken,
          message: this.message,
        }),
      });
      if (response.ok) this.snackbars.success = true;
      else this.snackbars.error = true;
      this.loading = false;
    },
  }
};
</script>

<style>
.blink {
  animation: blink 1.25s step-start infinite;
}
@keyframes blink {
  50% {opacity: 0;}
}
</style>