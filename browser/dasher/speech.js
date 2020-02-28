// Copyright 2020 VMware, Inc.
// SPDX-License-Identifier: BSD-2-Clause
//
// Original speech synthesis code copied from this article and the linked
// repository:  
// https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
// License is: CC0 1.0 Universal.
//
// The repository is licensed under Creative Commons Zero v1.0 Universal and so
// unencumbered by copyright, see:  
// https://github.com/mdn/web-speech-api/blob/master/LICENSE

export default class Speech {
    constructor() {
        this._synthesiser = window.speechSynthesis;
        this._voices = undefined;
    }

    get available() {return this._synthesiser !== undefined;}
    get voices() {return this._voices;}

    initialise(readyCallback) {
        // The getVoices methos, called in the populate method, sometimes an
        // empty list the first time it is called in Chrome. But Chrome then
        // invokes the voices changed handler and the proper list is available.
        // Some other browsers apparently don't support that handler, hence the
        // following funny looking code.
        this._populateVoiceList(false, readyCallback);
        if (this._synthesiser.onvoiceschanged !== undefined) {
            this._synthesiser.onvoiceschanged = this._populateVoiceList.bind(
                this, true, readyCallback);
        }    
    }

    _populateVoiceList(forceReady, readyCallback) {
        if (!this.available) {
            // Unavailability will be permanent and means that the getVoices
            // method can't be called. So return now.
            this._voices = [];
            readyCallback(this);
            return;
        }

        // Voice will be sorted as follows:
        //
        // -   Default voice first.
        // -   Voices in the current language next.
        // -   Voices in other languages next, in alphabetic order of language
        //     code.
        //
        // Within each language, sort by alphabetic order of name.
        const language = navigator.language;
        this._voices = this._synthesiser.getVoices();
        this._voices.sort((a, b) => {
            if (a.default && !b.default) {return -1;}
            if (!a.default && b.default) {return 1;}
            if (a.lang === language && b.lang !== language) {return -1;}
            if (a.lang !== language && b.lang === language) {return 1;}
            if (a.lang < b.lang) {return -1;}
            if (a.lang > b.lang) {return 1;}
            return a.name.localeCompare(b.name);
        });
        if (this._voices.length <= 0) {
            if (forceReady) {
                readyCallback(this);
            }
            // If the code reaches this point, the voice list was empty and this
            // is the initial call. Assume that the actual list will be coming
            // later, in an onvoiceschanged event, and return without invoking
            // the ready callback.
            return;
        }
        readyCallback(this);
    }

    speak(text, voiceIndex) {
        if (!this.available) {
            return false;
        }
        console.log(`Speak "${text}" in voice:${voiceIndex}.`);
        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceIndex !== undefined) {
            utterance.voice = this._voices[voiceIndex];
        }
        this._synthesiser.speak(utterance);
        return true;
    }

}
