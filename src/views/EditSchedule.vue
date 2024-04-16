<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="8" md="5" lg="6" xl="4">
        <v-autocomplete :items="presets" dense item-text="preset" item-value="preset" return-object v-model="selectedPreset" label="Choose a preset..." :loading="presets.length == 0"></v-autocomplete>
        <monaco-editor v-model="editedSchedule" ref="editor" :options="options" language="json" :theme="dark ? 'vs-dark' : 'vs'" style="height: 440px;" @editorDidMount="editorDidMount"></monaco-editor>
        <v-btn class="mt-1" color="primary" small text tile @click="insertNBSpace">Insert non-breaking space</v-btn>
        <v-btn class="mt-1" color="primary" small text tile @click="insertNBHyphen">Insert non-breaking hyphen</v-btn>
      </v-col>
      <v-col cols="auto">
        <v-sheet class="day-container border-thick" max-width="180" min-width="180" min-height="498">
          <!-- DAY HEADER -->
          <v-sheet class="day-header" height="44" tile>
            <v-row class="ml-2" align="center" no-gutters>
              <v-col cols="auto">
                <v-layout column align-center>
                  <span class="overline">Mon</span>
                  <span class="headline short text--secondary font-weight-bold">1</span>
                </v-layout>
              </v-col>
              <v-spacer></v-spacer>
              <div v-if="selectedPreset.schedule && selectedPreset.variant && selectedPreset.variant.includes('chicken') && selectedPreset.variant != 'chicken'" class="headline text--primary font-transition">🐔</div>
              <div v-if="selectedPreset.schedule && selectedPreset.variant && selectedPreset.variant == 'chicken'" class="headline text--primary font-transition">🐔🐔🐔</div>
              <v-spacer v-if="selectedPreset.schedule && selectedPreset.variant && selectedPreset.variant.includes('chicken')"></v-spacer>
              <v-col v-if="selectedPreset.schedule" cols="auto">
                <v-row class="mr-2" align="center" no-gutters>
                  <v-chip v-if="selectedPreset.variant && selectedPreset.variant != 'chicken'" class="font-weight-bold" :color="selectedPreset.variant.includes('adj') ? 'warning' : (selectedPreset.variant.includes('special') ? 'info' : 'error')" :input-value="true" outlined x-small>
                    {{selectedPreset.variant.replace("-chicken", "")}}
                  </v-chip>
                  <span class="display-1 ml-2 text--disabled font-weight-bold">{{selectedPreset.code}}</span>
                </v-row>
              </v-col>
            </v-row>
          </v-sheet>
          <!-- WEEK DAY CONTENT -->
          <template>
            <v-layout v-for="(group, gIndex) in computedSchedule" :key="gIndex" class="group">
              <v-flex v-for="(column, cIndex) in group" :key="cIndex" class="column">
                <template v-for="(period, pIndex) in column">
                  <!-- LUNCH PERIOD -->
                  <v-sheet v-if="period.name && period.name.toLowerCase().indexOf('lunch') != -1" :key="pIndex" class="period border lunch caption text-center d-flex" :height="period.duration+1" tile>
                    <v-layout :class="{content: true, short: period.duration <= 50 || group.length > 1}" column align-center justify-center>
                      <div v-html="period.name"></div>
                      <div v-if="period.start && period.duration >= 30" class="text-no-wrap">{{period.start|formatTime}}&ndash;{{period.end|formatTime}}</div>
                    </v-layout>
                  </v-sheet>
                  <!-- REGULAR PERIOD -->
                  <v-sheet v-else :key="pIndex" class="period border caption text-center d-flex" :height="period.duration+1" tile>
                    <v-layout :class="['content', {short: period.duration <= 50 || group.length > 1}]" column align-center justify-center>
                      <div ref="periodNames">
                        <span v-html="period.name"></span>
                        <span v-if="period.start && period.duration < 30 && column.length <= 1" class="text-no-wrap"> {{period.start|formatTime}}&ndash;{{period.end|formatTime}}</span>
                      </div>
                      <div v-if="period.start && period.duration >= 30" class="text-no-wrap">{{period.start|formatTime}}&ndash;{{period.end|formatTime}}</div>
                    </v-layout>
                  </v-sheet>
                </template>
              </v-flex>
            </v-layout>
          </template>
          <v-layout v-if="selectedPreset.schedule && selectedPreset.schedule.name" class="body-2 text-center" align-center justify-center>
            {{selectedPreset.schedule.name}}
          </v-layout>
        </v-sheet>
      </v-col>
      <v-col cols="12" sm="8" md="4" lg="3" xl="2">
        <v-radio-group v-model="selectedPreset.code" :disabled="presets.length == 0" row>
          <v-radio label="A" value="A"></v-radio>
          <v-radio label="B" value="B"></v-radio>
          <v-radio label="C" value="C"></v-radio>
          <v-radio label="D" value="D"></v-radio>
          <v-radio label="None" value=" "></v-radio>
        </v-radio-group>
        <v-select v-model="selectedPreset.variant" clearable dense :disabled="presets.length == 0" :items="['adjusted', 'special', 'unofficial', 'unverified', 'chicken', 'adjusted-chicken', 'special-chicken', 'unofficial-chicken', 'unverified-chicken']" placeholder="Special/Adjusted/Other" prepend-icon="flag"></v-select>
        <v-divider></v-divider>
        <v-menu v-model="scheduleForm.menu" :close-on-content-click="false" offset-y min-width="290px">
          <template v-slot:activator="{on}">
            <v-text-field v-model="scheduleForm.date" clearable label="Date of schedule" prepend-icon="event" readonly v-on="on"></v-text-field>
          </template>
          <v-date-picker v-model="scheduleForm.date" :allowed-dates="allowedDate" no-title @input="scheduleForm.menu = false"></v-date-picker>
        </v-menu>
        <v-btn color="primary" :disabled="!scheduleForm.date || scheduleForm.date.length == 0" :loading="scheduleForm.loading" tile @click="getScheduleOnDate">Get schedule on date</v-btn><br>
        <br>
        <v-btn color="primary" :disabled="!scheduleForm.date || scheduleForm.date.length == 0" :loading="scheduleForm.loading" tile @click="saveAsSchedule">Save as schedule</v-btn>
        <v-divider class="mt-4"></v-divider>
        <v-text-field v-model="presetForm.name" clearable label="Name of preset" prepend-icon="short_text"></v-text-field>
        <v-btn color="primary" :disabled="!presetForm.name || presetForm.name.length == 0" :loading="presetForm.loading" tile @click="saveAsPreset">Save as preset</v-btn>
        <v-divider class="my-4"></v-divider>
        <div class="caption">
          <p>Note: Don't include start or end times for collaboration periods.</p>
          <p>Double check the editor for errors before saving!</p>
        </div>
      </v-col>
    </v-row>
    <v-snackbar v-model="snackbars.success1" color="success" bottom left :timeout="4000">Success.</v-snackbar>
    <v-snackbar v-model="snackbars.success2" color="success" bottom left :timeout="5000">Successfully pushed update to {{onlineUsers}} online users.</v-snackbar>
    <v-snackbar v-model="snackbars.error" color="error" bottom left :timeout="5000">An error occurred. Check your access token.</v-snackbar>
    <v-snackbar v-model="snackbars.errorSchedule" color="error" bottom left :timeout="5000">No schedule was found on that date.</v-snackbar>
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
  filters: {
    formatTime(date) {
      if (typeof date == "string") date = new Date(date);
      return (date.getUTCHours()+11)%12+1+":"+ // convert hours to 12-hour time
             ("0"+date.getUTCMinutes()).slice(-2); // pad minutes with a 0 if necessary
    },
  },
  data() {
    return {
      presets: [],
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
      presetForm: {
        name: "",
        loading: false
      },
      scheduleForm: {
        date: "",
        menu: false,
        loading: false
      },
      snackbars: {
        error: false,
        errorSchedule: false,
        success1: false,
        success2: false,
      },
      editor: null,
      onlineUsers: 0,
    };
  },
  computed: {
    computedSchedule() {
      if (!this.selectedPreset.schedule) return [];
      let schedule = JSON.parse(JSON.stringify(this.selectedPreset.schedule)); // deep clone array
      for (let i = 0; i < schedule.length; i++) {
        let period = schedule[i];
        if (period.name == "Collaboration") {
          period.start = "15:10:00.000";
          period.end = "15:30:00.000";
        }
        period.start = new Date("2020-01-01T"+period.start+"Z"); // just a random date
        period.end = new Date("2020-01-01T"+period.end+"Z");
        period.duration = (period.end-period.start)/this.$MS_PER_MIN;
      }
      let result = [[[{ // create result array with first period (including its duration) as first element
        ...schedule[0],
        ...{duration: (schedule[0].end-schedule[0].start)/this.$MS_PER_MIN}}
      ]]];
      let latestEnd = schedule[0].end; // latest ending time in the current top-level period group (which can have multiple columns)
      for (let i = 1; i < schedule.length; i++) {
        let lastGroup = result[result.length-1]; // last group of periods in the schedule array being built
        let period = schedule[i], prevPeriod = schedule[i-1];
        let needSplitCol = false; // need to add to previous group if there are periods that start before current one
        for (let j = i+1; j < schedule.length; j++) {
          if (schedule[j].start < period.start) {
            needSplitCol = true;
            break;
          }
        }
        if (+period.start == +prevPeriod.start || +period.start == +lastGroup[0][0].start)
          lastGroup.push([period]); // add column if two periods start at the same time (dates are coerced to numbers)
        else if (period.start < prevPeriod.end) // insert placeholder in new column if period starts before previous one ends
          lastGroup.push([
            {duration: (period.start-lastGroup[0][0].start)/this.$MS_PER_MIN}, // duration of placeholder period
            period
          ]);
        else if (+period.start == +prevPeriod.end && (period.start < latestEnd || needSplitCol))
          lastGroup[lastGroup.length-1].push(period); // simply add to current column if periods are adjacent or a column split is needed
        else if (+period.start == +prevPeriod.end || +period.start == +latestEnd) // start a new period group if period starts after the previous group
          result.push([[period]]);
        else if (period.start < latestEnd || needSplitCol) // insert placeholder in current column if there's a gap between two periods or a column split is needed
          lastGroup[lastGroup.length-1].push({duration: (period.start-prevPeriod.end)/this.$MS_PER_MIN}, period); // BUGFIXED HERE
        else // insert placeholder in a new period group otherwise
          result.push([[{duration: (period.start-latestEnd)/this.$MS_PER_MIN}]], [[period]]);
        latestEnd = Math.max(latestEnd, period.end);
      }
      return result;
    },
    editedSchedule: {
      get() {
        if (this.selectedPreset.schedule) return JSON.stringify(this.selectedPreset.schedule, null, 2);
        return "";
      },
      set(schedule) {
        this.selectedPreset.schedule = JSON.parse(schedule);
      }
    },
  },
  watch: {
    accessToken() {
      this.fetchAllPresets();
    },
    async "snackbars.success2"(open) {
      if (open) {
        const response = await fetch(this.baseUrl+"/api/clients", {
          method: "GET",
        });
        this.onlineUsers = await response.text();
      }
    },
  },
  created() {
    this.$MS_PER_MIN = 60*1000;
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
    async fetchAllPresets() {
      if (!this.accessToken) return;
      const response = await fetch(this.baseUrl+"/admin/getAllPresets", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({access_token: this.accessToken}),
      });
      if (!response.ok) return this.snackbars.error = true;
      this.presets = await response.json();
    },
    insertNBHyphen() {
      this.editor.executeEdits("", [{
        range: this.editor.getSelection(),
        forceMoveMarkers: true,
        text: "‑",
      }]);
      this.editor.focus();
    },
    insertNBSpace() {
      this.editor.executeEdits("", [{
        range: this.editor.getSelection(),
        forceMoveMarkers: true,
        text: " ",
      }]);
      this.editor.focus();
    },
    async saveAsPreset() {
      this.presetForm.loading = true;
      if (!this.selectedPreset.variant) delete this.selectedPreset.variant;
      delete this.selectedPreset._id;
      this.selectedPreset.preset = this.presetForm.name;
      const response = await fetch(this.baseUrl+"/admin/addPreset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_token: this.accessToken,
          preset: this.selectedPreset,
        }),
      });
      if (response.ok) {
        this.snackbars.success1 = true;
        this.presetForm.name = "";
        this.fetchAllPresets();
      } else this.snackbars.error = true;
      this.presetForm.loading = false;
    },
    async saveAsSchedule() {
      this.scheduleForm.loading = true;
      if (!this.selectedPreset.variant) delete this.selectedPreset.variant;
      delete this.selectedPreset._id;
      const response = await fetch(this.baseUrl+"/admin/editSchedule", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_token: this.accessToken,
          schedule: Object.assign({
            date: this.scheduleForm.date+"T00:00:00.000Z"
          }, this.selectedPreset),
        }),
      });
      if (response.ok) {
        this.snackbars.success2 = true;
        this.scheduleForm.date = "";
        this.fetchAllPresets();
      } else this.snackbars.error = true;
      this.scheduleForm.loading = false;
    },
    convertSchedule(schedule) {
      schedule.schedule = schedule.schedule.map((item) => {
        let timezoneOffset = (new Date()).getTimezoneOffset() * 60 * 1000;
        let startDate = new Date((new Date(item.start)).getTime() + timezoneOffset);
        let endDate = new Date((new Date(item.end)).getTime() + timezoneOffset);
        item.start = startDate.toTimeString().split(" ")[0] + "." + (startDate.getMilliseconds()/1000).toFixed(3).split(".")[1];
        item.end = endDate.toTimeString().split(" ")[0] + "." + (endDate.getMilliseconds()/1000).toFixed(3).split(".")[1];
        return item;
      });
      return schedule;
    },
    async getSchedule(month, day, year) {
      this.scheduleForm.loading = true;
      const response = await fetch(this.baseUrl+"/api/schedule?month=" + month + "&day=" + day + "&year=" + year, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
      });
      if (response.ok) {
        this.selectedPreset = this.convertSchedule(await response.json());
        this.fetchAllPresets();
      } else this.snackbars.errorSchedule = true;
      this.scheduleForm.loading = false;
    },
    async getScheduleOnDate() {
      let [year, month, day] = this.scheduleForm.date.split("-");
      await this.getSchedule(month, day, year);
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
