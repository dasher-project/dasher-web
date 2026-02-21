// (c) 2021 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

/*
This file contains the UserInterface class which is the top of the proof of
concept code. It exports a single class, UserInterface, that manages all the
other classes.

Whichever HTML file loads this script must also load the userinterface.css file.
*/

import Limits from './limits.js';
import Piece from './piece.js';
import LanguagePalette from './languagePalette.js';
import Pointer from './pointer.js';
import ControllerRandom from './controllerrandom.js';
import ControllerPointer from './controllerpointer.js';
import Viewer from './viewer.js';
import ZoomBox from './zoombox.js';

import predictor_dummy from './predictor_dummy.js';
import predictor_basic from './predictor.js';
import predictor_test from './predictor_test.js';
import {ppmModelPredict} from './predictor_ppm.js';
import predictor_ppm_new, {
  ppmNewGetPredictor,
  ppmNewAddCorpus,
  ppmNewSetLearningEnabled,
  ppmNewGetLearningEnabled,
} from './predictor_ppm_new.js';

import Speech from './speech.js';
import KeyHandler from './keyhandler.js';

import panels from './controlpanelspecification.js';
import ControlPanel from './controlpanel.js';

import MessageDisplay from './messageDisplay.js';
import MessageStore from './messageStore.js';
import * as LanguageManager from './languageManager.js';

const messageLabelText = '';
const speechAnnouncement = 'Speech is now active.';

const defaultPredictorList = [{
  'label': 'PPM (Enhanced)', 'item': predictor_ppm_new,
}, {
  'label': 'Basic', 'item': predictor_basic,
}, {
  'label': 'None', 'item': predictor_dummy,
}, {
  'label': 'Random', 'item': predictor_test,
}, {
  'label': 'PPM (Original)', 'item': ppmModelPredict,
}];

export default class UserInterface {
  constructor(parent) {
    this._parent = parent;
    this._intervalRender = undefined;

    this._keyboardMode = parent.classList.contains('keyboard');

    this._zoomBox = null;

    this._speakOnStop = false;
    this._speech = null;
    this._voiceIndex = undefined;

    this._controllerRandom = new ControllerRandom(
        'abcdefghijklmnopqrstuvwxyz'.split(''));
    // Pointer controller will need a Pointer and it isn't set up until the
    // load().
    this._controllerPointer = undefined;
    this._controller = null;
    this._frozenClickListener = null;

    this._view = undefined;
    // this._cssNode = document.createElement('style');
    // document.head.append(this._cssNode);

    this._speedLeftRightInput = undefined;

    // Spawn and render parameters in mystery SVG units.
    this._limits = new Limits();
    this._limits.minimumFontSizePixels = 20;
    this._limits.maximumFontSizePixels = 30;
    this._limits.drawThresholdRect = 10;
    this._limits.spawnThreshold = 4;
    this._limits.textLeft = 5;
    this._limits.spawnMargin = 30;

    // This value also appears in the userinterface.css file, in the
    // --transition variable, and it's good if they're the same.
    // Reduced from 400ms to 33ms for smoother 30 FPS animation
    this._transitionMillis = 33;

    this._message = undefined;
    this._messageDisplay = new MessageDisplay(this._limits);
    this._messageStore = new MessageStore();

    this._keyHandler = new KeyHandler();

    this._diagnosticSpans = null;
    this._controlPanel = new ControlPanel(panels);
    this._panels = this._controlPanel.load();

    this._palette = new LanguagePalette('en').build();

    // Predictors setter invocation, only OK after controlPanel is loaded.
    this.predictors = defaultPredictorList;

    this._svgRect = undefined;
    this._header = undefined;
    this._gameNavBar = undefined;
    this._mainArea = undefined;
    this._messageResizeHandle = undefined;
    this._messagePane = undefined;
    this._bottomBar = undefined;
    this._prefsBar = undefined;
    this._prefsMenu = undefined;
    this._prefsBackButton = undefined;
    this._prefsContent = undefined;
    this._prefsStorage = undefined;
    this._quickControls = {};
    this._currentSpeed = 0.1;
    this._learningEnabled = ppmNewGetLearningEnabled();
    this._colourPresets = [
      {
        capital: '#f5db4d',
        numeral: '#f3a87f',
        space: '#d9d7d2',
        punctuation: '#84c96c',
        contraction: '#e5b8f7',
      },
      {
        capital: '#ffd166',
        numeral: '#ef476f',
        space: '#d7d7d7',
        punctuation: '#06d6a0',
        contraction: '#118ab2',
      },
      {
        capital: '#f3e85a',
        numeral: '#ff9e80',
        space: '#d0d4dc',
        punctuation: '#57cc99',
        contraction: '#cfa8ff',
      },
    ];
    this._activeColourPreset = 0;
    this._fontSize = 15;
    this._fontFamily = 'Arial';
    this._messagePosition = 'right';
    this._messagePaneWidth = 420;
    this._resizingMessagePane = false;
    this._uiPreferencesKey = 'dasher-ui-preferences';
    this._gameMode = false;
    this._gameTarget = '';
    this._gameLastTyped = '';
    this._gameExpectedIndex = 0;
    this._gameSentences = [
      'This is easy! I can see how Dasher works.',
      'Dasher can help me write quickly and clearly.',
      'Practice makes progress one letter at a time.',
      'I can stay calm and keep moving to the right letter.',
    ];
    this._gameStatus = undefined;
    this._gameTargetDisplay = undefined;
    this._guideLine = undefined;
    this._guideLabel = undefined;

    this._statsInlineVisible = false;
    this._statsInline = undefined;
    this._sessionStartMs = null;
    this._lastMessageForStats = '';
    this._totalTypedCharacters = 0;
    this._totalCorrections = 0;
    this._peakWpm = 0;

    this._stopCallback = null;
  }

  get header() {
    return this._header === undefined ? undefined : this._header.node;
  }

  get stopCallback() {
    return this._stopCallback;
  }
  set stopCallback(stopCallback) {
    this._stopCallback = stopCallback;
  }

  get zoomBox() {
    return this._zoomBox;
  }
  set zoomBox(newBox) {
    const oldBox = this._zoomBox;

    // Setting to the same value, do nothing.
    if (Object.is(oldBox, newBox)) {
      return;
    }

    // Set underlying property.
    this._zoomBox = newBox;

    if (newBox === null) {
      this._stop_render();

      if (oldBox !== null) {
        oldBox.erase();
      }
    }
  }

  get message() {
    return this._message;
  }
  set message(message) {
    this._message = message;
    this._messageDisplay.update(message);
    this._update_stats_from_message(message);
  }
  _save_message() {
    this._messageStore.addMessage(this.message);
  }
  get predictors() {
    return this._predictors;
  }
  set predictors(predictors) {
    this._predictors = predictors.slice();
    this._panels.main.prediction.optionList = this.predictors.map(
        (predictor) => predictor.label);
  }

