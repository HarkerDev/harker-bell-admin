<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="8" md="5" lg="6" xl="4">
        <monaco-editor v-model="editedLunch" ref="editor" :options="options" language="json" :theme="dark ? 'vs-dark' : 'vs'" style="height: 440px;" @editorDidMount="editorDidMount"></monaco-editor>
      </v-col>
      <v-col cols="auto">
          <v-layout v-if="selectedPreset.lunch && selectedPreset.lunch.place" class="body-2 text-center" align-center justify-center>
            {{selectedPreset.lunch.place}}
          </v-layout>
      </v-col>
      <v-col cols="12" sm="8" md="4" lg="3" xl="2">
        <v-menu v-model="lunchForm.menu" :close-on-content-click="false" offset-y min-width="290px">
          <template v-slot:activator="{on}">
            <v-text-field v-model="lunchForm.date" clearable label="Date of lunch menu" prepend-icon="event" readonly v-on="on"></v-text-field>
          </template>
          <v-date-picker v-model="lunchForm.date" :allowed-dates="allowedDate" no-title @input="lunchForm.menu = false"></v-date-picker>
        </v-menu>
        <v-btn color="primary" :disabled="!lunchForm.date || lunchForm.date.length == 0" :loading="lunchForm.loading" tile @click="getLunchOnDate">Get lunch menu on date</v-btn><br>
        <br>
        <v-btn color="primary" :disabled="!lunchForm.date || lunchForm.date.length == 0" :loading="lunchForm.loading" tile @click="saveAsLunch">Save as lunch menu</v-btn>
        <v-divider class="mt-4"></v-divider>
        <div class="caption">
          <p>Double check the editor for errors before saving!</p>
        </div>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbars.success1" color="success" bottom left :timeout="4000">Success.</v-snackbar>
    <v-snackbar v-model="snackbars.success2" color="success" bottom left :timeout="5000">Successfully pushed update to {{onlineUsers}} online users.</v-snackbar>
    <v-snackbar v-model="snackbars.error" color="error" bottom left :timeout="5000">An error occurred. Check your access token.</v-snackbar>
    <v-snackbar v-model="snackbars.errorLunch" color="error" bottom left :timeout="5000">No lunch menu was found on that date.</v-snackbar>
  </v-container>
</template>

<script>
import MonacoEditor from "vue-monaco";
export default {
  components: {
    MonacoEditor
  },
  props: {
    accessToken: {
      type: String,
      required: true
    },
    baseUrl: {
      type: String,
      required: true
    },
    dark: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      selectedPreset: {},
      options: {
        autoIndent: true,
        cursorSmoothCaretAnimation: true,
        minimap: {enabled: false},
        roundedSelection: false,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        wordWrap: true,
        wrappingIndent: "same",
      },
      lunchForm: {
        date: "",
        menu: false,
        loading: false
      },
      snackbars: {
        error: false,
        errorLunch: false,
        success1: false,
        success2: false,
      },
      editor: null,
      onlineUsers: 0,
    };
  },
  watch: {
    async "snackbars.success2"(open) {
      if (open) {
        const response = await fetch(this.baseUrl+"/api/clients", {
          method: "GET",
        });
        this.onlineUsers = await response.text();
      }
    },
  },
  computed: {
    editedLunch: {
      get() {
        if (this.selectedPreset.lunch) return JSON.stringify(this.selectedPreset.lunch, null, 2);
        return "";
      },
      set(lunch) {
        this.selectedPreset.lunch = JSON.parse(lunch);
      }
    },
  },
  methods: {
    allowedDate(dateString) {
      let date = new Date(dateString);
      return date.getUTCDay() > 0 && date.getUTCDay() < 6;
    },
    editorDidMount(editor) {
      this.editor = editor;
      editor.getModel().updateOptions({
        indentSize: 2,
        insertSpaces: true,
        tabSize: 2,
      });
    },
    async saveAsLunch() {
      this.lunchForm.loading = true;
      if (!this.selectedPreset.variant) delete this.selectedPreset.variant;
      delete this.selectedPreset._id;
    
      const response = await fetch(this.baseUrl+"/admin/addLunch", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_token: this.accessToken,
          clear_all: true,
          lunch: {
            [this.lunchForm.date]: this.selectedPreset.lunch
          }
        }),
      });
      
      if (response.ok) {
        this.snackbars.success2 = true;
        this.lunchForm.date = "";
      } else this.snackbars.error = true;
      this.lunchForm.loading = false;
    },
    async getLunch(month, day, year) {
      this.lunchForm.loading = true;
      const response = await fetch(this.baseUrl+"/api/lunchmenu?month=" + month + "&day=" + day + "&year=" + year, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
      });
      if (response.ok) {
        this.selectedPreset = await response.json();
      } else this.snackbars.errorLunch = true;
      this.lunchForm.loading = false;
    },
    async getLunchOnDate() {
      let [year, month, day] = this.lunchForm.date.split("-");
      await this.getLunch(month, day, year);
    }
  }
};
</script>

<style scoped>
.v-chip {
  padding: 0 6px;
}
.v-sheet {
  position: relative;
}
.v-application div.border {
  border: 1px solid #9AA0A6 !important; /* for IE11 */
}
.v-application div.border-thick {
  border: 2px solid #9AA0A6 !important; /* for IE11 */
}
.events {
  margin-right: -2px;
  width: 180px;
  border-radius: 2px;
}
.day-container {
  margin: 0 -2px -2px 0;
  -webkit-transition: all 300ms;
          transition: all 300ms;
}
.container:not(.month) .day-header {
  border-bottom: 1px solid #9AA0A6 !important;
  border-color: #9AA0A6 !important;
}
.column:not(:first-child) > .period {
  margin-left: 0;
}
.content {
  padding: 0 3px 3px;
  overflow-y: hidden;
}
.normal {
  line-height: normal;
}
.period {
  margin: 0 -1px -1px;
}
.group, .column, .period {
  transition: all 200ms;
}
.text-bottom {
  vertical-align: text-bottom;
}
.short .overline {
  line-height: 1.3;
}
.short {
  line-height: 1.2 !important;
}
.caption {
  letter-spacing: 0.01rem !important;
}
</style>
