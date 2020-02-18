// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

package com.example.dasherkeyboard

import android.inputmethodservice.InputMethodService
import android.view.View

import com.example.captivewebview.WebView
import com.example.captivewebview.WebViewBridge
import org.json.JSONObject
import java.lang.Exception


class DasherInputMethodService : InputMethodService(), WebViewBridge{

    // Captive Web View
    companion object{
        private val WEB_VIEW_ID = View.generateViewId()
    }

    enum class Dasher(var command: String) {
        COMMAND("command"),
        CONFIRM("confirm"),

        EXCEPTION("failed"),

        INSERT("insert"),
        TEXT("text"),
        REMOVED("removed"),

        READY("ready");

        override fun toString(): String {
            return this.command
        }

        companion object {
            private val map = values().associateBy(Dasher::command)

            /**
             * Convenience method to create a Dasher Command instance from a command string
             */
            fun fromCommand(command: String) = map[command]

        }
    }

    private var dasherView : WebView? = null



    // CREATE KEYBOARD
    override fun onCreateInputView(): View {

        dasherView = WebView(this.baseContext).apply {
            id = WEB_VIEW_ID
        }

        dasherView!!.requestLayout()
        dasherView!!.webViewBridge = this

        dasherView!!.loadCustomAsset(this.applicationContext, "Keyboard.html")

        dasherView!!.settings.useWideViewPort = true
        dasherView!!.settings.loadWithOverviewMode = true

        return dasherView!!
    }


    // HANDLE COMMANDS
    override fun handleCommand(jsonObject: JSONObject): JSONObject {

        var returning = jsonObject

        try {

            // Switch on each command
            when (Dasher.fromCommand(jsonObject.opt(Dasher.COMMAND.command) as String)) {
                Dasher.INSERT -> {
                    val text : CharSequence = jsonObject.opt(Dasher.TEXT.command) as CharSequence

                    // TODO HANDLE DELETE KEY

                    // Send to keyboard
                    currentInputConnection.commitText(text, text.length)

                    // Adds a trailing space if more than a single character was sent
                    if(text.length > 1) {
                        currentInputConnection.commitText(" ", 1)
                    }
                }
                Dasher.READY -> {
                    return JSONObject()
                }
                else -> {
                    // Ignore all others
                }
            }

            // confirm
            returning.put(Dasher.CONFIRM.command, "${this.javaClass.simpleName} bridge OK.")

        } catch (e : Exception) {

            // Error
            returning.put(Dasher.EXCEPTION.command, e.message)
        } finally {

            //Send confirmation
            return returning
        }
    }
}

