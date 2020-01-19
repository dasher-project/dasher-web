//
//  ViewController.swift
//
// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import UIKit

import CaptiveWebView

class MainViewController: CaptiveWebView.DefaultViewController {

    override func response(
        to command: String,
        in commandDictionary: Dictionary<String, Any>
        ) throws -> Dictionary<String, Any>
    {
        switch command {
        case "ready":
            return [:]
        default:
            return try super.response(to: command, in: commandDictionary)
        }
    }

}