  load(loadingID, footerID) {
    this._load_ui_preferences();

    this._header = new Piece('div', this._parent);
    this.header.classList.add('header', 'ui-top-bar');
    this._build_top_bar();
    this._gameNavBar = new Piece('div', this._parent);
    this._gameNavBar.node.classList.add('ui-game-nav', '_hidden');
    this._build_game_nav_bar();

    this._create_prefs_modal();

    // In keyboard mode, the control panel and all its HTML still exist but
    // never gets added to the body so it doesn't get rendered.
    this._prefsStorage = new Piece('div', this._parent);
    this._prefsStorage.node.classList.add('_hidden');
    this._controlPanelParent = (
            this._keyboardMode ? null : new Piece('form', this._prefsStorage));

    this._mainArea = new Piece('div', this._parent);
    this._mainArea.node.classList.add('ui-main-area');
    this._load_view();
    this._messageResizeHandle = new Piece('div', this._mainArea);
    this._messageResizeHandle.node.classList.add('ui-message-resizer');
    this._messagePane = new Piece('div', this._mainArea);
    this._messagePane.node.classList.add('ui-message-pane');
    this._messageDisplay.load(this._messagePane, this._keyboardMode);
    this._load_game_ui();
    this._attach_message_resizer();
    this._apply_message_position(this._messagePosition);
    this._bottomBar = new Piece('div', this._parent);
    this._bottomBar.node.classList.add('ui-bottom-bar');
    this._build_bottom_bar();

    this._header.add_child(this._keyHandler.piece);

    this._load_control_panel(loadingID);
    this._load_controls();
    this._bind_quick_controls();

    this._load_pointer();
    this._load_speed_controls();

    this._controllerPointer = new ControllerPointer(
        this._pointer, this.predictors[0].item);

    // Grab the footer, which holds some small print, and re-insert it. The
    // small print has to be in the static HTML too.
    if (footerID !== null) {
      const footer = document.getElementById(footerID);
      if (footer !== null) {
        this._parent.appendChild(footer);
      }
    }

    // Next part of loading is after a time out so that the browser gets an
    // opportunity to render the layout first.
    setTimeout(this._finish_load.bind(this), 0);

    // To-do: should be an async function that returns a promise that
    // resolves to this.
    return this;
  }

  _create_button(parent, label, className, listener) {
    const button = parent.create('button', {'type': 'button'}, label);
    className.split(/\s+/).filter((name) => name.length > 0).forEach((name) => {
      button.classList.add(name);
    });
    if (listener !== undefined) {
      button.addEventListener('click', listener);
    }
    return button;
  }

  _build_top_bar() {
    const primary = new Piece('div', this._header);
    primary.node.classList.add('ui-top-bar__left');
    this._create_button(primary, 'New', 'ui-button', () => this.reset());
    this._create_button(primary, 'Open', 'ui-button', () => {
      this._panels.message.import.listener();
    });
    this._create_button(primary, 'Save', 'ui-button', () => {
      this._save_message();
      this._panels.message.export.listener();
    });
    this._quickControls.playButton = this._create_button(
        primary, 'Play', 'ui-button', () => {
          const visible = (
            this._gameNavBar !== undefined &&
                    !this._gameNavBar.node.classList.contains('_hidden')
          );
          if (visible) {
            this._set_game_nav_visible(false);
            if (this._intervalRender !== null && this._intervalRender !== undefined) {
              this._stop_render();
            }
            return;
          }
          this._set_prefs_visible(false);
          this._set_game_nav_visible(true);
          if (this._intervalRender !== null && this._intervalRender !== undefined) {
            this._stop_render();
            this._quickControls.playButton.textContent = 'Play';
            return;
          }
          this.clicked_pointer();
          this.activate_render();
          this._quickControls.playButton.textContent = 'Pause';
        },
    );
    this._quickControls.statsButton = this._create_button(
        primary, 'View stats', 'ui-button', () => {
          if (
            this._gameNavBar === undefined ||
                    this._gameNavBar.node.classList.contains('_hidden')
          ) {
            this._set_prefs_visible(false);
            this._set_game_nav_visible(true);
          }
          this._toggle_stats_inline();
        },
    );

    const right = new Piece('div', this._header);
    right.node.classList.add('ui-top-bar__right');
    this._quickControls.prefsButton = this._create_button(
        right, 'Prefs', 'ui-button', this._toggle_prefs.bind(this),
    );
  }

  _build_game_nav_bar() {
    const secondary = new Piece('div', this._gameNavBar);
    secondary.node.classList.add('ui-game-nav__inner');
    this._quickControls.newGame = this._create_button(
        secondary, 'New game', 'ui-link-button', this._start_new_game.bind(this),
    );
    this._quickControls.startOver = this._create_button(
        secondary, 'Start over', 'ui-link-button', this._restart_game.bind(this),
    );
    this._quickControls.levelChip = secondary.create('span', {'class': 'ui-chip'}, 'Beginner');
    this._quickControls.wpmChip = secondary.create('span', {'class': 'ui-chip'}, 'WPM: 0');
    this._quickControls.accuracyChip = secondary.create('span', {'class': 'ui-chip'}, 'Accuracy: 100%');
    this._statsInline = secondary.create('span', {
      'class': 'ui-chip ui-game-stats-inline _hidden',
    }, '');
  }

  _set_game_nav_visible(visible) {
    if (this._gameNavBar === undefined) {
      return;
    }
    this._gameNavBar.node.classList.toggle('_hidden', !visible);
    this._update_secondary_nav_visibility();
    if (this._quickControls.playButton !== undefined) {
      this._quickControls.playButton.classList.toggle('ui-button_accent', visible);
    }
    if (!visible && this._statsInlineVisible) {
      this._statsInlineVisible = false;
      if (this._statsInline !== undefined) {
        this._statsInline.classList.add('_hidden');
      }
      if (this._quickControls.statsButton !== undefined) {
        this._quickControls.statsButton.textContent = 'View stats';
        this._quickControls.statsButton.classList.remove('ui-button_accent');
      }
    }
  }

  _set_prefs_visible(visible) {
    if (this._prefsBar === undefined) {
      return;
    }
    this._prefsBar.node.classList.toggle('_hidden', !visible);
    if (this._quickControls.prefsButton !== undefined) {
      this._quickControls.prefsButton.classList.toggle('ui-button_accent', visible);
    }
    if (visible) {
      this._set_prefs_level(1);
    }
    this._update_secondary_nav_visibility();
  }

  _set_prefs_level(level, panelName) {
    if (
      this._prefsMenu === undefined ||
            this._prefsContent === undefined
    ) {
      return;
    }
    const onDetails = (level === 2);
    this._prefsMenu.node.classList.toggle('_hidden', onDetails);
    this._prefsContent.node.classList.toggle('_hidden', !onDetails);
    if (this._prefsBackButton !== undefined) {
      this._prefsBackButton.classList.toggle('_hidden', !onDetails);
    }
    if (onDetails) {
      this._show_only_prefs_panel(panelName);
    } else {
      this._show_only_prefs_panel(null);
    }
  }

  _show_only_prefs_panel(panelName) {
    if (
      this._panels === undefined ||
            this._prefsContent === undefined
    ) {
      return;
    }
    this._prefsContent.node.replaceChildren();
    if (panelName === null) {
      return;
    }
    const targetPanel = this._panels[panelName];
    if (
      targetPanel !== undefined &&
            targetPanel.$ !== undefined &&
            targetPanel.$.piece !== undefined
    ) {
      this._prefsContent.node.appendChild(targetPanel.$.piece.node);
    }
  }

