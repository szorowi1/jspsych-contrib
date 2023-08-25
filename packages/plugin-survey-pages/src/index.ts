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

    // define current page
    var current_page = 0;

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
    html +=
      ".jspsych-survey-pages-container {display: block; height: 300px; width: 600px; border-top: 2px solid #C8C8C8; border-left: 2px solid #C8C8C8; border-right: 2px solid #C8C8C8; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: left}";
    html += '.jspsych-survey-pages-container[status="inactive"] {display: none;}';
    html += ".jspsych-survey-pages-prompt {margin: 1em 24px 0px 24px;}";
    html +=
      ".jspsych-survey-pages-opt {display: grid; grid-auto-flow: column; justify-content: start; justify-items: start; align-items: center; column-gap: 8px; margin-top: 4px; margin: 0.75em 36px 0px 24px; padding: 4px 0 4px 0; border: 1px solid #E8E8E8; border-radius: 4px}";
    html += ".jspsych-survey-pages-opt:hover {background: #F0F0F0}";
    html += '.jspsych-survey-pages-opt input[type="radio"] {height: 18px; width: 18px}';
    html +=
      ".jspsych-survey-pages-nav {display: grid; grid-auto-flow: column; align-items: center; justify-content: space-between; height: 50px; width: 600px; background: #C8C8C8; border: 2px solid #C8C8C8; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-size: 14px;}";
    html += '.jspsych-survey-pages-container[status="inactive"] {display: none;}';
    html += "</style>";

    // iteratively add questions
    for (var i = 0; i < trial.questions.length; i++) {
      // define question
      const question = trial.questions[question_order[i]];

      // initialize form
      html += '<form name="jspsych-survey-pages" id="jspsych-survey-pages-form-' + i + '">';

      //
      html +=
        '<div class="jspsych-survey-pages-container" id="jspsych-survey-pages-container-' +
        i +
        '" status="inactive">';
      html += '<div class="jspsych-survey-pages-prompt">' + question.prompt + "</div>";
      for (let j = 0; j < question.labels.length; j++) {
        const required = question.required ? "required" : "";
        html += '<label class="jspsych-survey-pages-opt">';
        html +=
          '<input type="radio" name="' + question.name + '" value="0" ' + required + "></input>";
        html += question.labels[j];
        html += "</label>";
      }

      // add navigation bar
      // TODO: dynamic disabled
      html += '<div class="jspsych-survey-pages-nav">';

      // add back button
      const disabled = i === 0 || !trial.allow_backward ? "disabled" : "";
      html +=
        '<button type="button" ' +
        'id="jspsych-survey-pages-back-' +
        i +
        '" ' +
        'class="jspsych-btn" ' +
        'style="margin-right: 5px;"' +
        disabled +
        ">" +
        "&lt; " +
        trial.button_label_previous +
        "</button>";

      // add page number
      html += "<p>" + trial.page_label + " " + i + " of " + trial.questions.length + "</p>";

      // add next button
      html +=
        '<button type="submit" ' +
        'id="jspsych-survey-pages-next-' +
        i +
        '" ' +
        'class="jspsych-btn" ' +
        'style="margin-left: 5px;">' +
        trial.button_label_next +
        " &gt;" +
        "</button>";
      html += "</div>";

      // close nav bar
      html += "</div>";

      // close form
      html += "</form>";
    }

    //
    display_element.innerHTML = html;

    //---------------------------------------//
    // Section 3: Convenience functions
    //---------------------------------------//

    function btnListener(evt) {
      // query number of selected options on current page
      const n = display_element.querySelectorAll(
        "#jspsych-survey-pages-container-" +
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
        .querySelector("#jspsych-survey-pages-container-" + current_page)
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
        .querySelector("#jspsych-survey-pages-container-" + current_page)
        .setAttribute("status", "inactive");

      current_page++;

      // if done, finish up...
      if (current_page > trial.questions.length) {
        endTrial();
      } else {
        show_current_page();
      }
    }

    function back() {
      add_current_page_to_view_history();

      display_element
        .querySelector("#jspsych-survey-pages-container-" + current_page)
        .setAttribute("status", "inactive");

      current_page--;

      show_current_page();
    }

    function add_current_page_to_view_history() {
      var current_time = performance.now();

      var page_view_time = Math.round(current_time - last_page_update_time);

      view_history.push({
        page_index: current_page,
        viewing_time: page_view_time,
      });

      last_page_update_time = current_time;
    }

    const endTrial = () => {
      display_element.innerHTML = "";

      var trial_data = {
        view_history: view_history,
        rt: Math.round(performance.now() - start_time),
      };

      this.jsPsych.finishTrial(trial_data);
    };

    //---------------------------------------//
    // Section 2: Response handling
    //---------------------------------------//

    // initialize variables
    var view_history = [];

    var start_time = performance.now();
    var last_page_update_time = start_time;

    show_current_page();
  }
}

export default PluginNamePlugin;
