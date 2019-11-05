import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: "#005841",
        secondary: "#424242",
        accent: "#098060",
        error: "#D93025",
        warning: "#F9AB00",
        success: "#188038",
        info: "#4285F4",
        anchor: "#1A73E8"
      },
      dark: {
        primary: "#005841",
        secondary: "#424242",
        accent: "#098060",
        error: "#EA4335",
        warning: "#FBBC04",
        success: "#34A853",
        info: "#4285F4",
        anchor: "#8AB4F8"
      }
    },
  },
  icons: {
    iconfont: "md"
  },
});