  _update_secondary_nav_visibility() {
    if (this._parent === undefined) {
      return;
    }
    const gameVisible = (
      this._gameNavBar !== undefined &&
            !this._gameNavBar.node.classList.contains('_hidden')
    );
    const prefsVisible = (
      this._prefsBar !== undefined &&
            !this._prefsBar.node.classList.contains('_hidden')
    );
    this._parent.classList.toggle('ui-secondary-nav-visible', gameVisible || prefsVisible);
  }

  _toggle_stats_inline() {
    this._statsInlineVisible = !this._statsInlineVisible;
    if (this._statsInline !== undefined) {
      this._statsInline.classList.toggle('_hidden', !this._statsInlineVisible);
    }
    if (this._quickControls.statsButton !== undefined) {
      this._quickControls.statsButton.textContent = (
                this._statsInlineVisible ? 'Hide stats' : 'View stats'
      );
      this._quickControls.statsButton.classList.toggle(
          'ui-button_accent', this._statsInlineVisible,
      );
    }
    this._refresh_stats_inline();
  }

  _refresh_stats_inline() {
    if (!this._statsInlineVisible || this._statsInline === undefined) {
      return;
    }
    const wpm = this._current_wpm();
    this._peakWpm = Math.max(this._peakWpm, wpm);
    const accuracy = this._current_accuracy();
    const minutes = this._session_minutes();
    this._statsInline.textContent = [
      `Elapsed ${minutes.toFixed(1)}m`,
      `Peak ${this._peakWpm.toFixed(1)} WPM`,
      `Typed ${this._totalTypedCharacters}`,
      `Fixes ${this._totalCorrections}`,
      `Accuracy ${accuracy.toFixed(1)}%`,
    ].join(' | ');
  }

