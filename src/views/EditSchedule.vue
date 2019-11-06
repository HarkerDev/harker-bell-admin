<template>
  <v-container>
    <v-row>
      <v-col>
        <v-select :items="presets" dense item-text="preset" item-value="preset" return-object v-model="selectedPreset" label="Choose a preset..." :loading="presets.length == 0"></v-select>
        <monaco-editor v-model="editedSchedule" ref="editor" :options="options" language="json" :theme="dark ? 'vs-dark' : 'vs'" style="height: 400px;" @editorDidMount="editorDidMount"></monaco-editor>
      </v-col>
      <v-col>
        <v-sheet class="day-container border-thick" max-width="180" min-height="498">
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
              <v-col v-if="selectedPreset.schedule" cols="auto">
                <v-row class="mr-2" align="center" no-gutters>
                  <v-chip v-if="selectedPreset.variant" class="font-weight-bold" :color="selectedPreset.variant.includes('adj') ? 'warning' : 'special'" :input-value="true" outlined x-small>
                    {{selectedPreset.variant}}
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
                      <div>{{period.name}}</div>
                      <div v-if="period.start && period.duration >= 30" class="text-no-wrap">{{period.start|formatTime}}&ndash;{{period.end|formatTime}}</div>
                    </v-layout>
                  </v-sheet>
                  <!-- REGULAR PERIOD -->
                  <v-sheet v-else :key="pIndex" class="period border caption text-center d-flex" :height="period.duration+1" tile>
                    <v-layout :class="['content', {short: period.duration <= 50 || group.length > 1}]" column align-center justify-center>
                      <div ref="periodNames">
                        {{period.name}}
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
    </v-row>
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
      editedSchedule: "",
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
    };
  },
  computed: {
    computedSchedule() {
      if (!this.selectedPreset.schedule) return [];
      let schedule = JSON.parse(JSON.stringify(this.selectedPreset.schedule)); // deep clone array
      schedule[0].start = new Date("2020-01-01T"+schedule[0].start+"Z"); // just a random date
      schedule[0].end = new Date("2020-01-01T"+schedule[0].end+"Z");
      let result = [[[{ // create result array with first period (including its duration) as first element
        ...schedule[0],
        ...{duration: (schedule[0].end-schedule[0].start)/this.$MS_PER_MIN}}
      ]]];
      let latestEnd = schedule[0].end; // latest ending time in the current top-level period group (which can have multiple columns)
      for (let i = schedule.length-1; i >= 0; i--) {
        let period = schedule[i];
        if (period.name == "Collaboration") {
          period.start = "15:10:00.000";
          period.end = "15:30:00.000";
        }
      }
      for (let i = 1; i < schedule.length; i++) {
        let lastGroup = result[result.length-1]; // last group of periods in the schedule array being built
        let period = schedule[i], prevPeriod = schedule[i-1];
        period.start = new Date("2020-01-01T"+period.start+"Z");
        period.end = new Date("2020-01-01T"+period.end+"Z");
        period.duration = (period.end-period.start)/this.$MS_PER_MIN;
        if (+period.start == +prevPeriod.start) // add column if two periods start at the same time (dates are coerced to numbers)
          lastGroup.push([period]);
        else if (period.start < prevPeriod.end) // insert placeholder in new column if period starts before previous one ends
          lastGroup.push([
            {duration: (period.start-prevPeriod.end)/this.$MS_PER_MIN}, // duration of placeholder period
            period
          ]);
        else if (+period.start == +prevPeriod.end && period.start < latestEnd) // simply add to current column if periods are adjacent
          lastGroup[lastGroup.length-1].push(period);
        else if (+period.start == +prevPeriod.end) // start a new period group if period starts after the previous group
          result.push([[period]]);
        else if (period.start < latestEnd) // insert placeholder in current column if there's a gap between two periods
          lastGroup[lastGroup.length-1].push({duration: (period.start-prevPeriod.end)/this.$MS_PER_MIN}, period); // I CHANGED THIS AFTER A BUG; IF I BROKE ANYTHING LATER IT'S PROBABLY FROM THIS!
        else // insert placeholder in a new period group otherwise
          result.push([[{duration: (period.start-latestEnd)/this.$MS_PER_MIN}]], [[period]]);
        latestEnd = Math.max(latestEnd, period.end);
      }
      return result;
    },
  },
  watch: {
    accessToken() {
      this.fetchAllPresets();
    },
    selectedPreset(preset) {
      if (preset)
        this.editedSchedule = JSON.stringify(preset.schedule, null, 2);
      else this.editedSchedule = "";
    },
  },
  created() {
    this.$MS_PER_MIN = 60*1000;
  },
  methods: {
    editorDidMount(editor) {
      editor.getModel().updateOptions({
        indentSize: 2,
        insertSpaces: true,
        tabSize: 2,
      });
    },
    async fetchAllPresets() {
      const response = await fetch(this.baseUrl+"/admin/getAllPresets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({access_token: this.accessToken}),
      });
      if (!response.ok) return;
      this.presets = await response.json();
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
  padding: 0 2px 2px;
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