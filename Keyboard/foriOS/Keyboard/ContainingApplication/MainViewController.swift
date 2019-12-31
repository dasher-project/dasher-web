//
//  ViewController.swift
//  Keyboard
//
//  Created by Jim Hawkins on 31/12/2019.
//  Copyright © 2019 Jim Hawkins. All rights reserved.
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