  _build_bottom_bar() {
    const row = this._bottomBar.create('div', {'class': 'ui-bottom-bar__primary'});
    const createGroup = () => {
      const group = row.appendChild(document.createElement('div'));
      group.className = 'ui-control-group';
      return group;
    };

    const groupPrimary = createGroup();
    this._quickControls.language = groupPrimary.appendChild(
        document.createElement('select'),
    );
    this._quickControls.language.className = 'ui-select ui-select_language';

    const groupSpeed = createGroup();
    const speedLabel = groupSpeed.appendChild(document.createElement('span'));
    speedLabel.className = 'ui-nav-label';
    speedLabel.textContent = 'Speed';
    const speedGroup = groupSpeed.appendChild(document.createElement('div'));
    speedGroup.className = 'ui-stepper';
    this._quickControls.speedMinus = this._create_button(
        new Piece(speedGroup), '-', 'ui-step-button',
    );
    this._quickControls.speedValue = speedGroup.appendChild(document.createElement('span'));
    this._quickControls.speedValue.className = 'ui-value';
    this._quickControls.speedPlus = this._create_button(
        new Piece(speedGroup), '+', 'ui-step-button',
    );

    const groupLearning = createGroup();
    const learningLabel = groupLearning.appendChild(document.createElement('span'));
    learningLabel.className = 'ui-nav-label';
    learningLabel.textContent = 'Learning';
    this._quickControls.learning = groupLearning.appendChild(
        document.createElement('input'),
    );
    this._quickControls.learning.type = 'checkbox';
    this._quickControls.learning.className = 'ui-switch';

    const groupColours = createGroup();
    this._quickControls.colours = groupColours.appendChild(
        document.createElement('div'),
    );
    this._quickControls.colours.className = 'ui-colours';
    this._colourPresets.forEach((preset, index) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'ui-colour-dot';
      swatch.style.background = preset.capital;
      swatch.addEventListener('click', () => this._apply_colour_preset(index));
      this._quickControls.colours.appendChild(swatch);
    });
  }

  _create_prefs_modal() {
    this._prefsBar = new Piece('div', this._parent);
    this._prefsBar.node.classList.add('ui-prefs-bar', '_hidden');

    this._prefsBackButton = this._create_button(
        this._prefsBar, '‹', 'ui-icon-button ui-prefs-back _hidden', () => {
          this._set_prefs_level(1);
        },
    );

    this._prefsMenu = new Piece('div', this._prefsBar);
    this._prefsMenu.node.classList.add('ui-prefs-menu');

    this._prefsContent = new Piece('div', this._prefsBar);
    this._prefsContent.node.classList.add('ui-prefs-content', '_hidden');
  }

  _populate_prefs_navigator() {
    if (this._prefsMenu === undefined) {
      return;
    }
    this._prefsMenu.remove_all();
    [
      ['colour', 'Colour'],
      ['speed', 'Speed'],
      ['speech', 'Speech'],
      ['display', 'Display'],
      ['message', 'Messages'],
      ['manage', 'Manage'],
      ['developer', 'Developer'],
    ].forEach(([value, label]) => {
      if (this._panels[value] !== undefined) {
        this._create_button(
            this._prefsMenu, label, 'ui-button',
            () => this._set_prefs_level(2, value),
        );
      }
    });
  }

  _toggle_prefs() {
    const currentlyVisible = (
      this._prefsBar !== undefined &&
            !this._prefsBar.node.classList.contains('_hidden')
    );
    if (!currentlyVisible) {
      this._set_game_nav_visible(false);
      this._set_prefs_visible(true);
      this._set_prefs_level(1);
      return;
    }
    this._set_prefs_visible(false);
  }

  _load_game_ui() {
    const game = new Piece('div', this._messagePane);
    game.node.classList.add('ui-game');
    this._gameStatus = game.create('div', {'class': 'ui-game__status'}, '');
    this._gameTargetDisplay = game.create('div', {'class': 'ui-game__target'}, '');
    this._render_game_target();
  }

  _start_new_game() {
    this._gameMode = true;
    this._reset_stats();
    const index = Math.floor(Math.random() * this._gameSentences.length);
    this._gameTarget = this._gameSentences[index];
    this._gameLastTyped = '';
    this._gameExpectedIndex = 0;
    this._render_game_target();
    this._set_game_status('Game mode active. Follow the sentence.');
    this.reset();
  }

  _restart_game() {
    if (!this._gameMode) {
      this._start_new_game();
      return;
    }
    this._gameLastTyped = '';
    this._gameExpectedIndex = 0;
    this._render_game_target();
    this._set_game_status('Start over. Match the highlighted character.');
    this.reset();
  }

  _set_game_status(text, warning=false) {
    if (this._gameStatus === undefined) {
      return;
    }
    this._gameStatus.textContent = text;
    this._gameStatus.classList.toggle('ui-game__status_warning', warning);
  }

  _render_game_target() {
    if (this._gameTargetDisplay === undefined) {
      return;
    }
    if (!this._gameMode || this._gameTarget.length === 0) {
      this._gameTargetDisplay.textContent = '';
      return;
    }
    const typed = this._gameLastTyped || '';
    const lcp = this._longest_common_prefix(typed, this._gameTarget);

    const fragment = document.createDocumentFragment();
    const correct = document.createElement('span');
    correct.className = 'ui-game__correct';
    correct.textContent = this._gameTarget.slice(0, lcp);
    fragment.appendChild(correct);

    const current = document.createElement('span');
    current.className = 'ui-game__current';
    current.textContent = this._gameTarget.slice(lcp, lcp + 1);
    fragment.appendChild(current);

    const remaining = document.createElement('span');
    remaining.className = 'ui-game__remaining';
    remaining.textContent = this._gameTarget.slice(lcp + 1);
    fragment.appendChild(remaining);

    this._gameTargetDisplay.replaceChildren(fragment);
  }

  _ensure_guide_elements() {
    if (this._svg === undefined || this._guideLine !== undefined) {
      return;
    }
    this._guideLine = this._svg.create('line', {
      'x1': '0', 'y1': '0', 'x2': '0', 'y2': '0',
      'stroke': '#d35f5f', 'stroke-width': '2px',
      'stroke-dasharray': '6 4', 'id': 'game-guide-line',
      'pointer-events': 'none',
    });
    this._guideLabel = this._svg.create('text', {
      'x': '0', 'y': '0', 'fill': '#b04f4f',
      'font-size': '16px', 'id': 'game-guide-label',
      'pointer-events': 'none',
    }, '');
    this._hide_game_guidance();
  }

  _hide_game_guidance() {
    if (this._guideLine !== undefined) {
      this._guideLine.setAttribute('visibility', 'hidden');
    }
    if (this._guideLabel !== undefined) {
      this._guideLabel.setAttribute('visibility', 'hidden');
    }
  }

  _find_visible_box_for_character(rootBox, character) {
    if (rootBox === null || character === undefined) {
      return null;
    }
    const queue = [rootBox];
    let best = null;
    while (queue.length > 0) {
      const box = queue.shift();
      if (box.dimension_undefined()) {
        continue;
      }
      if (box.text === character) {
        if (best === null || box.height > best.height) {
          best = box;
        }
      }
      if (box.childBoxes !== undefined) {
        box.childBoxes.forEach((child) => queue.push(child));
      }
    }
    return best;
  }

  _update_game_guidance() {
    this._ensure_guide_elements();
    if (!this._gameMode || this.zoomBox === null || this._gameTarget.length === 0) {
      this._hide_game_guidance();
      return;
    }
    const typed = this._gameLastTyped || '';
    const lcp = this._longest_common_prefix(typed, this._gameTarget);
    const mismatch = (typed.length > lcp);
    if (!mismatch) {
      this._hide_game_guidance();
      return;
    }
    const expected = this._gameTarget[lcp];
    const targetBox = this._find_visible_box_for_character(this.zoomBox, expected);
    if (targetBox === null || this._guideLine === undefined || this._guideLabel === undefined) {
      this._set_game_status(
          `Wrong letter. Backtrack, then aim for "${expected}".`, true,
      );
      this._hide_game_guidance();
      return;
    }
    const x2 = targetBox.left + (targetBox.width * 0.5);
    const y2 = targetBox.middle;
    this._guideLine.setAttribute('x1', '0');
    this._guideLine.setAttribute('y1', '0');
    this._guideLine.setAttribute('x2', `${x2}`);
    this._guideLine.setAttribute('y2', `${y2}`);
    this._guideLine.setAttribute('visibility', 'visible');

    this._guideLabel.textContent = `Target: ${expected}`;
    this._guideLabel.setAttribute('x', `${x2 + 8}`);
    this._guideLabel.setAttribute('y', `${y2 - 8}`);
    this._guideLabel.setAttribute('visibility', 'visible');
    this._set_game_status(
        `Wrong letter. Backtrack, then move toward "${expected}".`, true,
    );
  }

  _update_game_progress(currentMessage) {
    if (!this._gameMode || this._gameTarget.length === 0) {
      this._hide_game_guidance();
      return;
    }
    const typed = (typeof currentMessage === 'string' ? currentMessage : '');
    this._gameLastTyped = typed;
    const lcp = this._longest_common_prefix(typed, this._gameTarget);
    this._gameExpectedIndex = lcp;

    if (typed === this._gameTarget) {
      this._set_game_status('Great job. Sentence complete.');
      this._hide_game_guidance();
    } else if (typed.length <= lcp) {
      const expected = this._gameTarget[lcp] || '';
      this._set_game_status(
                expected.length === 0 ?
                'Completed.' :
                `Next target: "${expected}"`, false,
      );
      this._hide_game_guidance();
    }
    this._render_game_target();
    this._update_game_guidance();
  }

  _load_ui_preferences() {
    try {
      const raw = window.localStorage.getItem(this._uiPreferencesKey);
      if (raw === null) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed !== null && typeof parsed === 'object') {
        if (parsed.messagePosition === 'top' || parsed.messagePosition === 'right') {
          this._messagePosition = parsed.messagePosition;
        }
        if (
          typeof parsed.messagePaneWidth === 'number' &&
                    Number.isFinite(parsed.messagePaneWidth)
        ) {
          this._messagePaneWidth = Math.max(
              220, Math.min(900, Math.round(parsed.messagePaneWidth)),
          );
        }
      }
    } catch (error) {
      console.warn('Could not load UI preferences.', error);
    }
  }

  _save_ui_preferences() {
    try {
      const payload = {
        messagePosition: this._messagePosition,
        messagePaneWidth: this._messagePaneWidth,
      };
      window.localStorage.setItem(
          this._uiPreferencesKey, JSON.stringify(payload),
      );
    } catch (error) {
      console.warn('Could not save UI preferences.', error);
    }
  }

  _apply_message_position(position) {
    this._messagePosition = (position === 'top' ? 'top' : 'right');
    if (this._mainArea !== undefined) {
      this._mainArea.node.classList.toggle(
          'ui-message-position-top', this._messagePosition === 'top',
      );
      this._mainArea.node.classList.toggle(
          'ui-message-position-right', this._messagePosition !== 'top',
      );
      this._mainArea.node.style.setProperty(
          '--message-pane-width', `${this._messagePaneWidth}px`,
      );
    }
    this._save_ui_preferences();
    this._sync_quick_controls();
    if (this._svg !== undefined && this._pointer !== undefined) {
      setTimeout(() => this._on_resize(), 0);
    }
  }

  _attach_message_resizer() {
    if (this._messageResizeHandle === undefined || this._mainArea === undefined) {
      return;
    }
    let startX = 0;
    let startWidth = this._messagePaneWidth;

    const onMove = (event) => {
      if (!this._resizingMessagePane || this._messagePosition !== 'right') {
        return;
      }
      const delta = startX - event.clientX;
      const mainRect = this._mainArea.node.getBoundingClientRect();
      const minWidth = 220;
      const maxWidth = Math.max(minWidth, Math.floor(mainRect.width * 0.6));
      this._messagePaneWidth = Math.max(
          minWidth,
          Math.min(maxWidth, startWidth + delta),
      );
      this._mainArea.node.style.setProperty(
          '--message-pane-width', `${this._messagePaneWidth}px`,
      );
      this._on_resize();
    };

    const onUp = () => {
      if (!this._resizingMessagePane) {
        return;
      }
      this._resizingMessagePane = false;
      document.body.classList.remove('ui-resizing-message');
      this._save_ui_preferences();
    };

    this._messageResizeHandle.node.addEventListener('pointerdown', (event) => {
      if (this._messagePosition !== 'right') {
        return;
      }
      this._resizingMessagePane = true;
      startX = event.clientX;
      startWidth = this._messagePaneWidth;
      document.body.classList.add('ui-resizing-message');
      this._messageResizeHandle.node.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  _apply_colour_preset(index) {
    const preset = this._colourPresets[index];
    this._activeColourPreset = index;

    this._panels.colour.fill.capital.set_value(preset.capital);
    this._panels.colour.fill.numeral.set_value(preset.numeral);
    this._panels.colour.fill.space.set_value(preset.space);
    this._panels.colour.fill.punctuation.set_value(preset.punctuation);
    this._panels.colour.fill.contraction.set_value(preset.contraction);

    Array.from(this._quickControls.colours.children).forEach((node, dotIndex) => {
      node.classList.toggle('ui-colour-dot_active', dotIndex === index);
    });
  }

  _set_font_size(value) {
    this._fontSize = Math.max(11, Math.min(24, value));
    this._limits.minimumFontSizePixels = this._fontSize + 5;
    this._limits.maximumFontSizePixels = this._fontSize + 15;
    if (this._quickControls.fontSizeValue !== undefined) {
      this._quickControls.fontSizeValue.textContent = `${this._fontSize}`;
    }
  }

  _set_font_family(value) {
    this._fontFamily = value;
    document.documentElement.style.setProperty('--ui-font-family', value);
  }

  _speed_label() {
    return this._currentSpeed.toFixed(1);
  }

  _longest_common_prefix(a, b) {
    const max = Math.min(a.length, b.length);
    let i = 0;
    while (i < max && a[i] === b[i]) {
      i += 1;
    }
    return i;
  }

  _reset_stats() {
    this._sessionStartMs = null;
    this._lastMessageForStats = '';
    this._totalTypedCharacters = 0;
    this._totalCorrections = 0;
    this._peakWpm = 0;
    this._sync_quick_controls();
  }

  _update_stats_from_message(message) {
    const current = (typeof message === 'string' ? message : '');
    this._update_game_progress(current);
    if (this._sessionStartMs === null && current.length > 0) {
      this._sessionStartMs = Date.now();
    }

    if (this._lastMessageForStats.length > 0 || current.length > 0) {
      const lcp = this._longest_common_prefix(this._lastMessageForStats, current);
      const removed = this._lastMessageForStats.length - lcp;
      const added = current.length - lcp;
      if (added > 0) {
        this._totalTypedCharacters += added;
      }
      if (removed > 0) {
        this._totalCorrections += removed;
      }
    }
    this._lastMessageForStats = current;
    this._sync_quick_controls();
  }

  _session_minutes() {
    if (this._sessionStartMs === null) {
      return 0;
    }
    return (Date.now() - this._sessionStartMs) / 60000;
  }

  _current_wpm() {
    const minutes = this._session_minutes();
    if (minutes <= 0) {
      return 0;
    }
    const words = this._lastMessageForStats.length / 5;
    return words / minutes;
  }

  _current_accuracy() {
    const attempts = this._totalTypedCharacters + this._totalCorrections;
    if (attempts <= 0) {
      return 100;
    }
    const accurate = Math.max(0, this._totalTypedCharacters - this._totalCorrections);
    return (accurate / attempts) * 100;
  }

  _sync_quick_controls() {
    if (this._quickControls.speedValue !== undefined) {
      this._quickControls.speedValue.textContent = this._speed_label();
    }
    if (this._quickControls.fontSizeValue !== undefined) {
      this._quickControls.fontSizeValue.textContent = `${this._fontSize}`;
    }
    if (this._quickControls.font !== undefined) {
      this._quickControls.font.value = this._fontFamily;
    }
    if (this._quickControls.learning !== undefined) {
      this._quickControls.learning.checked = this._learningEnabled;
    }
    if (this._quickControls.messagePosition !== undefined) {
      this._quickControls.messagePosition.value = this._messagePosition;
    }
    const wpm = this._current_wpm();
    this._peakWpm = Math.max(this._peakWpm, wpm);
    if (this._quickControls.wpmChip !== undefined) {
      this._quickControls.wpmChip.textContent = `WPM: ${wpm.toFixed(0)}`;
    }
    if (this._quickControls.accuracyChip !== undefined) {
      this._quickControls.accuracyChip.textContent = (
        `Accuracy: ${this._current_accuracy().toFixed(0)}%`
      );
    }
    this._refresh_stats_inline();
  }

  _bind_quick_controls() {
    const languages = LanguageManager.getSupportedLanguages();
    if (this._quickControls.language !== undefined) {
      this._quickControls.language.replaceChildren();
      languages.forEach((language) => {
        this._quickControls.language.appendChild(new Option(language.name));
      });
      this._quickControls.language.selectedIndex =
                this._panels.main.language.node.selectedIndex;
      this._quickControls.language.addEventListener('change', (event) => {
        this._panels.main.language.set_value({
          index: event.target.selectedIndex,
          value: event.target.value,
        });
      });
    }

    if (this._quickControls.speedMinus !== undefined) {
      this._quickControls.speedMinus.addEventListener('click', () => {
        const next = Math.max(0.1, this._currentSpeed - 0.1);
        this._panels.speed.horizontal.set_value(next);
      });
    }
    if (this._quickControls.speedPlus !== undefined) {
      this._quickControls.speedPlus.addEventListener('click', () => {
        const next = Math.min(3.0, this._currentSpeed + 0.1);
        this._panels.speed.horizontal.set_value(next);
      });
    }

    if (this._quickControls.fontSizeMinus !== undefined) {
      this._quickControls.fontSizeMinus.addEventListener('click', () => {
        this._set_font_size(this._fontSize - 1);
      });
    }
    if (this._quickControls.fontSizePlus !== undefined) {
      this._quickControls.fontSizePlus.addEventListener('click', () => {
        this._set_font_size(this._fontSize + 1);
      });
    }
    if (this._quickControls.font !== undefined) {
      this._quickControls.font.addEventListener('change', (event) => {
        this._set_font_family(event.target.value);
      });
    }

    if (this._quickControls.behaviour !== undefined) {
      this._quickControls.behaviour.selectedIndex =
                this._panels.main.behaviour.node.selectedIndex;
      this._quickControls.behaviour.addEventListener('change', (event) => {
        this._panels.main.behaviour.set_value({
          index: event.target.selectedIndex,
          value: event.target.value,
        });
      });
    }
    if (this._quickControls.messagePosition !== undefined) {
      this._quickControls.messagePosition.addEventListener('change', (event) => {
        this._apply_message_position(event.target.value);
      });
    }

    if (this._quickControls.learning !== undefined) {
      this._quickControls.learning.checked = this._learningEnabled;
      this._quickControls.learning.addEventListener('change', (event) => {
        this._learningEnabled = event.target.checked;
        ppmNewSetLearningEnabled(this._learningEnabled);
        this._sync_quick_controls();
      });
    }

    if (this._quickControls.speech !== undefined) {
      this._quickControls.speech.addEventListener('change', (event) => {
        this._panels.speech.stop.set_value(event.target.checked);
      });
    }

    if (this._quickControls.voice !== undefined) {
      this._quickControls.voice.addEventListener('change', (event) => {
        this._panels.speech.voice.set_value({
          index: event.target.selectedIndex,
          value: event.target.value,
        });
      });
    }

    this._set_font_family(this._fontFamily);
    this._set_font_size(this._fontSize);
    this._apply_colour_preset(this._activeColourPreset);
    this._sync_quick_controls();
  }

  _load_view() {
    // This element is the root of the whole zooming area.
    this._svg = new Piece('svg', this._mainArea);
    // Touching and dragging in a mobile web view will scroll or pan the
    // screen, by default. Next line suppresses that. Reference:
    // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
    this._svg.node.style['touch-action'] = 'none';
  }

  _load_control_panel(loadingID) {
    this._loading = (
            loadingID === null ? null :
            new Piece(document.getElementById(loadingID))
    );
    if (this._controlPanelParent !== null) {
      this._controlPanel.set_parent(this._controlPanelParent);
    }
    if (this._loading !== null) {
      this._panels.main.$.piece.add_child(this._loading);
    }
    if (this._controlPanelParent !== null) {
      this._controlPanel.select_panel();
    }
    this._populate_prefs_navigator();
  }

  _load_controls() {
    if (this._keyboardMode) {
      // In keyboard mode, the prediction select control is the only
      // control to be shown. The control panel parent isn't set, in
      // keyboard mode. So, pull the prediction select control out and
      // insert it as the first child of the message holder, which is
      // shown in keyboard mode.
      this._messageDisplay.loadControls(
          this._panels.main.prediction.piece);
    }

    // Set up language selector
    const supportedLanguages = LanguageManager.getSupportedLanguages();
    this._panels.main.language.optionList = supportedLanguages.map((lang) => lang.name);
    this._panels.main.language.listener = async (index) => {
      const lang = supportedLanguages[index];
      await LanguageManager.setCurrentLanguage(lang.code);
      await this._onLanguageChanged(lang);
    };

    this._panels.main.prediction.listener = (index) => {
      if (this._controllerPointer !== undefined) {
        this._controllerPointer.predictor = this.predictors[index].item;
      }
    };

    this._panels.main.behaviour.optionList = ['A', 'B'];
    this._panels.main.behaviour.listener = (index) => this._select_behaviour(
        index);

    if (!this._keyboardMode) {
      // There's a defect in speech.js that crashes in the Android
      // keyboard.
      this._load_speech_controls();
    }
    this._load_display_controls();
    this._load_message_controls();
    this._load_developer_controls();
  }

  _select_behaviour(index) {
    this._limits.targetRight = (index === 0);
    this._currentSpeed = (index === 0 ? 0.1 : 0.2);
    this._pointer.multiplierLeftRight = this._currentSpeed;
    // if (this._speedLeftRightInput !== undefined) {
    const speedLeftRightInput = this._panels.speed.horizontal.node;
    if (speedLeftRightInput !== undefined) {
      speedLeftRightInput.value = this._currentSpeed.toFixed(1);
    }
    this._limits.ratios = UserInterface._ratios[index];
    this._sync_quick_controls();
  }

  async _onLanguageChanged(language) {
    console.log(`Changing language to: ${language.name} (${language.code})`);

    // Update predictor with language-specific corpus
    // Only works with PPM (Enhanced) predictor
    try {
      const predictor = ppmNewGetPredictor();
      if (predictor) {
        // Get lexicon for the language
        const lexicon = await LanguageManager.getLexicon(language.code, 5000);

        // Create a simple training text for the language
        // (using common words from frequency list)
        const trainingText = lexicon.slice(0, 1000).join(' ');

        // Add or update the language corpus
        const corpusKey = `lang_${language.code}`;

        // Check if corpus already exists
        const corpora = predictor.getCorpora();
        if (corpora.includes(corpusKey)) {
          // Switch to existing corpus
          predictor.useCorpora([corpusKey, 'default']);
        } else {
          // Add new corpus for this language
          ppmNewAddCorpus(corpusKey, trainingText, {
            description: `${language.name} vocabulary`,
            lexicon: lexicon,
          });
          predictor.useCorpora([corpusKey]);
        }

        console.log(`Updated predictor with ${language.name} lexicon: ${lexicon.length} words`);
      }
    } catch (error) {
      console.error('Failed to update predictor for language change:', error);
    }

    // Update speech voice to match language
    if (this._speech && this._speech.available) {
      await this._updateVoiceForLanguage(language);
    }

    // Rebuild palette with language-specific alphabet
    this._palette.setLanguage(language.code);
    console.log(`Updated palette for language: ${language.name} (${this._palette.codePoints.length} code points)`);

    // Update the root template reference and reset zoom box
    this._rootTemplate = this._palette.rootTemplate;

    // Reset the zoom box with new palette if currently running
    if (this._intervalRender !== undefined && this.zoomBox) {
      // Create a new zoom box with the updated palette
      this._new_ZoomBox(false);
    }

    // Update the random controller's palette too if it's being used
    if (this._controllerRandom && this._controllerRandom.palette) {
      // The random controller has its own small palette
      // We could update it here, but for now we keep it simple
      // as it's mainly for demonstration
    }

    if (this._quickControls.language !== undefined) {
      this._quickControls.language.value = language.name;
    }
  }

  async _updateVoiceForLanguage(language) {
    if (!this._speech || !this._speech.voices) {
      return;
    }

    // Find matching voice for the language
    const match = LanguageManager.findMatchingVoice(this._speech.voices);
    if (match) {
      // Find the voice index
      this._voiceIndex = this._speech.voices.findIndex((voice) => voice === match);
      console.log(`Changed voice to: ${match.name} (${match.lang})`);

      // Update the voice selector if it exists
      if (this._panels.speech && this._panels.speech.voice) {
        const voiceOptions = this._speech.voices.map((v) => v.name);
        this._panels.speech.voice.optionList = voiceOptions;
        this._panels.speech.voice.node.value = match.name;
      }
    }
  }

  _load_speech_controls() {
    // Utility function to set the voiceIndex based on matching a name.
    // Returns true if speech has been initialised or false otherwise.
    const findVoice = (name) => {
      if (this._speech === null) {
        return false;
      }
      this._voiceIndex = this._speech.voices.findIndex(
          (voice) => voice.name === name,
      );
      if (this._voiceIndex < 0) {
        this._voiceIndex = 0;
      }
      return true;
    };
    //
    // Speak on stop checkbox listener.
    this._panels.speech.stop.listener = (checked) => {
      if (checked) {
        const found = findVoice(this._panels.speech.voice.node.value);
        // Check for a state change from unchecked to checked.
        if (found && !this._speakOnStop) {
          this._speech.speak(speechAnnouncement, this._voiceIndex);
        }
      }
      // Set the underlying property.
      this._speakOnStop = checked;
      if (this._quickControls.speech !== undefined) {
        this._quickControls.speech.checked = checked;
      }
    };
    //
    // Voice selection listener.
    this._panels.speech.voice.listener = (indexUNUSED, value) => {
      if (findVoice(value) && this._speakOnStop) {
        this._speech.speak(speechAnnouncement, this._voiceIndex);
      }
      if (this._quickControls.voice !== undefined) {
        this._quickControls.voice.value = value;
      }
    };

    new Speech().initialise((speech) => {
      this._speech = speech;
      this._panels.speech.stop.active = speech.available;
      if (speech.available) {
        const voiceGroups = [];
        speech.voices.forEach((voice) => {
          const currentLangGroup = voiceGroups.find((x) => x.label === voice.lang);

          if (currentLangGroup === undefined) {
            voiceGroups.push({
              label: voice.lang,
              values: [voice.name],
            });
          } else {
            currentLangGroup.values.push(voice.name);
          }
        });

        // So, funny thing is that sometimes speech is available in
        // principle but the voice list is empty. This happened to Jim
        // with Chromium browser for Linux. See also:
        // https://github.com/dasher-project/dasher-web/issues/101
        this._panels.speech.voice.optionList =
                    (voiceGroups.length > 0) ? voiceGroups :
                    voiceGroups.length === 0 ? ['No voices available.'] :
                    [`Voices available: ${voiceGroups.length}.`]
        ;
        const flatVoices = speech.voices.map((voice) => voice.name);
        if (this._quickControls.voice !== undefined) {
          this._quickControls.voice.replaceChildren();
          flatVoices.forEach((name) => {
            this._quickControls.voice.appendChild(new Option(name));
          });
        }
        // There's no way that voiceGroups.length should anything other
        // than zero or a positive number but just in case.

        // Auto-select voice matching current language
        const currentLang = LanguageManager.getCurrentLanguage();
        this._updateVoiceForLanguage(currentLang);
      } else {
        this._panels.speech.voice.optionList = ['Speech unavailable'];
        if (this._quickControls.voice !== undefined) {
          this._quickControls.voice.replaceChildren();
          this._quickControls.voice.appendChild(
              new Option('Speech unavailable'),
          );
        }
      }
    });
  }

  _load_display_controls() {
    const panel = this._panels.display;
    panel.popup.listener = this._messageDisplay.popupClicked.bind(this._messageDisplay);
  }
  _load_message_controls() {
    const panel = this._panels.message;
    panel.add.listener = this._save_message.bind(this);
    panel.show.listener = this._messageStore.viewMessageStore.bind(this._messageStore);
    panel.import.listener = this._messageStore.importToDatabase.bind(this._messageStore);
    panel.export.listener = this._messageStore.exportToFile.bind(this._messageStore);
  }
  _load_developer_controls() {
    const panel = this._panels.developer;
    panel.pointer.listener = this.clicked_pointer.bind(this);
    panel.random.listener = this.clicked_random.bind(this);
    panel.showDiagnostic.listener = (checked) => {
      this._limits.showDiagnostic = checked;
      this._diagnostic_div_display();
      if (!checked) {
        this._messageDisplay.setLabelText(messageLabelText);
      }
    };
    panel.frozen.listener = (checked) => {
      if (this._controllerPointer === undefined) {
        return;
      }
      const catcher = document.getElementById('catcher');
      this._controllerPointer.frozen = (
                checked ? (report) => console.log('Frozen', report) : null);
      if (checked && catcher !== null) {
        this._frozenClickListener = () => {
          console.log('catchclick');
          this._controllerPointer.report_frozen(
              this.zoomBox, this._limits, false);
        };
        catcher.addEventListener('click', this._frozenClickListener);
      } else if (catcher !== null && this._frozenClickListener !== null) {
        catcher.removeEventListener('click', this._frozenClickListener);
      }
    };
    panel.keyHandler.listener = (checked) => {
      this._keyHandler.active = checked;
    };

    this._load_advance_controls();
    this._load_diagnostic();
  }

  _diagnostic_div_display() {
    this._panels.developer.diagnostic.$.piece.node.classList.toggle(
        '_hidden', !this._limits.showDiagnostic);
  }

  _load_advance_controls() {
    const panel = this._panels.developer;
    let testX = 0;
    let testY = 0;
    const updateXY = (x, y) => {
      if (x !== null) {
        testX = x;
      }
      if (y !== null) {
        testY = y;
      }
      if (this._pointer !== undefined) {
        this._pointer.rawX = testX;
        this._pointer.rawY = testY;
      }
    };

    panel.x.listener = (value) => updateXY(value, null);
    panel.y.listener = (value) => updateXY(null, value);
    panel.advance.listener = () => {
      updateXY(null, null);
      this._start_render(false);
    };
  }

  _load_diagnostic() {
    this._diagnostic_div_display();
    // Diagnostic area in which to display various numbers. This is an array
    // so that the values can be updated.
    const diagnosticSpans = this._panels.developer.diagnostic.$.piece
        .create(
            'span', {}, [
              'loading sizes ...',
              ' ', 'pointer type', '(', 'X', ', ', 'Y', ')',
              ' height:', 'Height', ' ', 'Go',
            ]);
    this._sizesTextNode = diagnosticSpans[0].firstChild;
    this._heightTextNode =
            diagnosticSpans[diagnosticSpans.length - 3].firstChild;
    this._stopGoTextNode =
            diagnosticSpans[diagnosticSpans.length - 1].firstChild;

    this._diagnosticSpans = diagnosticSpans;
  }

  _load_pointer() {
    // Instantiate the pointer. It will draw the cross hairs and pointer
    // line, always in front of the zoombox as drawn by the viewer.
    this._pointer = new Pointer();
    this._pointer.touchEndCallback = (() => {
      if (
        this._speakOnStop &&
                this.message !== undefined &&
                this.message !== null
      ) {
        this._speech.speak(this.message, this._voiceIndex);
      }
    });
    this._diagnosticSpans[2].firstChild.nodeValue = (
            this._pointer.touch ? 'touch' : 'mouse');
    this._pointer.xTextNode = this._diagnosticSpans[4].firstChild;
    this._pointer.yTextNode = this._diagnosticSpans[6].firstChild;

    this._pointer.activateCallback = this.activate_render.bind(this);
  }

  _load_speed_controls() {
    // Speed controls can only be set up after the pointer has been loaded.

    if (this._keyboardMode) {
      // Can't show settings in input controls in keyboard mode. The input
      // would itself require a keyboard. Set some slower default values.
      this._pointer.multiplierLeftRight = 0.2;
      this._pointer.multiplierUpDown = 0.2;
      this._select_behaviour(1);
      return;
    }

    this._panels.speed.horizontal.listener = (value) => {
      this._currentSpeed = value;
      this._pointer.multiplierLeftRight = value;
      this._sync_quick_controls();
    };
    this._select_behaviour(0);
    this._panels.speed.vertical.listener = (value) => {
      this._pointer.multiplierUpDown = value;
    };
  }

  _finish_load() {
    this._limits.svgPiece = this._svg;
    this._on_resize();
    window.addEventListener('resize', this._on_resize.bind(this));

    // Initialise the view. It will insert a couple of SVG groups, and some
    // other business.
    this._view = Viewer.view(this._svg, this._limits);
    //
    // Set the pointer's SVG so it can draw the cross hairs and pointer.
    // Those go last so that they are on top of everything else.
    this._pointer.svgPiece = this._svg;

    // Remove the loading element once initialisation completes.
    if (this._loading !== null) {
      this._loading.remove();
    }

    // Previous lines could have changed the size of the svg so, after a
    // time out for rendering, process a resize.
    setTimeout(() => {
      this._on_resize();
      this.clicked_pointer();
    }, 0);

    // Activate intervals and controls.
    this._intervalRender = null;
    this._controlPanel.enable_controls();
    this._sync_quick_controls();
    this._ensure_guide_elements();
  }

  _start_render(continuous) {
    const render_one = () => {
      if (this.zoomBox === null || this._controller === null) {
        return false;
      }

      // Process one control cycle.
      this._controller.control(this.zoomBox, this._limits);
      //
      // Update diagnostic display. The toLocaleString method will insert
      // thousand separators.
      this._heightTextNode.nodeValue = this.zoomBox.height.toLocaleString(
          undefined, {maximumFractionDigits: 0});
      //
      // Update message to be the message of whichever box is across the
      // origin.
      const originHolder = this.zoomBox.holder(0, 0);
      if (this._pointer.going && (
        originHolder === undefined || (
          originHolder !== null && (
            originHolder.message === null ||
                        originHolder.message === undefined
          )
        )
      )) {
        console.log(
            'No message', originHolder,
                    (originHolder === null || originHolder === undefined) ?
                    'N/A' : originHolder.message);
      }
      this.message = (
                originHolder === null ? undefined : originHolder.message);

      // Process one draw cycle.
      this.zoomBox.viewer.draw(this._limits);

      // Check if the root box should change, either to a child or to a
      // previously trimmed parent. Note that the current root should be
      // de-rendered if it is being replace by a child.
      //
      // First, check if a previously trimmed parent should be pulled
      // back.
      let root = this.zoomBox.parent_root(this._limits);
      if (root === null) {
        // If the code gets here then there isn't a parent to pull back.
        // Check if a child of the root should become the root.
        root = this.zoomBox.child_root(this._limits);
        if (root !== null) {
          // Could de-render by setting this.zoomBox to null and
          // letting the setter take care of it. However, that would
          // result in a suspension of the render interval.
          this.zoomBox.erase();
        }
      } else {
        // Previously trimmed parent is being pulled back. Get its
        // dimensions recalculated by the controller.
        this._controller.build(root, this.zoomBox, this._limits);
      }

      if (root !== null) {
        // Invoke setter.
        this.zoomBox = root;
      }

      if (!this._controller.going) {
        this._stop_render();
      }
      return true;
    };

    if (render_one() && continuous) {
      this._stopGoTextNode.nodeValue = 'Started';
      this._intervalRender = setInterval(
          render_one, this._transitionMillis);
    } else {
      this._stop_render();
    }
  }
  _stop_render() {
    // intervalZoom is undefined only while the initial build of the page is
    // in progress.
    if (this._intervalRender === undefined) {
      return;
    }

    if (this._intervalRender !== null) {
      clearInterval(this._intervalRender);
      this._intervalRender = null;
      this._stopGoTextNode.nodeValue = 'Stopped';
      if (this._quickControls.playButton !== undefined) {
        this._quickControls.playButton.textContent = 'Play';
      }
      if (this.stopCallback !== null) {
        this.stopCallback();
      }
    }
  }
  activate_render() {
    if (this._intervalRender === undefined) {
      return;
    }

    if (this._intervalRender === null && this.zoomBox !== null) {
      this._start_render(true);
    }
  }

  // Go-Random button was clicked.
  clicked_random() {
    if (this._intervalRender === undefined) {
      return;
    }

    if (Object.is(this._controller, this._controllerRandom)) {
      // Consecutive clicks on this button stop and resume the random
      // movement.
      this._controllerRandom.going = !this._controllerRandom.going;
      this.activate_render();
    } else {
      // First click or click after clicking the pointer button. Set up
      // the random moving boxes.
      this._controllerRandom.going = true;
      this._controller = this._controllerRandom;
      this._rootTemplate = this._controller.palette.rootTemplate;
      this._new_ZoomBox(true);
    }

    // The other button will switch to pointer mode.
    this._panels.developer.pointer.node.textContent = 'Pointer';

    // This button will either stop or go.
    this._panels.developer.random.node.textContent = (
            this._controllerRandom.going ? 'Stop' : 'Go Random');
    if (this._quickControls.playButton !== undefined) {
      this._quickControls.playButton.textContent = (
                this._controllerRandom.going ? 'Pause' : 'Play');
    }
    this._sync_quick_controls();
  }

  // Pointer button was clicked.
  clicked_pointer() {
    if (this._intervalRender === undefined) {
      return;
    }

    if (!Object.is(this._controller, this._controllerPointer)) {
      // Current mode is random. Change this button's label to indicate
      // what it does if clicked again.
      this._panels.developer.pointer.node.textContent = 'Reset';
    }

    this._controller = this._controllerPointer;
    // Next line will discard the current zoom box, which will effect a
    // reset, if the mode was already pointer.
    this._rootTemplate = this._palette.rootTemplate;
    this._new_ZoomBox(false);

    // The other button will switch to random mode.
    this._panels.developer.random.node.textContent = 'Go Random';
    if (this._quickControls.playButton !== undefined) {
      this._quickControls.playButton.textContent = 'Play';
    }
    this._sync_quick_controls();
  }

  _new_ZoomBox(startRender) {
    // Setter invocation that will de-render the current box, if any.
    this.zoomBox = null;

    // Root template is set at the same time as the controller.
    const zoomBox = new ZoomBox(this._rootTemplate, [], 0, 0);
    zoomBox.viewer = new Viewer(zoomBox, this._view);

    // Setter invocation.
    this.zoomBox = zoomBox;

    // The populate() method is async, so that a predictor could be called.
    this._controller.populate(this.zoomBox, this._limits)
        .then(() => this._start_render(startRender))
        .catch((error) => {
          // The thrown error mightn't be noticed, if the console isn't
          // visible. So, set it into the message too.
          this.message = `ZoomBox couldn't be made ready.\n${error}`;
          throw error;
        });
  }

  reset() {
    this._new_ZoomBox(false);
  }

  static bbox_text(boundingBox, label) {
    return [
            label === undefined ? '' : label,
            '(',
            ['x', 'y', 'width', 'height']
                .map((property) => boundingBox[property].toFixed(2))
                .join(', '),
            ')',
    ].join('');
  }

  get svgRect() {
    return this._svgRect;
  }
  set svgRect(boundingClientRect) {
    this._svgRect = boundingClientRect;
    if (this._pointer !== undefined) {
      this._pointer.svgBoundingBox = boundingClientRect;
    }
    this._limits.set(boundingClientRect.width, boundingClientRect.height);
    if (this._view !== undefined) {
      // Redraw the solver-right mask and border.
      Viewer.configure_view(this._view, this._limits);
    }
  }

  _on_resize() {
    this.svgRect = this._svg.node.getBoundingClientRect();

    if (this._controller !== null) {
      this._controller.populate(this.zoomBox, this._limits);
    }

    // Change the svg viewBox so that the origin is in the centre.
    this._svg.node.setAttribute('viewBox',
        `${this.svgRect.width * -0.5} ${this.svgRect.height * -0.5}` +
                ` ${this.svgRect.width} ${this.svgRect.height}`,
    );

    // Update the diagnostic display with all the sizes.
    this._sizesTextNode.nodeValue = [
      `window(${window.innerWidth}, ${window.innerHeight})`,
      UserInterface.bbox_text(
          document.body.getBoundingClientRect(), 'body'),
      UserInterface.bbox_text(
          this.svgRect, 'svg'),
    ].join(' ');
    // Reference for innerHeight property.
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight
  }
}

UserInterface._ratios = [[
  {left: 1 / 3, height: 0.01},
  {left: 1 / 5, height: 0.05},
  {left: 1 / -6, height: 0.5},
  {left: 1 / -3, height: 1},
], [
  {left: 0.34, height: 0.01},
  {left: 0.33, height: 0.02},
  {left: 0.16, height: 0.25},
  {left: 0, height: 0.475},
  {left: -0.16, height: 1},
]];
