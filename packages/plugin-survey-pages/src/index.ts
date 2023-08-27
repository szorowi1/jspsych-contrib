import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

const info = <const>{
  name: "survey-pages",
  parameters: {
    questions: {
      type: ParameterType.COMPLEX,
      array: true,
      pretty_name: "Questions",
      nested: {
        /** Question prompt. */
        prompt: {
          type: ParameterType.HTML_STRING,
          pretty_name: "Prompt",
          default: undefined,
        },
        /** Array of likert labels to display for this question. */
        labels: {
          type: ParameterType.STRING,
          array: true,
          pretty_name: "Labels",
          default: undefined,
        },
        /** Whether or not a response to this question must be given in order to continue. */
        required: {
          type: ParameterType.BOOL,
          pretty_name: "Required",
          default: false,
        },
        /** Name of the question in the trial data. If no name is given, the questions are named Q0, Q1, etc. */
        name: {
          type: ParameterType.STRING,
          pretty_name: "Question Name",
          default: "",
        },
      },
    },
    /** If true, the order of the questions in the 'questions' array will be randomized. */
    randomize_question_order: {
      type: ParameterType.BOOL,
      pretty_name: "Randomize question order",
      default: false,
    },
    /** Whether the lowest response anchor is scored as zero (if true) or one (if false). */
    zero_indexed: {
      type: ParameterType.BOOL,
      pretty_name: "Zero-indexed",
      default: false,
    },
    /** If true, the subject can return to a previous page. */
    allow_backward: {
      type: ParameterType.BOOL,
      pretty_name: "Allow backward",
      default: true,
    },
    /** The text that appears before x/y (current/total) pages displayed with show_page_number. */
    page_label: {
      type: ParameterType.STRING,
      pretty_name: "Page label",
      default: "Question",
    },
    /** The text that appears on the button to go backwards. */
    button_label_previous: {
      type: ParameterType.STRING,
      pretty_name: "Button label previous",
      default: "Previous",
    },
    /** The text that appears on the button to go forwards. */
    button_label_next: {
      type: ParameterType.STRING,
      pretty_name: "Button label next",
      default: "Next",
    },
    /** Setting this to true will enable browser auto-complete or auto-fill for the form. */
    autoadvance: {
      type: ParameterType.BOOL,
      pretty_name: "Allow autoadvance",
      default: false,
    },
  },
};

type Info = typeof info;

/**
 * **survey-pages**
 *
 * jsPsych plugin for gathering responses to questions on a likert scale
 *
 * @author Sam Zorowitz
 * @see {@link https://DOCUMENTATION_URL DOCUMENTATION LINK TEXT}
 */
class PluginNamePlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    //---------------------------------------//
    // Section 1: Trial setup
    //---------------------------------------//

    // define question order
    var question_order = [];
    for (var i = 0; i < trial.questions.length; i++) {
      question_order.push(i);
    }
    if (trial.randomize_question_order) {
      question_order = this.jsPsych.randomization.shuffle(question_order);
    }

    // define question names
    for (var i = 0; i < trial.questions.length; i++) {
      if (!trial.questions[i].name) {
        const name =
          "q" + (i + 1 + "").padStart(Math.ceil(Math.log10(trial.questions.length)), "0");
        trial.questions[i].name = name;
      }
    }

    //---------------------------------------//
    // Section 1: Define HTML + CSS
    //---------------------------------------//

    // initialize HTML
    var html = "";

    // inject CSS for trial
    html += '<style id="jspsych-survey-pages-css">';
    html += "body {background-color: rgb(243,243,243);}";
    html +=
      ".jspsych-survey-pages-container {display: grid; grid-template-columns: 1fr; width: 80vw; max-width: 640px;}";
    html +=
      ".jspsych-survey-pages-form {display: block; background-color: rgb(255,255,255); border-radius: 8px; -webkit-box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.2); box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.2);}";
    html += '.jspsych-survey-pages-form[status="inactive"] {display: none;}';
    html +=
      ".jspsych-survey-pages-prompt {display: block; text-align: left; margin: 1em 24px 0px 24px;}";
    html +=
      ".jspsych-survey-pages-opt {display: grid; grid-auto-flow: column; justify-content: start; justify-items: start; align-items: center; text-align: left; column-gap: 8px; margin: 0.75em 36px 0px 24px; padding: 4px 0 4px 0;}";
    html +=
      ".jspsych-survey-pages-opt:hover {text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.23); -webkit-text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.23);}";
    html +=
      '.jspsych-survey-pages-opt input[type="radio"] {appearance: none; height: 18px; width: 18px; border: 1px solid rgb(199,199,199); border-radius: 100%;}';
    html +=
      '.jspsych-survey-pages-opt input[type="radio"]:checked {background-color: rgba(24,133,179,0.8); box-shadow: inset 0px 0px 0px 2px rgb(255,255,255);}';
    html +=
      '.jspsych-survey-pages-opt:hover input[type="radio"] {background-color: rgb(243,243,243)}';
    html +=
      '.jspsych-survey-pages-opt:hover input[type="radio"]:checked {background-color: rgba(24,133,179,1.0)}';
    html +=
      ".jspsych-survey-pages-nav {display: grid; grid-auto-flow: column; align-items: center; justify-content: space-between; background: rgb(200,200,200); border: 2px solid rgb(200,200,200); border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 14px;}";
    html += "</style>";

    // iteratively add questions
    html += '<div class="jspsych-survey-pages-container">';
    for (var i = 0; i < trial.questions.length; i++) {
      // define question
      const question = trial.questions[question_order[i]];

      // define respose values
      var response_values = [];
      for (var j = 0; j < question.labels.length; j++) {
        response_values.push(j);
      }
      if (!trial.zero_indexed) {
        response_values = response_values.map((v) => v + 1);
      }
      if (question.reverse) {
        response_values = response_values.reverse();
      }

      // initialize form
      html +=
        '<form class="jspsych-survey-pages-form" name="jspsych-survey-pages-form" id="jspsych-survey-pages-form-' +
        i +
        '" status="inactive">';

      // initialize container
      // html +=
      // '<div class="jspsych-survey-pages-container" id="jspsych-survey-pages-container-' + i + '" status="inactive">';

      html += '<div class="jspsych-survey-pages-prompt">' + question.prompt + "</div>";
      for (let j = 0; j < question.labels.length; j++) {
        const required = question.required ? "required" : "";
        html += '<label class="jspsych-survey-pages-opt">';
        html +=
          '<input type="radio" name="' +
          question.name +
          '" order="' +
          i +
          '" pos="' +
          j +
          '" value="' +
          response_values[j] +
          '" ' +
          required +
          "></input>";
        html += question.labels[j];
        html += "</label>";
      }

      // add navigation bar
      const disabled = i === 0 || !trial.allow_backward ? "disabled" : "";
      html += '<div class="jspsych-survey-pages-nav">';
      html +=
        '<button type="button" id="jspsych-survey-pages-back-' +
        i +
        '" class="jspsych-btn" style="margin-right: 5px;"' +
        disabled +
        ">&lt; " +
        trial.button_label_previous +
        "</button>";
      html += "<p>" + trial.page_label + " " + (i + 1) + " of " + trial.questions.length + "</p>";
      html +=
        '<button type="submit" id="jspsych-survey-pages-next-' +
        i +
        '" class="jspsych-btn" style="margin-left: 5px;">' +
        trial.button_label_next +
        " &gt;</button>";
      html += "</div>";

      // close form
      html += "</form>";
    }
    html += "</div>";

    // display HTML
    display_element.innerHTML = html;

    // add radio event listeners (required to log all radio button events)
    document
      .querySelectorAll(
        'form[name="jspsych-survey-pages-form"] .jspsych-survey-pages-opt input[type="radio"]'
      )
      .forEach((radio) => {
        radio.addEventListener("click", recordRadioEvent);
      });

    //---------------------------------------//
    // Section 3: Response handling
    //---------------------------------------//

    // initialize variables
    var view_history = [];
    var radio_events = [];

    // define current page
    var current_page = 0;

    var start_time = performance.now();
    var last_page_update_time = start_time;

    show_current_page();

    //---------------------------------------//
    // Section 4: Convenience functions
    //---------------------------------------//

    function btnListener(evt) {
      // query number of selected options on current page
      const n = display_element.querySelectorAll(
        "#jspsych-survey-pages-form-" +
          current_page +
          " .jspsych-survey-pages-opt " +
          "input[type='radio']:checked"
      ).length;

      // event handling
      if (this.type === "button") {
        evt.target.removeEventListener("click", btnListener);
        back();
      } else if (this.type === "submit" && n > 0) {
        evt.preventDefault();
        evt.target.removeEventListener("click", btnListener);
        next();
      }
    }

    function show_current_page() {
      display_element
        .querySelector("#jspsych-survey-pages-form-" + current_page)
        .setAttribute("status", "active");

      if (current_page != 0 && trial.allow_backward) {
        display_element
          .querySelector("#jspsych-survey-pages-back-" + current_page)
          .addEventListener("click", btnListener);
      }

      display_element
        .querySelector("#jspsych-survey-pages-next-" + current_page)
        .addEventListener("click", btnListener);
    }

    function next() {
      add_current_page_to_view_history();

      display_element
        .querySelector("#jspsych-survey-pages-form-" + current_page)
        .setAttribute("status", "inactive");

      current_page++;

      // if done, finish up...
      if (current_page >= trial.questions.length) {
        endTrial();
      } else {
        show_current_page();
      }
    }

    function back() {
      add_current_page_to_view_history();

      display_element
        .querySelector("#jspsych-survey-pages-form-" + current_page)
        .setAttribute("status", "inactive");

      current_page--;

      show_current_page();
    }

    /** Records the identity and timing of any radio button event on the page. */
    function recordRadioEvent(event) {
      // record event time
      var current_time = performance.now();
      var event_time = Math.round(current_time - last_page_update_time);

      // record event target
      var event_target =
        event.srcElement.getAttribute("name") + "_" + event.srcElement.getAttribute("pos");

      // store event info
      radio_events.push({
        event_target: event_target,
        event_time: event_time,
      });

      // move to next page
      if (trial.autoadvance === true) {
        setTimeout(() => {
          document.querySelector<HTMLElement>("#jspsych-survey-pages-next-" + current_page).click();
        }, 160);
      }
    }

    function add_current_page_to_view_history() {
      var current_time = performance.now();

      var page_view_time = Math.round(current_time - last_page_update_time);

      view_history.push({
        page_index: current_page,
        viewing_time: page_view_time,
        radio_events: radio_events,
      });

      last_page_update_time = current_time;
      radio_events = [];
    }

    const endTrial = () => {
      // Remove event listeners
      document
        .querySelectorAll(
          'form[name="jspsych-survey-pages-form"] .jspsych-survey-pages-opt input[type="radio"]'
        )
        .forEach((radio) => {
          radio.removeEventListener("click", recordRadioEvent);
        });

      // store repsonses
      var question_data = [];
      document
        .querySelectorAll(
          'form[name="jspsych-survey-pages-form"] .jspsych-survey-pages-opt input[type="radio"]:checked'
        )
        .forEach((radio) => {
          const name = radio.getAttribute("name");
          const item_pos = parseInt(radio.getAttribute("order"));
          const resp_pos = parseInt(radio.getAttribute("pos"));
          const response = parseInt(radio.getAttribute("value"));
          question_data.push({
            name: name,
            item_pos: item_pos,
            resp_pos: resp_pos,
            response: response,
          });
        });

      var trial_data = {
        responses: question_data,
        view_history: view_history,
        rt: Math.round(performance.now() - start_time),
      };
      display_element.innerHTML = "";

      this.jsPsych.finishTrial(trial_data);
    };
  }
}

export default PluginNamePlugin;
